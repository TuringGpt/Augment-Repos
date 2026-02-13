from rest_framework.generics import ListAPIView, RetrieveUpdateDestroyAPIView, GenericAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Notification
from .serializers import MarkAsReadSerializer, NotificationListSerializer, UpdateNotificationSerializer
from core.optimization import AutoOptimizeMixin
from core.service import CachedListMixin, CacheInvalidatorMixin, BaseCacheService


class NotificationCacheService(BaseCacheService):
    OBJECT_NAME = "notification"
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
        return Response(notifications, status=status.HTTP_200_OK)


class ListNotificationView(CachedListMixin, BaseNotificationView, ListAPIView):
    serializer_class = NotificationListSerializer
    cache_service_class = NotificationCacheService
    cache_ttl = 60  # 1 minute - keep short for timely notification updates


class UnreadNotificationCountView(BaseNotificationView, RetrieveAPIView):
    """
    Get unread notification count for the current user.
    """
    def get(self, request, *args, **kwargs):
        service = NotificationCountCacheService()
        user_id = request.user.id
        cache_key = service.get_cache_key(user_id=user_id)
        
        count = service.get(cache_key)
        if count is None:
            count = Notification.objects.filter(user=request.user, is_read=False).count()
            service.set(cache_key, count, ttl=300) # Cache for 5 mins
            
        return Response({"unread_count": count})


class UpdateNotificationView(BaseNotificationView, RetrieveUpdateDestroyAPIView):
    serializer_class = UpdateNotificationSerializer
    permission_classes = [IsAuthenticated]
    cache_service_class = NotificationCacheService
