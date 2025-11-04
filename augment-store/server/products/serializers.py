from rest_framework import serializers
from .models import ProductBrand, ProductCategory, Product
from storage.serializers import FileListSerializer
from accounts.serializers import UserListSerializer


#  Product Brand Serializers

class CreateProductBrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductBrand
        fields = ["name", "description" , "image"]

    def validate(self, attrs):
        request = self.context.get("request")
        attrs["created_by"] = request.user
        return attrs


class ProductBrandListSerializer(serializers.ModelSerializer):
    image = FileListSerializer(read_only=True)

    class Meta:
        model = ProductBrand
        fields = ["id", "name", "description", "image"]


class ProductBrandDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductBrand
        fields = "__all__"


# Product Category Serializers

class CreateProductCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductCategory
        fields = ["name", "slug", "description", "parent", "image"]

    def validate(self, attrs):
        parent = attrs.get("parent")
        if parent and parent.is_child_node():
            raise serializers.ValidationError("Parent category cannot be a child category")
        
        request = self.context.get("request")
        attrs["created_by"] = request.user
        return attrs


class ProductCategoryListSerializer(serializers.ModelSerializer):
    image = FileListSerializer(read_only=True)

    class Meta:
        model = ProductCategory
        fields = ["id", "name", "description", "parent", "image"]


class ProductCategoryDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductCategory
        fields = "__all__"


#  Product Serializers

class CreateProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ["name", "description", "price", "brand", "category", "quantity", "images"]

    def validate(self, attrs):
        request = self.context.get("request")
        attrs["created_by"] = request.user
        return attrs


class ProductListSerializer(serializers.ModelSerializer):
    brand = ProductBrandListSerializer(read_only=True)
    category = ProductCategoryListSerializer(read_only=True)
    images = FileListSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = ["id", "name", "description", "price", "brand", "category", "quantity", "rating", "images"]


class ProductDetailSerializer(serializers.ModelSerializer):
    brand = ProductBrandListSerializer(read_only=True)
    category = ProductCategoryListSerializer(read_only=True)
    images = FileListSerializer(many=True, read_only=True)

    created_by = UserListSerializer(read_only=True)
    class Meta:
        model = Product
        fields = "__all__"
