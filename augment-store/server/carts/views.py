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
            'items__product__category',
            'items__product__images'
        )
        return cart

class BaseCartItemView(AutoOptimizeMixin):
    permission_classes = [IsAuthenticated]
    queryset = CartItem.objects.all()
    auto_select_related = ['product', 'product__brand', 'product__category']

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


class ListWishListProductsView(AutoOptimizeMixin, BaseWishlistView, ListAPIView):
    serializer_class = ProductListSerializer
    queryset = Product.objects.all()
    auto_select_related = ['brand', 'category', 'created_by']
    auto_prefetch_related = ['images']

    def get_queryset(self):
        return super().get_queryset().filter(
            wishlist__user=self.request.user
        )

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response = self.get_paginated_response(serializer.data)
            response.data['product_count'] = response.data['count']
            return response
        serializer = self.get_serializer(queryset, many=True)
        return Response({'product_count': queryset.count(), 'results': serializer.data})
    

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
