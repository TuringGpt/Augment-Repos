
from accounts.models import User
from carts.models import Wishlist, Cart
from checkout.models import OrderItem
from products.models import Product

class ProductService:
    
    def recommend_products_for_user(self, user: User):
        # get product from user's wishlist
        user_wishlist = Wishlist.objects.get_user_wishlist(user)
        user_cart = Cart.objects.get_user_cart(user)
        
        # checkout products from user's cart
        order_items = OrderItem.objects.filter(created_by=user)

        # get the category of the products in the wishlist, cart and order
        wishlist_categories = user_wishlist.products.values_list('category', flat=True)
        cart_categories = user_cart.items.values_list('product__category', flat=True)
        order_categories = order_items.values_list('product__category', flat=True)

        # get the products in the same category as the user's wishlist, cart and order
        wishlist_products = Product.objects.filter(category__in=wishlist_categories)
        cart_products = Product.objects.filter(category__in=cart_categories)
        order_products = Product.objects.filter(category__in=order_categories)

        # get the products that are not in the user's wishlist, cart and order
        wishlist_products = wishlist_products.exclude(id__in=user_wishlist.products.values_list('id', flat=True))
        cart_products = cart_products.exclude(id__in=user_cart.items.values_list('product__id', flat=True))
        order_products = order_products.exclude(id__in=order_items.values_list('product__id', flat=True))

        return wishlist_products | cart_products | order_products
        



        
