from rest_framework.generics import ListAPIView, CreateAPIView
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from accounts.permissions import hasAdminRole
from .models import Currency
from .serializers import ListCurrencySerializer, CreateCurrencySerializer
from core.optimization import AutoOptimizeMixin
from core.service import CachedListMixin, CacheInvalidatorMixin, BaseCacheService


class CurrencyCacheService(BaseCacheService):
    OBJECT_NAME = "currency"
    VERSION = 1


class CurrencyListView(CachedListMixin, AutoOptimizeMixin, ListAPIView):
    """
    List all supported currencies.
    """
    serializer_class = ListCurrencySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    queryset = Currency.objects.all().order_by('code')
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
        super().perform_create(serializer)
