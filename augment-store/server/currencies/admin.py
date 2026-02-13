from django.contrib import admin
from .models import Currency
from .views import CurrencyCacheService


@admin.register(Currency)
class CurrencyAdmin(admin.ModelAdmin):
    list_display = ["name", "code", "symbol", "is_deleted"]
    search_fields = ["name", "code", "symbol"]
    list_filter = ["is_deleted"]

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        # Invalidate cache on any admin change
        CurrencyCacheService().clear_namespace()

    def delete_model(self, request, obj):
        super().delete_model(request, obj)
        CurrencyCacheService().clear_namespace()
