from django.db import models
from core.models import BaseModel


class Currency(BaseModel):
    name = models.CharField(max_length=255, unique=True)
    code = models.CharField(max_length=255, unique=True)
    symbol = models.CharField(max_length=255)

    def save(self, *args, **kwargs):
        if self.code:
            self.code = self.code.upper().strip()
        if self.name:
            self.name = self.name.strip().lower()
        super().save(*args, **kwargs)
