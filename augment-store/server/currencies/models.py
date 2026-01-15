from django.db import models
from core.models import BaseModel


class CurrencyManager(models.Manager):
    def get_by_code(self, code: str):
        return self.get(code=code)


class Currency(BaseModel):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=255)
    symbol = models.CharField(max_length=255)

    objects = CurrencyManager()
