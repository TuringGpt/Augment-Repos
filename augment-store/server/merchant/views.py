from products.models import ProductBrand, Product
from checkout.models import Order
from rest_framework.generics import ListAPIView
from .serializers import MerchantBrandSerializer, MerchantProductSerializer, MerchantOrdersSerializer
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from core.optimization import AutoOptimizeMixin
from core.service import CachedListMixin, BaseCacheService


class MerchantOrdersCacheService(BaseCacheService):
    OBJECT_NAME = "merchant_orders"
    VERSION = 1


class MerchantBrandListView(AutoOptimizeMixin, ListAPIView):
    serializer_class = MerchantBrandSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    auto_select_related = ['created_by', 'image']
    queryset = ProductBrand.objects.all()

    def get_queryset(self):
        object_id = self.kwargs.get("pk")
        return super().get_queryset().filter(created_by=object_id)


class MerchantProductListView(AutoOptimizeMixin, ListAPIView):
    serializer_class = MerchantProductSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    auto_select_related = ['brand', 'category', 'created_by']
    auto_prefetch_related = ['images']
    queryset = Product.objects.all()

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
        return super().get_queryset().filter(
            items__product__brand__created_by=self.request.user
        ).distinct()
