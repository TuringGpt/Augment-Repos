from django.db import models
from accounts.models import User
from core.models import BaseModel
from carts.models import CartItem



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

    items = models.ManyToManyField(CartItem, related_name='orders')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    status = models.CharField(max_length=20, choices=OrderStatus.CHOICES, default=OrderStatus.PENDING)



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