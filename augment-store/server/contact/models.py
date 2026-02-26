from django.db import models
from core.models import BaseModel

class ContactMessage(BaseModel):
    class Status(models.TextChoices):
        UNREAD = 'unread', 'Unread'
        READ = 'read', 'Read'
        RESOLVED = 'resolved', 'Resolved'

    name = models.CharField(max_length=255)
    email = models.EmailField()
    subject = models.CharField(max_length=255, default="")
    message = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.UNREAD
    )
