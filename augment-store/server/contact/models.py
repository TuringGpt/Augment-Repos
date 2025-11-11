from django.db import models
from core.models import BaseModel

# Create your models here.
class ContactMessage(BaseModel):
    name = models.CharField(max_length=255)
    email = models.EmailField()
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
