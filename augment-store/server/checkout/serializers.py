
from rest_framework import serializers
from .models import Order, OrderItem, Payment
from carts.models import CartItem
from carts.serializers import CartItemListSerializer


class ShippingAddressListSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingAddress
        fields = "__all__"

class BillingAddressListSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillingAddress
        fields = "__all__"

class OrderItemListSerializer(serializers.ModelSerializer):
    cart_item = CartItemListSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "cart_item", "created_at"]


class CreateOrderSerializer(serializers.ModelSerializer):
    cart_items = serializers.ListField(child=serializers.UUIDField(), write_only=True)
    shipping_address = serializers.UUIDField()
    billing_address = serializers.UUIDField()

    class Meta:
        model = Order
        fields = ["id", "cart_items", "status", "created_at"]
        read_only_fields = ["id", "status", "created_at"]


    def validate_cart_items(self, value):
        user = self.context.get("request").user
        cart_items = CartItem.objects.get_user_cart_items(user).filter(id__in=value)
        if cart_items.count() != len(value):
            raise serializers.ValidationError("One or more cart items do not exist")
        return cart_items

    def create(self, validated_data):

        user = self.context.get("request").user
        order = Order.objects.create(created_by=user)

        for cart_item in validated_data.get("cart_items"):
            OrderItem.objects.create(
                order=order, 
                cart_item=cart_item, 
                created_by=user, 
                shipping_address=validated_data.get("shipping_address"), 
                billing_address=validated_data.get("billing_address")
            )

        return order


class OrderListSerializer(serializers.ModelSerializer):
    items = OrderItemListSerializer(many=True, read_only=True)
    total = serializers.ReadOnlyField()
    subtotal = serializers.ReadOnlyField()
    tax = serializers.ReadOnlyField()
    shipping = serializers.ReadOnlyField()

    class Meta:
        model = Order
        fields = ["id", "status", "items", "subtotal", "tax", "shipping", "total", "created_at", "updated_at"]


class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemListSerializer(many=True, read_only=True)
    payment_status = serializers.SerializerMethodField()
    total = serializers.ReadOnlyField()
    subtotal = serializers.ReadOnlyField()
    tax = serializers.ReadOnlyField()
    shipping = serializers.ReadOnlyField()
    shipping_address = ShippingAddressListSerializer(read_only=True)
    billing_address = BillingAddressListSerializer(read_only=True)

    class Meta:
        model = Order
        fields = "__all__"

    def get_payment_status(self, obj: Order):
        try:
            return obj.payment.payment_status
        except:
            return Payment.PaymentStatus.PENDING
       


