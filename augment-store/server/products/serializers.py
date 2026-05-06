from rest_framework import serializers
from .models import ProductBrand, ProductCategory, Product, SearchQuery
from storage.serializers import FileListSerializer
from accounts.serializers import UserListSerializer


def validate_owned_image(value, request):
    user = getattr(request, "user", None)
    if value and (not user or getattr(user, "is_anonymous", True) or value.created_by_id != user.id):
        raise serializers.ValidationError("Image is invalid")
    return value


#  Product Brand Serializers

class CreateProductBrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductBrand
        fields = ["name", "description" , "image"]

    def validate_image(self, value):
        return validate_owned_image(value, self.context.get("request"))

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
    def validate_image(self, value):
        return validate_owned_image(value, self.context.get("request"))

    class Meta:
        model = ProductBrand
        fields = "__all__"


# Product Category Serializers

class CreateProductCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductCategory
        fields = ["name", "slug", "description", "parent", "image"]

    def validate_image(self, value):
        return validate_owned_image(value, self.context.get("request"))

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
        fields = ["id", "name", "description", "parent", "image", "slug"]


class ProductCategoryDetailSerializer(serializers.ModelSerializer):
    def validate_image(self, value):
        return validate_owned_image(value, self.context.get("request"))

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

    def validate_images(self, value):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or getattr(user, "is_anonymous", True):
            raise serializers.ValidationError("Images are invalid")
        if value and not all(image.created_by_id == user.id for image in value):
            raise serializers.ValidationError("Images are invalid")
        return value


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

class SearchQueryListSerializer(serializers.ModelSerializer):
    user = UserListSerializer(read_only=True)
    class Meta:
        model = SearchQuery
        fields = ["id", "query", "results_count", "user", "created_at", "updated_at"]
