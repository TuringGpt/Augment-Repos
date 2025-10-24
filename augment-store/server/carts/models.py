from django.db import models
from core.models import BaseModel
from accounts.models import User
from products.models import Product


class CartItem(BaseModel):
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, related_name='cart_items')
    quantity = models.IntegerField(default=1)
    created_by = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name='cart_items')


class CartManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().order_by('-created_at')
    
    def get_user_cart(self, user):
        cart, _ = self.get_queryset().get_or_create(user=user)
        return cart
    
    def get_user_cart_items(self, user):
        cart = self.get_user_cart(user)
        return cart.items.all()
    
    def add_to_cart(self, user, product, quantity):
        cart = self.get_user_cart(user)
        cart_item, created = CartItem.objects.get_or_create(product=product)
        if not created:
            cart_item.quantity += quantity
            cart_item.save()
        cart.items.add(cart_item)
        return cart

class Cart(BaseModel):
    items = models.ManyToManyField(CartItem, related_name='carts')
    user = models.OneToOneField("accounts.User",, on_delete=models.CASCADE, related_name='cart')
