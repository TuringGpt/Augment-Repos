from django.db import models

from accounts.models import User
from core.models import BaseModel
from products.models import Product


class ProductStatistics(BaseModel):
    """
    Track product statistics including views, cart additions, removals, and purchases.
    """
    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name='statistics')
    view_count = models.IntegerField(default=0)
    cart_add_count = models.IntegerField(default=0)
    cart_remove_count = models.IntegerField(default=0)
    purchase_count = models.IntegerField(default=0)

    class Meta:
        verbose_name_plural = "Product Statistics"

    def __str__(self):
        return f"Statistics for {self.product.name}"


class ProductView(BaseModel):
    """
    Track individual product views for analytics.
    """
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='views')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='product_views')

    class Meta:
        indexes = [
            models.Index(fields=['product', '-created_at']),
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self):
        return f"View of {self.product.name} at {self.created_at}"


class CartAbandonment(BaseModel):
    """
    Track products that were added to cart but not purchased.
    """
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='abandonments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='abandoned_products')
    quantity = models.IntegerField(default=1)

    class Meta:
        indexes = [
            models.Index(fields=['product', '-created_at']),
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self):
        return f"{self.user.email} abandoned {self.product.name}"
