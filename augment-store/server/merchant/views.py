from django.db.models import Q
from products.models import ProductBrand, Product
from checkout.models import Order
from rest_framework.generics import ListAPIView
from .serializers import MerchantBrandSerializer, MerchantProductSerializer, MerchantOrdersSerializer
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from accounts.permissions import hasAdminRole
from core.optimization import AutoOptimizeMixin
from core.service import CachedListMixin, BaseCacheService
from products.services import ProductBrandCacheService, ProductCacheService


class MerchantOrdersCacheService(BaseCacheService):
    OBJECT_NAME = "merchant_orders"
    VERSION = 1


class MerchantBrandListView(CachedListMixin, AutoOptimizeMixin, ListAPIView):
    serializer_class = MerchantBrandSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    auto_select_related = ['created_by', 'image']
    queryset = ProductBrand.objects.all()
    cache_service_class = ProductBrandCacheService
    cache_ttl = 60 * 60

    def generate_cache_key(self):
        service = self.get_cache_service()
        object_id = self.kwargs.get("pk")
        user_id = getattr(self.request.user, "id", None)
        serialized_params = service._serialize_params(self.request.query_params)
        custom_key = f"merchant_brands:{object_id}:{user_id}:{serialized_params}"
        return service.get_cache_key(custom_key=custom_key)

    def get_queryset(self):
        object_id = self.kwargs.get("pk")
        return super().get_queryset().filter(created_by=object_id)


class MerchantProductListView(CachedListMixin, AutoOptimizeMixin, ListAPIView):
    serializer_class = MerchantProductSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    auto_select_related = ['brand', 'category', 'created_by']
    auto_prefetch_related = ['images']
    queryset = Product.objects.all()
    cache_service_class = ProductCacheService
    cache_ttl = 60 * 30

    def generate_cache_key(self):
        service = self.get_cache_service()
        object_id = self.kwargs.get("pk")
        user_id = getattr(self.request.user, "id", None)
        serialized_params = service._serialize_params(self.request.query_params)
        custom_key = f"merchant_products:{object_id}:{user_id}:{serialized_params}"
        return service.get_cache_key(custom_key=custom_key)

    def get_queryset(self):
        object_id = self.kwargs.get("pk")
        return super().get_queryset().filter(brand__created_by=object_id)


class MerchantOrdersListView(CachedListMixin, AutoOptimizeMixin, ListAPIView):
    serializer_class = MerchantOrdersSerializer
    permission_classes = [IsAuthenticated]
    queryset = Order.objects.all()
    cache_service_class = MerchantOrdersCacheService
    cache_ttl = 60 * 5
    auto_select_related = ['created_by', 'shipping_address']
    auto_prefetch_related = [
        'items',
        'items__product',
        'items__product__brand',
        'items__product__category',
        'items__product__images'
    ]

    def get_queryset(self):
        user = self.request.user
        return super().get_queryset().filter(
            Q(items__product__brand__created_by=user) |
            Q(items__cart_item__product__brand__created_by=user)
        ).distinct()


class AdminMerchantOrdersListView(MerchantOrdersListView):
    """Admin-only view to list all merchant orders globally."""
    permission_classes = [IsAuthenticated, hasAdminRole]

    def generate_cache_key(self):
        service = self.get_cache_service()
        user_id = getattr(self.request.user, "id", None)
        serialized_params = service._serialize_params(self.request.query_params)
        # Use a distinct prefix to isolate admin cache from regular merchant cache
        custom_key = f"admin_merchant_orders:{user_id}:{serialized_params}"
        return service.get_cache_key(custom_key=custom_key)

    def get_queryset(self):
        # Bypass the merchant-scoped filter but preserve AutoOptimizeMixin's
        # select_related/prefetch_related for efficient serialization
        return super(MerchantOrdersListView, self).get_queryset().order_by('-created_at', '-id')
