from django.shortcuts import get_object_or_404
from .models import Ticket, Comment
from .serializers import TicketListSerializer, TicketCreateSerializer, TicketUpdateSerializer, TicketDetailSerializer, CommentSerializer, CommentCreateSerializer, CommentUpdateSerializer
from rest_framework.generics import CreateAPIView, ListAPIView, RetrieveUpdateDestroyAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from core.optimization import AutoOptimizeMixin
from core.service import CachedListMixin, CacheInvalidatorMixin, BaseCacheService


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
    

class TicketCreateView(CacheInvalidatorMixin, TicketBaseView, CreateAPIView):
    serializer_class = TicketCreateSerializer
    cache_service_class = TicketCacheService
        
    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)
        self.invalidate_cache()

class TicketDetailView(TicketBaseView, RetrieveAPIView):
    serializer_class = TicketDetailSerializer

class TicketUpdateView(CacheInvalidatorMixin, TicketBaseView, RetrieveUpdateDestroyAPIView):
    serializer_class = TicketUpdateSerializer
    cache_service_class = TicketCacheService
    
class CommentBaseView(AutoOptimizeMixin):
    permission_classes = [IsAuthenticated]
    queryset = Comment.objects.all()
    auto_select_related = ['user', 'ticket']

class CommentListView(CachedListMixin, CommentBaseView, ListAPIView):
    serializer_class = CommentSerializer
    cache_service_class = CommentCacheService
    cache_ttl = 60 * 15
    
    def get_queryset(self):
        ticket_id = self.kwargs.get("pk")
        get_object_or_404(Ticket, id=ticket_id)
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
    
class CommentDeleteView(CacheInvalidatorMixin, CommentBaseView, RetrieveUpdateDestroyAPIView):
    serializer_class = CommentUpdateSerializer
    cache_service_class = CommentCacheService
    lookup_url_kwarg = 'comment_pk'
    http_method_names = ['delete', 'options']

    def get_queryset(self):
        ticket_id = self.kwargs.get("pk")
        return super().get_queryset().filter(ticket_id=ticket_id)