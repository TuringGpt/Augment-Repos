from django.shortcuts import render
from products.models import ProductBrand
from rest_framework.generics import ListAPIView
from .serializers import MerchantBrandSerializer

class MerchantBrandListView(ListAPIView):
    serializer_class = MerchantBrandSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return ProductBrand.objects.filter(created_by=self.request.user)
