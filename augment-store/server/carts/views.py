from rest_framework import status
from rest_framework.generics import (
    CreateAPIView,
    GenericAPIView,
    ListAPIView,
    RetrieveAPIView,
    RetrieveUpdateDestroyAPIView,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from products.serializers import ProductListSerializer

from .models import Cart, Wishlist
from .serializers import (
    AddToCartSerializer,
    AddToWishlistSerializer,
    CartDetailSerializer,
    RemoveFromWishlistSerializer,
    UpdateCartItemSerializer,
)


class BaseCartView:
    permission_classes = [IsAuthenticated]


class CartDetailView(BaseCartView, RetrieveAPIView):
    serializer_class = CartDetailSerializer

    def get_object(self):
        cart = Cart.objects.get_user_cart(self.request.user)
        # Prefetch related objects for the cart instance
        from django.db.models import prefetch_related_objects
        prefetch_related_objects(
            [cart],
            'items__product__brand',
            'items__product__category',
            'items__product__images'
        )
        return cart

class BaseCartItemView:
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user_cart = Cart.objects.get_user_cart(self.request.user)
        return user_cart.items.all().select_related('product', 'product__brand', 'product__category')

class AddToCartView(BaseCartItemView, CreateAPIView):
    serializer_class = AddToCartSerializer

class UpdateCartItemView(BaseCartItemView, RetrieveUpdateDestroyAPIView):
    serializer_class = UpdateCartItemSerializer



class BaseWishlistView:
    permission_classes = [IsAuthenticated]


class ListWishListProductsView(BaseWishlistView, ListAPIView):
    serializer_class = ProductListSerializer

    def get_queryset(self):
        return Wishlist.objects.get_user_wishlist(self.request.user).products.all().select_related(
            'brand', 'category', 'created_by'
        ).prefetch_related('images')


class AddToWishlistView(BaseWishlistView, GenericAPIView):
    serializer_class = AddToWishlistSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

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
