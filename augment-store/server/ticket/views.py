from django.shortcuts import get_object_or_404
from .models import Ticket, Comment
from .serializers import TicketListSerializer, TicketCreateSerializer, TicketUpdateSerializer, TicketDetailSerializer, CommentSerializer, CommentCreateSerializer, CommentUpdateSerializer
from rest_framework.generics import CreateAPIView, ListAPIView, RetrieveUpdateDestroyAPIView, RetrieveAPIView, GenericAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from core.optimization import AutoOptimizeMixin
from core.service import CachedListMixin, CacheInvalidatorMixin, BaseCacheService
from django.core.cache import cache as django_cache


class TicketCacheService(BaseCacheService):
    OBJECT_NAME = "ticket"
    VERSION = 1


class CommentCacheService(BaseCacheService):
    OBJECT_NAME = "comment"
    VERSION = 1


class TicketBaseView(AutoOptimizeMixin):
    permission_classes = [IsAuthenticated]
    queryset = Ticket.objects.all()
    auto_select_related = ['reporter', 'assignee']

class TicketListView(CachedListMixin, TicketBaseView, ListAPIView):
    serializer_class = TicketListSerializer
    cache_service_class = TicketCacheService
    cache_ttl = 60 * 10

    def get_queryset(self):
        return super().get_queryset().order_by('-created_at')
    

def _invalidate_stats_cache(user):
    django_cache.delete(f"ticket_stats:{user.id}")


class TicketCreateView(CacheInvalidatorMixin, TicketBaseView, CreateAPIView):
    serializer_class = TicketCreateSerializer
    cache_service_class = TicketCacheService
        
    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)
        self.invalidate_cache()
        _invalidate_stats_cache(self.request.user)

class TicketDetailView(TicketBaseView, RetrieveAPIView):
    serializer_class = TicketDetailSerializer

class TicketUpdateView(CacheInvalidatorMixin, TicketBaseView, RetrieveUpdateDestroyAPIView):
    serializer_class = TicketUpdateSerializer
    cache_service_class = TicketCacheService

    def perform_update(self, serializer):
        super().perform_update(serializer)
        CommentCacheService().clear_namespace()
        _invalidate_stats_cache(self.request.user)

    def perform_destroy(self, instance):
        super().perform_destroy(instance)
        CommentCacheService().clear_namespace()
        _invalidate_stats_cache(self.request.user)
    
class CommentBaseView(AutoOptimizeMixin):
    permission_classes = [IsAuthenticated]
    queryset = Comment.objects.all()
    auto_select_related = ['user', 'ticket']

class CommentListView(CachedListMixin, CommentBaseView, ListAPIView):
    serializer_class = CommentSerializer
    cache_service_class = CommentCacheService
    cache_ttl = 60 * 15

    def generate_cache_key(self):
        service = self.get_cache_service()
        ticket_id = self.kwargs.get("pk")
        user_id = getattr(self.request.user, "id", None)
        serialized_params = service._serialize_params(self.request.query_params)
        custom_key = f"{user_id}:{ticket_id}:{serialized_params}"
        return service.get_cache_key(custom_key=custom_key)

    def list(self, request, *args, **kwargs):
        # Validate ticket exists before serving cached data
        ticket_id = self.kwargs.get("pk")
        get_object_or_404(Ticket, id=ticket_id)
        return super().list(request, *args, **kwargs)
    
    def get_queryset(self):
        ticket_id = self.kwargs.get("pk")
        return super().get_queryset().filter(ticket_id=ticket_id).order_by('-created_at')
    
class CommentCreateView(CacheInvalidatorMixin, CommentBaseView, CreateAPIView):
    serializer_class = CommentCreateSerializer
    cache_service_class = CommentCacheService
    
    def perform_create(self, serializer):
        ticket_id = self.kwargs.get("pk")
        ticket = get_object_or_404(Ticket, id=ticket_id)
        serializer.save(user=self.request.user, ticket=ticket)
        self.invalidate_cache()

class CommentUpdateView(CacheInvalidatorMixin, CommentBaseView, RetrieveUpdateDestroyAPIView):
    serializer_class = CommentUpdateSerializer
    cache_service_class = CommentCacheService
    lookup_url_kwarg = 'comment_pk'
    http_method_names = ['get', 'put', 'patch', 'head', 'options']

    def get_queryset(self):
        ticket_id = self.kwargs.get("pk")
        return super().get_queryset().filter(ticket_id=ticket_id)

class TicketStatsView(GenericAPIView):
    """
    Get ticket statistics for the current user.
    """
    permission_classes = [IsAuthenticated]
    KNOWN_STATUSES = ["open", "in_progress", "resolved", "closed"]

    def get(self, request, *args, **kwargs):
        cache_key = f"ticket_stats:{request.user.id}"
        
        stats = django_cache.get(cache_key)
        if stats is None:
            queryset = Ticket.objects.filter(reporter=request.user)
            total = queryset.count()
            known_counts = {s: queryset.filter(status=s).count() for s in self.KNOWN_STATUSES}
            known_sum = sum(known_counts.values())
            stats = {
                "total": total,
                **known_counts,
                "other": total - known_sum,
            }
            django_cache.set(cache_key, stats, 600)
            
        return Response(stats)
    
class CommentDeleteView(CacheInvalidatorMixin, CommentBaseView, RetrieveUpdateDestroyAPIView):
    serializer_class = CommentUpdateSerializer
    cache_service_class = CommentCacheService
    lookup_url_kwarg = 'comment_pk'
    http_method_names = ['delete', 'options']

    def get_queryset(self):
        ticket_id = self.kwargs.get("pk")
        return super().get_queryset().filter(ticket_id=ticket_id)