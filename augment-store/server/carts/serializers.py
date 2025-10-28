
from rest_framework import serializers
from .models import Cart, CartItem
from products.models import Product
from products.serializers import ProductListSerializer


class AddToCartSerializer(serializers.Serializer):
    product_id = serializers.UUIDField(write_only=True)
    quantity = serializers.IntegerField(min_value=1, write_only=True)

    def validate(self, attrs):
        product_id = attrs.get("product_id")
        quantity = attrs.get("quantity")

        try:
            product: Product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            raise serializers.ValidationError("Product does not exist")

        if not product.check_stock(quantity):
            raise serializers.ValidationError("Quantity exceeds stock")

        return attrs
    

    def create(self, validated_data):
     
        user = self.context.get("request").user
        user_cart = Cart.objects.get_user_cart(user)
        product_id = validated_data.get("product_id")
        quantity = validated_data.get("quantity")

        product = Product.objects.get(id=product_id)
        user_cart = Cart.objects.add_to_cart(user, product, quantity)
        return user_cart

class UpdateCartItemSerializer(serializers.ModelSerializer):
    quantity = serializers.IntegerField(min_value=1)
    operation = serializers.ChoiceField(choices=["add", "subtract", "set"], default="set")

    class Meta:
        model = CartItem
        fields = ["quantity", "operation"]

    def validate(self, attrs):
        cart_item = self.instance
        quantity = attrs.get("quantity")
        if not cart_item.product.check_stock(quantity):
            raise serializers.ValidationError("Quantity exceeds stock")

        return attrs

    def update(self, instance, validated_data):
        quantity = validated_data.get("quantity")
        operation = validated_data.get("operation")
        if operation == "add":
            instance.quantity += quantity
        elif operation == "subtract":
            instance.quantity -= quantity
        else:
            instance.quantity = quantity
        instance.save()
        return instance
class CartItemListSerializer(serializers.ModelSerializer):
    product = ProductListSerializer()

    class Meta:
        model = CartItem
        fields = "__all__"

        
class CartDetailSerializer(serializers.ModelSerializer):
    items = CartItemListSerializer(many=True)

    class Meta:
        model = Cart
        fields = "__all__"

