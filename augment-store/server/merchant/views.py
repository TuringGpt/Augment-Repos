from products.models import ProductBrand
from rest_framework.generics import ListAPIView
from .serializers import MerchantBrandSerializer
from rest_framework.permissions import IsAuthenticatedOrReadOnly

class MerchantBrandListView(ListAPIView):
    serializer_class = MerchantBrandSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        object_id = self.kwargs.get("pk")
        return ProductBrand.objects.filter(created_by=object_id)
