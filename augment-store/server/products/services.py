
from accounts.models import User
from carts.models import Wishlist, Cart
from checkout.models import OrderItem
from products.models import Product, SearchQuery
from core.service import BaseCacheService
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

class ProductService:

    def recommend_products_for_user(self, user: User):
        if not user or not user.is_authenticated:
             return Product.objects.none()

        # SAFE read-only fetches — no DB writes
        user_wishlist = Wishlist.objects.get_user_wishlist_safe(user)
        user_cart = Cart.objects.get_user_cart_safe(user)
        order_items = OrderItem.objects.filter(created_by=user)

        # Optimization: Use select_related and prefetch_related to avoid N+1
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
        ).exclude(id__in=user_product_ids).select_related('brand', 'category').prefetch_related('images')

        cart_products = Product.objects.filter(
            category__in=cart_categories
        ).exclude(id__in=user_product_ids).select_related('brand', 'category').prefetch_related('images')

        order_products = Product.objects.filter(
            category__in=order_categories
        ).exclude(id__in=user_product_ids).select_related('brand', 'category').prefetch_related('images')

        # Safe union
        recommended = (
            wishlist_products
            .union(cart_products, order_products)
            .order_by("-rating")
        )

        return recommended

class SearchService:
    @staticmethod
    def log_search(query_string: str, results_count: int, user: User = None):
        """
        Log search queries for analytics.
        """
        try:
            now = timezone.now()
            logger.info(f"Search triggered at {now} (results count: {results_count})")
            
            sanitized_query = "".join(ch for ch in str(query_string or "") if ch.isprintable())[:255]
            
            SearchQuery.objects.create(
                query=sanitized_query,
                results_count=results_count,
                user=user if user and user.is_authenticated else None
            )
        except Exception:
            logger.exception("Failed to log search due to an unexpected error")
            return

        try:
            SearchQueryCacheService().clear_namespace()
        except Exception:
            logger.exception("Failed to invalidate search query cache")


class ProductBrandCacheService(BaseCacheService):
    OBJECT_NAME = "product_brands"
    VERSION = 1


class ProductCategoryCacheService(BaseCacheService):
    OBJECT_NAME = "product_categories"
    VERSION = 1

class ProductCacheService(BaseCacheService):
    OBJECT_NAME = "product"
    VERSION = 1


class ProductSearchCacheService(BaseCacheService):
    OBJECT_NAME = "product_search"
    VERSION = 1


class SearchQueryCacheService(BaseCacheService):
    OBJECT_NAME = "search_queries"
    VERSION = 1
