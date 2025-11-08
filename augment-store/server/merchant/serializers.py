from rest_framework import serializers
from products.models import ProductBrand, Product
from checkout.models import Order
from storage.serializers import FileSerializer, FileListSerializer
from checkout.serializers import OrderItemListSerializer

class MerchantBrandSerializer(serializers.ModelSerializer):
    image = FileSerializer(read_only=True)

    class Meta:
        model = ProductBrand
        fields = ["id", "name", "description", "image"]


class MerchantProductSerializer(serializers.ModelSerializer):
    images = FileListSerializer(read_only=True, many=True)

    class Meta:
        model = Product
        fields = ["id", "name", "description", "images"]


class MerchantOrdersSerializer(serializers.ModelSerializer):
    items = OrderItemListSerializer(many=True, read_only=True)
    total = serializers.ReadOnlyField()
    subtotal = serializers.ReadOnlyField()
    tax = serializers.ReadOnlyField()
    shipping = serializers.ReadOnlyField()

    class Meta:
        model = Order
        fields = ["id", "status", "items", "subtotal", "tax", "shipping", "total", "created_at", "updated_at"]

