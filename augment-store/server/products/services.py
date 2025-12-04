
from accounts.models import User
from carts.models import Wishlist, Cart
from checkout.models import OrderItem
from products.models import Product
from core.service import BaseCacheService

class ProductService:

    def recommend_products_for_user(self, user: User):

        # SAFE read-only fetches — no DB writes
        user_wishlist = Wishlist.objects.get_user_wishlist_safe(user)
        user_cart = Cart.objects.get_user_cart_safe(user)
        order_items = OrderItem.objects.filter(created_by=user)

        # If user has no wishlist or cart, treat categories as empty
        wishlist_categories = (
            user_wishlist.products.values_list("category", flat=True)
            if user_wishlist else []
        )

        cart_categories = (
            user_cart.items.values_list("product__category", flat=True)
            if user_cart else []
        )

        order_categories = order_items.values_list(
            "cart_item__product__category", flat=True
        )

        # Collect user-owned product IDs (only if objects exist)
        user_product_ids = set()
        if user_wishlist:
            user_product_ids.update(
                user_wishlist.products.values_list("id", flat=True)
            )
        if user_cart:
            user_product_ids.update(
                user_cart.items.values_list("product__id", flat=True)
            )
        user_product_ids.update(
            order_items.values_list("cart_item__product__id", flat=True)
        )

        # Build per-source queries (safe even if categories empty)
        wishlist_products = Product.objects.filter(
            category__in=wishlist_categories
        ).exclude(id__in=user_product_ids)

        cart_products = Product.objects.filter(
            category__in=cart_categories
        ).exclude(id__in=user_product_ids)

        order_products = Product.objects.filter(
            category__in=order_categories
        ).exclude(id__in=user_product_ids)

        # Safe union
        recommended = (
            wishlist_products
            .union(cart_products, order_products)
            .order_by("-rating")
        )

        return recommended


class ProductBrandCacheService(BaseCacheService):
    OBJECT_NAME = "product_brands"
    VERSION = 1


class ProductCategoryCacheService(BaseCacheService):
    OBJECT_NAME = "product_categories"
    VERSION = 1

class ProductCacheService(BaseCacheService):
    OBJECT_NAME = "product"
    VERSION = 1
