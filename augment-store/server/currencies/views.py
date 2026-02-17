from django.db import IntegrityError
from rest_framework.generics import ListAPIView, CreateAPIView
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.exceptions import ValidationError
from accounts.permissions import hasAdminRole
from .models import Currency
from .serializers import ListCurrencySerializer, CreateCurrencySerializer
from .services import CurrencyCacheService
from core.optimization import AutoOptimizeMixin
from core.service import CachedListMixin, CacheInvalidatorMixin


class CurrencyListView(CachedListMixin, AutoOptimizeMixin, ListAPIView):
    """
    List all supported currencies.
    """
    serializer_class = ListCurrencySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    queryset = Currency.objects.filter(is_deleted=False).order_by('code')
    cache_service_class = CurrencyCacheService
    cache_ttl = 60 * 60 * 24 * 30  # 30 days - currencies change rarely 

class CreateCurrencyView(CacheInvalidatorMixin, CreateAPIView):
    """
    Admin-only: Create a new currency.
    """
    serializer_class = CreateCurrencySerializer
    permission_classes = [IsAuthenticated, hasAdminRole]
    queryset = Currency.objects.all()
    cache_service_class = CurrencyCacheService

    def perform_create(self, serializer):
        try:
            super().perform_create(serializer)
        except IntegrityError:
            # Handle race conditions where uniqueness check passes but DB save fails
            raise ValidationError({
                "detail": "A currency with this name or code already exists."
            })
