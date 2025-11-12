from django.db import models
from core.models import BaseModel

# Create your models here.
class Newsletter(BaseModel):
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)