from django.db import models
from core.models import BaseModel


class CurrencyManager(models.Manager):
    def get_by_code(self, code: str):
        try:
            return self.get(code=code)
        except self.model.DoesNotExist:
            return None


class Currency(BaseModel):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=255)
    symbol = models.CharField(max_length=255)

    objects = CurrencyManager()
