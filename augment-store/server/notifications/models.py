from django.db import models
from core.models import BaseModel
from accounts.models import User

class Notification(BaseModel):

    title = models.CharField(max_length=255)
    description = models.TextField()
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    is_read = models.BooleanField(default=False)

    model = models.CharField(max_length=1024, null=True, blank=True)
    object_id = models.CharField(max_length=255, null=True, blank=True)
