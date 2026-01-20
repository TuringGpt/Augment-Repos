from products.models import ProductBrand, Product
from checkout.models import Order
from rest_framework.generics import ListAPIView
from .serializers import MerchantBrandSerializer, MerchantProductSerializer, MerchantOrdersSerializer
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from core.optimization import AutoOptimizeMixin

class MerchantBrandListView(AutoOptimizeMixin, ListAPIView):
    serializer_class = MerchantBrandSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    auto_select_related = ['created_by', 'image']

    def get_queryset(self):
        object_id = self.kwargs.get("pk")
        return ProductBrand.objects.filter(created_by=object_id)


class MerchantProductListView(AutoOptimizeMixin, ListAPIView):
    serializer_class = MerchantProductSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    auto_select_related = ['brand', 'category', 'created_by']
    auto_prefetch_related = ['images']

    def get_queryset(self):
        object_id = self.kwargs.get("pk")
        # Return a QuerySet of all products from brands created by this merchant
        return Product.objects.filter(brand__created_by=object_id)

class MerchantOrdersListView(AutoOptimizeMixin, ListAPIView):
    serializer_class = MerchantOrdersSerializer
    permission_classes = [IsAuthenticated]
    auto_select_related = ['created_by', 'shipping_address']
    auto_prefetch_related = ['items__product']

    def get_queryset(self):
        return Order.objects.filter(items__cart_item__product__brand__created_by=self.request.user).distinct()
