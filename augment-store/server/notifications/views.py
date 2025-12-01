from rest_framework.generics import ListAPIView, RetrieveUpdateDestroyAPIView, GenericAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Notification
from .serializers import NotificationListSerializer, UpdateNotificationSerializer
from .serializers import MarkAsReadSerializer, NotificationListSerializer, UpdateNotificationSerializer


class BaseNotificationView:
    serializer_class = NotificationListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.get_user_notifications(self.request.user)

class MarkAllAsReadView(BaseNotificationView, GenericAPIView):
    serializer_class = MarkAsReadSerializer
    permission_classes = [IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        notifications = serializer.update(None, serializer.validated_data)
        return Response(notifications, status=status.HTTP_200_OK)

class ListNotificationView(BaseNotificationView, ListAPIView):
    serializer_class = NotificationListSerializer
    

class UpdateNotificationView(BaseNotificationView, RetrieveUpdateDestroyAPIView):
    serializer_class = UpdateNotificationSerializer
    permission_classes = [IsAuthenticated]

