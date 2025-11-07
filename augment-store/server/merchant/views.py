from products.models import ProductBrand, Product
from checkout.models import Order
from rest_framework.generics import ListAPIView
from .serializers import MerchantBrandSerializer, MerchantProductSerializer
from rest_framework.permissions import IsAuthenticatedOrReadOnly

class MerchantBrandListView(ListAPIView):
    serializer_class = MerchantBrandSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        object_id = self.kwargs.get("pk")
        return ProductBrand.objects.filter(created_by=object_id)


class MerchantProductListView(ListAPIView):
    serializer_class = MerchantProductSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        object_id = self.kwargs.get("pk")
        # Return a QuerySet of all products from brands created by this merchant
        return Product.objects.filter(brand__created_by=object_id)

class MerchantOrdersListView(ListAPIView):
    serializer_class = MerchantOrdersSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        object_id = self.kwargs.get("pk")
        return Order.objects.filter(cart_items__product__brand__created_by=object_id)