from rest_framework.generics import CreateAPIView, ListAPIView, RetrieveUpdateDestroyAPIView, RetrieveAPIView, GenericAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response

from .models import Cart, CartItem, Wishlist
from .serializers import AddToCartSerializer, AddToWishlistSerializer, UpdateCartItemSerializer, CartDetailSerializer, RemoveFromWishlistSerializer
from products.serializers import ProductListSerializer
from core.optimization import AutoOptimizeMixin
from core.service import CachedRetrieveMixin, CachedListMixin, CacheInvalidatorMixin, BaseCacheService


class CartCacheService(BaseCacheService):
    OBJECT_NAME = "cart"
    VERSION = 1


class WishlistCacheService(BaseCacheService):
    OBJECT_NAME = "wishlist"
    VERSION = 1


class BaseCartView:
    permission_classes = [IsAuthenticated]


class CartDetailView(CachedRetrieveMixin, BaseCartView, RetrieveAPIView):
    serializer_class = CartDetailSerializer
    cache_service_class = CartCacheService
    cache_ttl = 60 * 10

    def get_object(self):
        cart = Cart.objects.get_user_cart(self.request.user)
        from django.db.models import prefetch_related_objects
        prefetch_related_objects(
            [cart], 
            'items__product__brand',
            'items__product__category',
            'items__product__images'
        )
        return cart


class BaseCartItemView(CacheInvalidatorMixin, AutoOptimizeMixin):
    permission_classes = [IsAuthenticated]
    queryset = CartItem.objects.all()
    auto_select_related = ['product', 'product__brand', 'product__category']
    cache_service_class = CartCacheService

    def get_queryset(self):
        user_cart = Cart.objects.get_user_cart(self.request.user)
        return super().get_queryset().filter(carts=user_cart)
    

class AddToCartView(BaseCartItemView, CreateAPIView):
    serializer_class = AddToCartSerializer


class UpdateCartItemView(BaseCartItemView, RetrieveUpdateDestroyAPIView):
    serializer_class = UpdateCartItemSerializer
    


from products.models import Product


class BaseWishlistView:
    permission_classes = [IsAuthenticated]


class ListWishListProductsView(CachedListMixin, AutoOptimizeMixin, BaseWishlistView, ListAPIView):
    serializer_class = ProductListSerializer
    queryset = Product.objects.all()
    auto_select_related = ['brand', 'category', 'created_by']
    auto_prefetch_related = ['images']
    cache_service_class = WishlistCacheService
    cache_ttl = 60 * 15

    def get_queryset(self):
        return super().get_queryset().filter(
            wishlist__user=self.request.user
        )
    

class AddToWishlistView(CacheInvalidatorMixin, BaseWishlistView, GenericAPIView):
    serializer_class = AddToWishlistSerializer
    cache_service_class = WishlistCacheService

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        self.invalidate_cache()

        return Response(
            {
                "detail": "Added to wishlist",
                **serializer.data
            }, 
            status=status.HTTP_200_OK
        )


class RemoveFromWishlistView(BaseWishlistView, GenericAPIView):
    serializer_class = RemoveFromWishlistSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product_ids = serializer.validated_data["product_ids"]
        user = self.request.user
        wishlist = Wishlist.objects.get_user_wishlist(user)
        wishlist.products.remove(*product_ids)

        return Response(
            {
                "detail": "Removed from wishlist",
                "product_ids": product_ids
            }, 
            status=status.HTTP_200_OK
        )
