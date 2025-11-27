from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from products.models import Product
from carts.models import CartItemList
from checkout.models import OrderItem
from .models import ProductStatistics, ProductView, CartAbandonment


@receiver(post_save, sender=Product)
def create_product_statistics(sender, instance, created, **kwargs):
    """
    Create ProductStatistics record when a new Product is created.
    """
    if created:
        ProductStatistics.objects.get_or_create(product=instance)


@receiver(post_save, sender=CartItemList)
def track_cart_addition(sender, instance, created, **kwargs):
    """
    Track when a product is added or removed to cart and update statistics.
    """
    if created and instance.product:
        stats, _ = ProductStatistics.objects.get_or_create(product=instance.product)
        stats.cart_add_count += 1
        stats.save(update_fields=['cart_add_count'])


@receiver(post_delete, sender=CartItemList)
def track_cart_removal(sender, instance, **kwargs):
    """
    Track when a product is removed from cart.
    """
    if instance.product:
        try:
            stats = ProductStatistics.objects.get(product=instance.product)
            stats.cart_remove_count += 1
            stats.save(update_fields=['cart_remove_count'])
        except ProductStatistics.DoesNotExist:
            pass


@receiver(post_save, sender=OrderItem)
def track_purchase(sender, instance, created, **kwargs):
    """
    Track when a product is purchased and update statistics.
    """
    if created and instance.cart_item and instance.cart_item.product:
        product = instance.cart_item.product
        stats, _ = ProductStatistics.objects.get_or_create(product=product)
        stats.purchase_count += 1
        stats.save(update_fields=['purchase_count'])

