from django.contrib import admin
from .models import Currency
from .services import CurrencyCacheService


@admin.register(Currency)
class CurrencyAdmin(admin.ModelAdmin):
    list_display = ["name", "code", "symbol", "is_deleted"]
    search_fields = ["name", "code", "symbol"]
    list_filter = ["is_deleted"]

    def _invalidate_cache(self):
        CurrencyCacheService().clear_namespace()

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        self._invalidate_cache()

    def delete_model(self, request, obj):
        super().delete_model(request, obj)
        self._invalidate_cache()

    def delete_queryset(self, request, queryset):
        super().delete_queryset(request, queryset)
        self._invalidate_cache()

    def save_formset(self, request, form, formset, change):
        super().save_formset(request, form, formset, change)
        self._invalidate_cache()
