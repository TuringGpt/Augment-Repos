from django.db import models

from core.models import BaseModel


class Currency(BaseModel):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=255)
    symbol = models.CharField(max_length=255)
