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
    
class AddToCartView(BaseCartView, CreateAPIView):
    serializer_class = AddToCartSerializer

class UpdateCartItemView(BaseCartView, RetrieveUpdateDestroyAPIView):
    serializer_class = UpdateCartItemSerializer
    
