from django.db import models
from core.models import BaseModel
from accounts.models import User
from products.models import Product
from django.db.models import F


class CartItem(BaseModel):
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, related_name='cart_items')
    quantity = models.IntegerField(default=1)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cart_items')


class CartManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().order_by('-created_at')
    
    def get_user_cart(self, user)-> "Cart":
        cart, _ = self.get_queryset().get_or_create(user=user)
        return cart
    
    def get_user_cart_items(self, user):
        cart = self.get_user_cart(user)
        return cart.items.all()
    
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
    items = models.ManyToManyField(CartItem, related_name='carts')
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cart')
    objects: CartManager = CartManager()

