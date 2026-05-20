from django.urls import path
from .views import (ListNotificationView, UpdateNotificationView, 
                    MarkAllAsReadView, UnreadNotificationCountView,
                    AdminNotificationListView, AdminNotificationUpdateView)

app_name = "notifications"

urlpatterns = [
    path('', ListNotificationView.as_view(), name='list_notification'),
    path('unread-count/', UnreadNotificationCountView.as_view(), name='unread_notification_count'),
    path('<uuid:pk>/', UpdateNotificationView.as_view(), name='update_notification'),
    path('mark-all-as-read/', MarkAllAsReadView.as_view(), name='mark_all_as_read'),
    path('admin/', AdminNotificationListView.as_view(), name='admin_notification_list'),
    path('admin/<uuid:pk>/', AdminNotificationUpdateView.as_view(), name='admin_notification_update'),
]
