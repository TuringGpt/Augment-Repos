from django.urls import path
from .views import ListNotificationView, UpdateNotificationView, MarkAllAsReadView, UnreadNotificationCountView

app_name = "notifications"

urlpatterns = [
    path('', ListNotificationView.as_view(), name='list_notification'),
    path('unread-count/', UnreadNotificationCountView.as_view(), name='unread_notification_count'),
    path('<uuid:pk>/', UpdateNotificationView.as_view(), name='update_notification'),
    path('mark-all-as-read/', MarkAllAsReadView.as_view(), name='mark_all_as_read'),
]
