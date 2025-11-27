from django.urls import path
from .views import ListNotificationView

app_name = "notifications"

urlpatterns = [
    path('', ListNotificationView.as_view(), name='list_notification'),
]
