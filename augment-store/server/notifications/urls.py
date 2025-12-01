from django.urls import path
from .views import ListNotificationView, MarkAllAsReadView, UpdateNotificationView

app_name = "notifications"

urlpatterns = [
    path('', ListNotificationView.as_view(), name='list_notification'),
    path('<uuid:pk>/', UpdateNotificationView.as_view(), name='update_notification'),
    path('mark-as-read/', MarkAllAsReadView.as_view(), name='mark_all_as_read'),
]
