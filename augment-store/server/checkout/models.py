from decimal import Decimal
from django.db import models
from accounts.models import User
from core.models import BaseModel
from carts.models import CartItem


class ShippingAddress(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shipping_addresses')
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    address_line_1 = models.TextField()
    address_line_2 = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=255)
    state = models.CharField(max_length=255)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=255)

class BillingAddress(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='billing_addresses')
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    address_line_1 = models.TextField()
    address_line_2 = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=255)
    state = models.CharField(max_length=255)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=255)


class ContactInformation(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='contact_information')
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20)


class Order(BaseModel):
    class OrderStatus:
        PENDING = 'pending'
        CANCELLED = 'cancelled'
        COMPLETED = 'completed'

        CHOICES = (
            (PENDING, 'Pending'),
            (CANCELLED, 'Cancelled'),
            (COMPLETED, 'Completed'),
        )

    payment: "Payment"
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    status = models.CharField(max_length=20, choices=OrderStatus.CHOICES, default=OrderStatus.PENDING)
    shipping_address = models.ForeignKey(ShippingAddress, on_delete=models.SET_NULL, null=True, related_name='orders')
    billing_address = models.ForeignKey(BillingAddress, on_delete=models.SET_NULL, null=True, related_name='orders')
    contact_information = models.ForeignKey(ContactInformation, on_delete=models.SET_NULL, null=True, related_name='orders')

    @property
    def subtotal(self):
        return sum(item.cart_item.product.price * item.cart_item.quantity for item in self.items.all())

    @property
    def tax(self):
        # TODO: I will get the tax rate from the tax service later (this unblock frontend for now)
        # return Decimal
        return round(self.subtotal * Decimal("0.1") , 2)

    @property
    def shipping(self):
        # TODO: I will get the shipping cost from the shipping service later (this unblock frontend for now)
        return 10 if self.subtotal < 50 else 0

    @property
    def total(self):
        return self.subtotal + self.tax + self.shipping



class OrderItem(BaseModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    cart_item = models.ForeignKey(CartItem, on_delete=models.SET_NULL, null=True, related_name='order_items')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='order_items')


class Payment(BaseModel):
    class PaymentMethod:
        STRIPE = 'stripe'
        PAYPAL = 'paypal'
        
        CHOICES = (
            (STRIPE, 'Stripe'),
            (PAYPAL, 'PayPal'),
        )

    class PaymentStatus:
        PENDING = 'pending'
        PAID = 'paid'
        FAILED = 'failed'
        REFUNDED = 'refunded'

        CHOICES = (
            (PENDING, 'Pending'),
            (PAID, 'Paid'),
            (FAILED, 'Failed'),
            (REFUNDED, 'Refunded'),
        )

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='payment')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.CHOICES, default=PaymentMethod.STRIPE)
    payment_status = models.CharField(max_length=20, choices=PaymentStatus.CHOICES, default=PaymentStatus.PENDING)
    stripe_session_id = models.CharField(max_length=1024, null=True, blank=True)