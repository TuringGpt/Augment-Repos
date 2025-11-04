from rest_framework import serializers
from products.models import ProductBrand


class MerchantBrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductBrand
        fields = ["id", "name", "description", "image"]