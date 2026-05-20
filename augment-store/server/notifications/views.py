from rest_framework.generics import ListAPIView, RetrieveUpdateDestroyAPIView, GenericAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Notification
from .serializers import MarkAsReadSerializer, NotificationListSerializer, UpdateNotificationSerializer, UnreadCountSerializer
from accounts.permissions import hasAdminRole
from core.optimization import AutoOptimizeMixin
from core.service import CachedListMixin, CacheInvalidatorMixin, BaseCacheService


class NotificationCacheService(BaseCacheService):
    OBJECT_NAME = "notification"
    VERSION = 2

class AdminNotificationCacheService(BaseCacheService):
    OBJECT_NAME = "admin_notification"
    VERSION = 1


class NotificationCountCacheService(BaseCacheService):
    OBJECT_NAME = "notification_count"
    VERSION = 1


class BaseNotificationView(AutoOptimizeMixin):
    serializer_class = NotificationListSerializer
    permission_classes = [IsAuthenticated]
    queryset = Notification.objects.all()
    auto_select_related = ['user']

    def get_queryset(self):
        return super().get_queryset().filter(user=self.request.user).order_by('-created_at', '-id')


class MarkAllAsReadView(CacheInvalidatorMixin, BaseNotificationView, GenericAPIView):
    serializer_class = MarkAsReadSerializer
    permission_classes = [IsAuthenticated]
    cache_service_class = NotificationCacheService

    def patch(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        notifications = serializer.update(None, serializer.validated_data)
        self.invalidate_cache()
        NotificationCountCacheService().clear_namespace()
        return Response(notifications, status=status.HTTP_200_OK)


class ListNotificationView(CachedListMixin, BaseNotificationView, ListAPIView):
    serializer_class = NotificationListSerializer
    cache_service_class = NotificationCacheService
    cache_ttl = 60  # 1 minute - keep short for timely notification updates

    def get_queryset(self):
        from rest_framework.exceptions import ValidationError
        
        queryset = super().get_queryset()
        is_read_param = self.request.query_params.get('is_read')
        
        if is_read_param is not None:
            is_read_str = is_read_param.lower()
            if is_read_str in ['true', '1']:
                is_read = True
            elif is_read_str in ['false', '0']:
                is_read = False
            else:
                raise ValidationError({'is_read': 'Must be true, false, 1, or 0'})
                
            queryset = queryset.filter(is_read=is_read)
        return queryset


class UnreadNotificationCountView(BaseNotificationView, RetrieveAPIView):
    """
    Get unread notification count for the current user.
    """
    serializer_class = UnreadCountSerializer

    def get(self, request, *args, **kwargs):
        service = NotificationCountCacheService()
        user_id = request.user.id
        cache_key = service.get_cache_key(user_id=user_id)
        
        count = service.get(cache_key)
        if count is None:
            count = Notification.objects.filter(user=request.user, is_read=False).count()
            service.set(cache_key, count, ttl=300)
            
        return Response({"unread_count": count})


class UpdateNotificationView(CacheInvalidatorMixin, BaseNotificationView, RetrieveUpdateDestroyAPIView):
    serializer_class = UpdateNotificationSerializer
    permission_classes = [IsAuthenticated]
    cache_service_class = NotificationCacheService

    def perform_update(self, serializer):
        super().perform_update(serializer)
        NotificationCountCacheService().clear_namespace()

    def perform_destroy(self, instance):
        super().perform_destroy(instance)
        NotificationCountCacheService().clear_namespace()

class AdminNotificationListView(CachedListMixin, BaseNotificationView, ListAPIView):
    """Admin-only view to list all notifications globally."""
    permission_classes = [IsAuthenticated, hasAdminRole]
    cache_service_class = AdminNotificationCacheService
    cache_ttl = 60
    
    def get_queryset(self):
        # Bypass the user=request.user filter to list globally
        return Notification.objects.all().order_by('-created_at', '-id')

class AdminNotificationUpdateView(CacheInvalidatorMixin, BaseNotificationView, RetrieveUpdateDestroyAPIView):
    """Admin-only view to moderate notifications directly."""
    permission_classes = [IsAuthenticated, hasAdminRole]
    cache_service_class = AdminNotificationCacheService
    serializer_class = UpdateNotificationSerializer
    
    def get_queryset(self):
        # Bypass the default constraint to allow mutating any notification
        return Notification.objects.all().order_by('-created_at', '-id')

    def perform_update(self, serializer):
        super().perform_update(serializer)
        NotificationCountCacheService().clear_namespace()
        NotificationCacheService().clear_namespace()

    def perform_destroy(self, instance):
        super().perform_destroy(instance)
        NotificationCountCacheService().clear_namespace()
        NotificationCacheService().clear_namespace()
