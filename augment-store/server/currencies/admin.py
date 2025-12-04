from django.contrib import admin
from .models import Currency


@admin.register(Currency)
class CurrencyAdmin(admin.ModelAdmin):
    list_display = ["name", "code", "symbol"]
    search_fields = ["name", "code", "symbol"]
