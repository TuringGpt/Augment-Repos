from rest_framework.generics import CreateAPIView, ListAPIView, RetrieveUpdateDestroyAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from .models import Cart, CartItem

from .serializers import AddToCartSerializer, UpdateCartItemSerializer, CartDetailSerializer


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
    
