from django.db.models import F
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from carts.models import CartItem
from checkout.models import OrderItem
from products.models import Product

from .models import ProductStatistics


@receiver(post_save, sender=Product)
def create_product_statistics(sender, instance, created, **kwargs):
    """
    Create ProductStatistics record when a new Product is created.
    """
    if created:
        ProductStatistics.objects.get_or_create(product=instance)


@receiver(post_save, sender=CartItem)
def track_cart_addition(sender, instance, created, **kwargs):
    """
    Track when a product is added to cart and update statistics.
    """
    if created and instance.product:
        ProductStatistics.objects.get_or_create(product=instance.product)
        ProductStatistics.objects.filter(product=instance.product).update(
            cart_add_count=F('cart_add_count') + 1
        )


@receiver(post_delete, sender=CartItem)
def track_cart_removal(sender, instance, **kwargs):
    """
    Track when a product is removed from cart.
    """
    if instance.product:
        ProductStatistics.objects.filter(product=instance.product).update(
            cart_remove_count=F('cart_remove_count') + 1
        )


@receiver(post_save, sender=OrderItem)
def track_purchase(sender, instance, created, **kwargs):
    """
    Track when a product is purchased and update statistics.
    """
    if created and instance.cart_item and instance.cart_item.product:
        product = instance.cart_item.product
        ProductStatistics.objects.get_or_create(product=product)
        ProductStatistics.objects.filter(product=product).update(
            purchase_count=F('purchase_count') + 1
        )

