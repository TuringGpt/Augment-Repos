from core.optimization import AutoOptimizeMixin
from products.models import ProductBrand, Product
from checkout.models import Order
from rest_framework.generics import ListAPIView
from .serializers import MerchantBrandSerializer, MerchantProductSerializer, MerchantOrdersSerializer
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated

class MerchantBrandListView(AutoOptimizeMixin, ListAPIView):
    serializer_class = MerchantBrandSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    queryset = ProductBrand.objects.all()
    auto_select_related = ("created_by", "image")

    def get_queryset(self):
        object_id = self.kwargs.get("pk")
        return super().get_queryset().filter(created_by=object_id)


class MerchantProductListView(AutoOptimizeMixin, ListAPIView):
    serializer_class = MerchantProductSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    queryset = Product.objects.all()
    auto_select_related = ()
    auto_prefetch_related = ("brand", "category", "images")

    def get_queryset(self):
        object_id = self.kwargs.get("pk")
        return super().get_queryset().filter(brand__created_by=object_id)

class MerchantOrdersListView(AutoOptimizeMixin, ListAPIView):
    serializer_class = MerchantOrdersSerializer
    permission_classes = [IsAuthenticated]
    queryset = Order.objects.all()
    auto_prefetch_related = ("items__product__brand",)

    def get_queryset(self):
        return super().get_queryset().filter(
            items__cart_item__product__brand__created_by=self.request.user
        ).distinct()
