from django.db import models
from core.models import BaseModel
from accounts.models import User


class NotificationManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().order_by('-created_at')
    
    def get_user_notifications(self, user):
        return self.get_queryset().filter(user=user)

class Notification(BaseModel):

    title = models.CharField(max_length=255)
    description = models.TextField()
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    is_read = models.BooleanField(default=False)

    model = models.CharField(max_length=1024, null=True, blank=True)
    object_id = models.CharField(max_length=255, null=True, blank=True)

    objects:NotificationManager = NotificationManager()
