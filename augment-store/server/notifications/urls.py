from django.urls import path
from .views import ListNotificationView, UpdateNotificationView

app_name = "notifications"

urlpatterns = [
    path('', ListNotificationView.as_view(), name='list_notification'),
    path('<uuid:pk>/', UpdateNotificationView.as_view(), name='update_notification'),
]
