from rest_framework import serializers
from products.models import ProductBrand, Product
from storage.serializers import FileSerializer

class MerchantBrandSerializer(serializers.ModelSerializer):
    image = FileSerializer(read_only=True)

    class Meta:
        model = ProductBrand
        fields = ["id", "name", "description", "image"]


class MerchantProductSerializer(serializers.ModelSerializer):
    images = FileSerializer(read_only=True)

    class Meta:
        model = Product
        fields = ["id", "name", "description", "images"]