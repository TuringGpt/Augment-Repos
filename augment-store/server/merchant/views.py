from products.models import ProductBrand, Product
from checkout.models import Order
from rest_framework.generics import ListAPIView
from .serializers import MerchantBrandSerializer, MerchantProductSerializer, MerchantOrdersSerializer, MerchantAnalyticsSerializer
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated

from core.service import CachedListMixin
from .services import MerchantCacheService

class MerchantBrandListView(CachedListMixin, ListAPIView):
    serializer_class = MerchantBrandSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    cache_service_class = MerchantCacheService
    cache_ttl = 60 * 60  # 1 hour

    def get_queryset(self):
        object_id = self.kwargs.get("pk")
        return ProductBrand.objects.filter(created_by=object_id)


class MerchantProductListView(CachedListMixin, ListAPIView):
    serializer_class = MerchantProductSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    cache_service_class = MerchantCacheService
    cache_ttl = 60 * 60  # 1 hour

    def get_queryset(self):
        object_id = self.kwargs.get("pk")
        # Return a QuerySet of all products from brands created by this merchant
        return Product.objects.filter(brand__created_by=object_id)

class MerchantOrdersListView(ListAPIView):
    serializer_class = MerchantOrdersSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(items__cart_item__product__brand__created_by=self.request.user).distinct()
