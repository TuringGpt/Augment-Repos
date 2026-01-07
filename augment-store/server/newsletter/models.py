from django.db import models

from core.models import BaseModel


# Create your models here.
class Newsletter(BaseModel):
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
