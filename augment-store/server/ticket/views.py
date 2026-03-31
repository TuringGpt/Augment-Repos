from django.shortcuts import get_object_or_404
from .models import Ticket, Comment
from .serializers import TicketListSerializer, TicketCreateSerializer, TicketUpdateSerializer, TicketDetailSerializer, CommentSerializer, CommentCreateSerializer, CommentUpdateSerializer
from rest_framework.generics import CreateAPIView, ListAPIView, RetrieveUpdateDestroyAPIView, RetrieveAPIView, GenericAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from accounts.permissions import hasAdminRole
from core.optimization import AutoOptimizeMixin
from core.service import CachedListMixin, CacheInvalidatorMixin, BaseCacheService
from django.core.cache import cache as django_cache
from django.db.models import Count, Q


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
        queryset = super().get_queryset().annotate(
            comment_count=Count('comments')
        ).order_by('-created_at')

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(title__icontains=search)

        priority_filter = self.request.query_params.get('priority')
        if priority_filter:
            valid_priorities = [p.value for p in Ticket.Priority]
            if priority_filter.lower() not in valid_priorities:
                raise ValidationError({'priority': f'Invalid priority. Must be one of: {", ".join(valid_priorities)}'})
            queryset = queryset.filter(priority__iexact=priority_filter)

        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset


class UserTicketsView(TicketBaseView, ListAPIView):
    serializer_class = TicketListSerializer

    def get_queryset(self):
        return super().get_queryset().filter(
            reporter=self.request.user
        ).order_by('-created_at')


class AdminTicketsView(TicketBaseView, ListAPIView):
    serializer_class = TicketListSerializer
    permission_classes = [hasAdminRole]

    def get_queryset(self):
        queryset = super().get_queryset().order_by('-created_at')
        user_id = self.request.query_params.get('user_id')
        if user_id:
            import uuid as uuid_mod
            try:
                uuid_mod.UUID(user_id)
            except ValueError:
                raise ValidationError({'user_id': 'Invalid UUID format'})
            queryset = queryset.filter(reporter_id=user_id)
        return queryset

def _invalidate_stats_cache(user):
    django_cache.delete(f"ticket_stats:{user.id}")
    django_cache.delete("ticket_stats:admin")


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
    permission_classes = [IsAuthenticated, hasAdminRole]

    def perform_update(self, serializer):
        instance = serializer.instance
        reporter = instance.reporter
        super().perform_update(serializer)
        CommentCacheService().clear_namespace()
        _invalidate_stats_cache(self.request.user)
        if reporter != self.request.user:
            _invalidate_stats_cache(reporter)

    def perform_destroy(self, instance):
        reporter = instance.reporter
        super().perform_destroy(instance)
        CommentCacheService().clear_namespace()
        _invalidate_stats_cache(self.request.user)
        if reporter != self.request.user:
            _invalidate_stats_cache(reporter)
    
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

    def get(self, request, *args, **kwargs):
        cache_key = f"ticket_stats:{request.user.id}"
        
        stats = django_cache.get(cache_key)
        if stats is None:
            known_statuses = Ticket.Status.values
            aggregates = Ticket.objects.filter(reporter=request.user).aggregate(
                total=Count("id"),
                **{s: Count("id", filter=Q(status=s)) for s in known_statuses},
            )
            known_sum = sum(aggregates[s] for s in known_statuses)
            stats = {
                **aggregates,
                "other": aggregates["total"] - known_sum,
            }
            django_cache.set(cache_key, stats, 600)
            
        return Response(stats)
    
class AdminTicketStatsView(GenericAPIView):
    """
    Get ticket statistics for all tickets (admin only).
    """
    permission_classes = [IsAuthenticated, hasAdminRole]

    def get(self, request, *args, **kwargs):
        cache_key = "ticket_stats:admin"
        
        stats = django_cache.get(cache_key)
        if stats is None:
            known_statuses = Ticket.Status.values
            aggregates = Ticket.objects.aggregate(
                total=Count("id"),
                **{s: Count("id", filter=Q(status=s)) for s in known_statuses},
            )
            known_sum = sum(aggregates[s] for s in known_statuses)
            stats = {
                **aggregates,
                "other": aggregates["total"] - known_sum,
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