
from rest_framework import serializers
from .models import Order, OrderItem, Payment
from carts.models import CartItem
from carts.serializers import CartItemListSerializer


class OrderItemListSerializer(serializers.ModelSerializer):
    cart_item = CartItemListSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "cart_item", "created_at"]


class CreateOrderSerializer(serializers.ModelSerializer):
    cart_items = serializers.PrimaryKeyRelatedField(many=True, queryset=CartItem.objects.all(), write_only=True)

    class Meta:
        model = Order
        fields = ["id", "cart_items", "status", "created_at"]
        read_only_fields = ["id", "status", "created_at"]

    def create(self, validated_data):

        user = self.context.get("request").user
        order = Order.objects.create(created_by=user)

        for cart_item in validated_data.get("cart_items"):
            OrderItem.objects.create(order=order, cart_item=cart_item, created_by=user)
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

    class Meta:
        model = Order
        fields = "__all__"

    def get_payment_status(self, obj):
        if hasattr(obj, 'payment'):
            return obj.payment.payment_status
        return None


