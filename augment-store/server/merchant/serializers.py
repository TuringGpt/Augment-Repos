from rest_framework import serializers
from products.models import ProductBrand
from storage.serializers import FileSerializer

class MerchantBrandSerializer(serializers.ModelSerializer):
    image = FileSerializer(read_only=True)

    class Meta:
        model = ProductBrand
        fields = ["id", "name", "description", "image"]