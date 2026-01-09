from rest_framework.generics import CreateAPIView, ListAPIView, RetrieveUpdateDestroyAPIView, RetrieveAPIView, GenericAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response

from .models import Cart, CartItem, Wishlist
from .serializers import AddToCartSerializer, AddToWishlistSerializer, UpdateCartItemSerializer, CartDetailSerializer, RemoveFromWishlistSerializer
from products.serializers import ProductListSerializer
from core.optimization import AutoOptimizeMixin

class BaseCartView:
    permission_classes = [IsAuthenticated]


class CartDetailView(BaseCartView, RetrieveAPIView):
    serializer_class = CartDetailSerializer

    def get_object(self):
        cart = Cart.objects.get_user_cart(self.request.user)
        from django.db.models import prefetch_related_objects
        prefetch_related_objects(
            [cart], 
            'items__product__brand',
            'items__product__images'
        )
        return cart

class BaseCartItemView(AutoOptimizeMixin):
    permission_classes = [IsAuthenticated]
    auto_select_related = ['product', 'product__brand']

    def get_queryset(self):
        user_cart = Cart.objects.get_user_cart(self.request.user)
        return super().get_queryset().filter(cart=user_cart)
    
class AddToCartView(BaseCartItemView, CreateAPIView):
    serializer_class = AddToCartSerializer

class UpdateCartItemView(BaseCartItemView, RetrieveUpdateDestroyAPIView):
    serializer_class = UpdateCartItemSerializer
    


class BaseWishlistView:
    permission_classes = [IsAuthenticated]


class ListWishListProductsView(AutoOptimizeMixin, BaseWishlistView, ListAPIView):
    serializer_class = ProductListSerializer
    auto_select_related = ['brand', 'created_by']
    auto_prefetch_related = ['images']

    def get_queryset(self):
        return Wishlist.objects.get_user_wishlist(self.request.user).products.all()
    

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
