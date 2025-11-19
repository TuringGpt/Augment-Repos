
from rest_framework import serializers
from .models import Order, OrderItem, Payment, ShippingAddress, BillingAddress, ContactInformation
from carts.models import CartItem
from carts.serializers import CartItemListSerializer
from .services import StripeService


class ShippingAddressListSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingAddress
        fields = "__all__"

class BillingAddressListSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillingAddress
        fields = "__all__"


class ContactInformationListSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactInformation
        fields = "__all__"

class ShippingAddressCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingAddress
        fields = [
            "first_name",
            "last_name",
            "address_line_1",
            "address_line_2",
            "city",
            "state",
            "postal_code",
            "country",
        ]

class BillingAddressCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillingAddress
        fields = [
            "first_name",
            "last_name",
            "address_line_1",
            "address_line_2",
            "city",
            "state",
            "postal_code",
            "country",
        ]

class ContactInformationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactInformation
        fields = ["first_name", "last_name", "email", "phone"]

class OrderItemListSerializer(serializers.ModelSerializer):
    cart_item = CartItemListSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "cart_item", "created_at"]


class CreateOrderSerializer(serializers.ModelSerializer):
    cart_items = serializers.ListField(child=serializers.UUIDField(), write_only=True)
    shipping_address = ShippingAddressCreateSerializer(required=False)
    billing_address = BillingAddressCreateSerializer(required=False)
    contact_information = ContactInformationCreateSerializer(required=False)

    shipping_address_id = serializers.UUIDField(write_only=True, required=False)
    billing_address_id = serializers.UUIDField(write_only=True, required=False)
    contact_information_id = serializers.UUIDField(write_only=True, required=False)

    class Meta:
        model = Order
        fields = [
            "id", 
            "cart_items", 
            "status", 
            "created_at", 
            "shipping_address",
            "billing_address",
            "contact_information", 
            "shipping_address_id", 
            "billing_address_id", 
            "contact_information_id"
        ]
        read_only_fields = ["id", "status", "created_at"]


    def validate_cart_items(self, value):
        user = self.context.get("request").user
        cart_items = CartItem.objects.get_user_cart_items(user).filter(id__in=value)
        if cart_items.count() != len(value):
            raise serializers.ValidationError("One or more cart items do not exist")
        return cart_items
    

    def validate_shipping_address(self, value):
        user = self.context.get("request").user
        shipping_address, _ = ShippingAddress.objects.get_or_create(
            first_name=value.get("first_name"),
            last_name=value.get("last_name"),
            address_line_1=value.get("address_line_1"),
            address_line_2=value.get("address_line_2"),
            city=value.get("city"),
            state=value.get("state"),
            postal_code=value.get("postal_code"),
            country=value.get("country"),
            user=user,
            defaults=value
        )
        return shipping_address
    

    def validate_billing_address(self, value):
        user = self.context.get("request").user
        billing_address, _ = BillingAddress.objects.get_or_create(
            first_name=value.get("first_name"),
            last_name=value.get("last_name"),
            address_line_1=value.get("address_line_1"),
            address_line_2=value.get("address_line_2"),
            city=value.get("city"),
            state=value.get("state"),
            postal_code=value.get("postal_code"),
            country=value.get("country"),
            user=user,
            defaults=value
        )
        return billing_address

    def validate_contact_information(self, value):
        user = self.context.get("request").user
        contact_information, _ = ContactInformation.objects.get_or_create(
            first_name=value.get("first_name"),
            last_name=value.get("last_name"),
            email=value.get("email"),
            phone=value.get("phone"),
            user=user,
            defaults=value
        )
        return contact_information

    def validate_shipping_address_id(self, value):
        user = self.context.get("request").user
        try:
            shipping_address = ShippingAddress.objects.get(id=value, user=user)
        except ShippingAddress.DoesNotExist:
            raise serializers.ValidationError("Shipping address does not exist")
        return shipping_address
    
    def validate_billing_address_id(self, value):
        user = self.context.get("request").user
        try:
            billing_address = BillingAddress.objects.get(id=value, user=user)
        except BillingAddress.DoesNotExist:
            raise serializers.ValidationError("Billing address does not exist")
        return billing_address
    
    def validate_contact_information_id(self, value):
        user = self.context.get("request").user
        try:
            contact_information = ContactInformation.objects.get(id=value, user=user)
        except ContactInformation.DoesNotExist:
            raise serializers.ValidationError("Contact information does not exist")
        return contact_information
    
    def validate(self, attrs):
        # if both shipping_address and shipping_address_id are provided, raise an error
        if "shipping_address" in attrs and "shipping_address_id" in attrs:
            raise serializers.ValidationError("Cannot provide both shipping_address and shipping_address_id")
        
        # if both billing_address and billing_address_id are provided, raise an error
        if "billing_address" in attrs and "billing_address_id" in attrs:
            raise serializers.ValidationError("Cannot provide both billing_address and billing_address_id")
        
        # if both contact_information and contact_information_id are provided, raise an error
        if "contact_information" in attrs and "contact_information_id" in attrs:
            raise serializers.ValidationError("Cannot provide both contact_information and contact_information_id")
        
        return attrs

    def create(self, validated_data):

        user = self.context.get("request").user
        order = Order.objects.create(
            created_by=user,
            shipping_address=validated_data.get("shipping_address_id") or validated_data.get("shipping_address"), 
            billing_address= validated_data.get("billing_address_id") or validated_data.get("billing_address"),
            contact_information= validated_data.get("contact_information_id") or validated_data.get("contact_information"),
        )

        for cart_item in validated_data.get("cart_items"):
            OrderItem.objects.create(
                order=order, 
                cart_item=cart_item, 
                created_by=user,
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
       

class OrderPaymentSerializer(serializers.ModelSerializer):
    order = serializers.UUIDField()
    payment_method = serializers.ChoiceField(choices=Payment.PaymentMethod.CHOICES, default=Payment.PaymentMethod.STRIPE)
    client_secret = serializers.CharField(read_only=True)

    class Meta:
        model = Payment
        fields = ["order", "payment_method", "client_secret", "payment_status", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at", "payment_status"]

    def validate_order(self, value):
        user = self.context.get("request").user
        try:
            order = Order.objects.get(id=value, created_by=user)
            return order
        except Order.DoesNotExist:
            raise serializers.ValidationError("Order does not exist")
        
        
    def create(self, validated_data):
        user = self.context.get("request").user
        order: Order = validated_data.get("order")
        payment_method = validated_data.get("payment_method", Payment.PaymentMethod.STRIPE)
        amount = order.total
        
        # if we already have a payment for this order, just update the payment
        try:
            payment = order.payment
            Payment.objects.filter(id=payment.id).update(amount=amount, payment_method=payment_method)
        except Payment.DoesNotExist:
            payment = Payment.objects.create(
                order=order, 
                created_by=user, 
                amount=amount, 
                payment_method=payment_method
            )
  

        stripe_service = StripeService()
        session = stripe_service.create_payment_session(payment)
        return {
            "client_secret": session.client_secret,
            "id": payment.id,
            "order": order.id,
            "payment_method": payment_method,
            "payment_status": payment.payment_status,
            "created_at": payment.created_at,
            "updated_at": payment.updated_at,    
        }
        
    

class PaymentStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ["payment_status"]
        read_only_fields = ["payment_status"]
    

    