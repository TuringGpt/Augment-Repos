from rest_framework.generics import ListAPIView, UpdateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Notification
from .serializers import NotificationListSerializer, UpdateNotificationSerializer


class BaseNotificationView:
    serializer_class = NotificationListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.get_user_notifications(self.request.user)

class ListNotificationView(BaseNotificationView, ListAPIView):
    serializer_class = NotificationListSerializer
    

class UpdateNotificationView(BaseNotificationView, UpdateAPIView):
    serializer_class = UpdateNotificationSerializer
    permission_classes = [IsAuthenticated]
    