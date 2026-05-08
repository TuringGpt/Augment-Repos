from decimal import Decimal
from django.db import models
from core.models import BaseModel
from accounts.models import User
from products.models import Product
from django.db.models import F


class CartItemManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().order_by('-created_at')
    
    def get_user_cart_items(self, user):
        return self.get_queryset().filter(created_by=user)

class CartItem(BaseModel):
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, related_name='cart_items')
    quantity = models.IntegerField(default=1)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cart_items')
    objects: CartItemManager = CartItemManager()


class CartManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().order_by('-created_at')
    
    def get_user_cart(self, user) -> "Cart":
        cart, _ = self.get_queryset().get_or_create(user=user)
        return cart
    
    def get_user_cart_safe(self, user):
        return self.filter(user=user).first()
    
    def get_user_cart_items(self, user):
        cart = self.get_user_cart(user)
        return cart.items.all().select_related('product', 'product__brand', 'product__category').prefetch_related('product__images')
    
    def add_to_cart(self, user: User, product: Product, quantity=1):
        user_cart = self.get_user_cart(user)

        # if item exists and is already in cart, update quantity
        is_in_cart = user_cart.items.filter(product=product).exists()
        if is_in_cart:
            # get cart item and update quantity. we can use F() to avoid race conditions
            cart_item = user_cart.items.get(product=product)
            cart_item.quantity = F('quantity') + quantity
            cart_item.save()
            return user_cart

        cart_item = CartItem.objects.create(product=product, quantity=quantity, created_by=user)
        user_cart.items.add(cart_item)
        user_cart.save()
        return user_cart
    
    def contains_cart_item(self, user: User, cart_item_id: str):
        user_cart = self.get_user_cart(user)
        return user_cart.items.filter(id=cart_item_id).exists()
   

class Cart(BaseModel):
    items = models.ManyToManyField("CartItem", related_name='carts')
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cart')
    objects: CartManager = CartManager()

    @property
    def subtotal(self):
        from django.db.models import Sum, F, DecimalField
        result = self.items.filter(product__isnull=False).aggregate(
            total=Sum(F('product__price') * F('quantity'), output_field=DecimalField())
        )
        return result['total'] or Decimal('0.00')


    @property
    def tax(self):
        # TODO: I will get the tax rate from the tax service later (this unblock frontend for now)
        # return Decimal
        return round(self.subtotal * Decimal("0.1") , 2)

    @property
    def shipping(self):
        # TODO: I will get the shipping cost from the shipping service later (this unblock frontend for now)
        return Decimal("10.00") if self.subtotal <= 50 else Decimal("0.00")

    @property
    def total(self):
        return self.subtotal + self.tax + self.shipping


class WishlistManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().order_by('-created_at')
    
    def get_user_wishlist(self, user) -> "Wishlist":
        wishlist, _ = self.get_queryset().get_or_create(user=user)
        return wishlist
    
    def get_user_wishlist_safe(self, user):
        return self.filter(user=user).first()

class Wishlist(BaseModel):
    products = models.ManyToManyField(Product, related_name='wishlist')
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='wishlist')
    objects: WishlistManager = WishlistManager()
