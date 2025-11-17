from rest_framework.generics import CreateAPIView, ListAPIView, RetrieveUpdateDestroyAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from .models import Cart, CartItem, Wishlist

from .serializers import AddToCartSerializer, AddToWishlistSerializer, UpdateCartItemSerializer, CartDetailSerializer, RemoveFromWishlistSerializer
from products.serializers import ProductListSerializer


class BaseCartView:
    permission_classes = [IsAuthenticated]


class CartDetailView(BaseCartView, RetrieveAPIView):
    serializer_class = CartDetailSerializer

    def get_object(self):
        return Cart.objects.get_user_cart(self.request.user)

class BaseCartItemView:
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user_cart = Cart.objects.get_user_cart(self.request.user)
        return user_cart.items.all()
    
class AddToCartView(BaseCartItemView, CreateAPIView):
    serializer_class = AddToCartSerializer

class UpdateCartItemView(BaseCartItemView, RetrieveUpdateDestroyAPIView):
    serializer_class = UpdateCartItemSerializer
    


class BaseWishlistView:
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Wishlist.objects.get_user_wishlist(self.request.user)
    

class ListWishListProductsView(BaseWishlistView, ListAPIView):
    serializer_class = ProductListSerializer

    def get_queryset(self):
        return Wishlist.objects.get_user_wishlist(self.request.user).products.all()
    

class AddToWishlistView(BaseWishlistView, CreateAPIView):
    serializer_class = AddToWishlistSerializer

class RemoveFromWishlistView(BaseWishlistView, CreateAPIView):
    serializer_class = RemoveFromWishlistSerializer
