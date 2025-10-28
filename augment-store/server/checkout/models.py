from django.db import models
from carts.models import CartItem, BaseModel


class Order(BaseModel):
    class OrderStatus:
        PENDING = 'pending'
        CANCELLED = 'cancelled'
        COMPLETED = 'completed'

        CHOICES = (
            (PENDING, 'Pending'),
            (CANCELLED, 'Cancelled'),
            (COMPLETED, 'Processing'),
        )

    items = models.ManyToManyField(CartItem, related_name='orders')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    status = models.CharField(max_length=20, choices=OrderStatus.CHOICES, default=OrderStatus.PENDING)
    order_id = models.CharField(max_length=255, unique=True)
