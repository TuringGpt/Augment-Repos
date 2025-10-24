
from rest_framework import serializers
from .models import CartItem, Cart


class AddToCartSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)

    def validate(self, attrs):
        product_id = attrs.get("product_id")
        quantity = attrs.get("quantity")

        # Check if product exists
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            raise serializers.ValidationError("Product does not exist")

        if quantity > product_id.stock:
            raise serializers.ValidationError("Quantity exceeds stock")

        return attrs
    

    def create(self, validated_data):
        #gett user car
        user = self.context["request"].user
        cart = Cart.objects.get_user_cart(user)
        
        



