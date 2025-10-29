
from django.urls import path
from .views import AddToCartView, UpdateCartItemView, CartDetailView

app_name = "carts"
urlpatterns = [
    path('add-item/', AddToCartView.as_view(), name='add_to_cart'),
    path('items/<uuid:pk>/', UpdateCartItemView.as_view(), name='update_cart_item'),
    path('', CartDetailView.as_view(), name='cart_detail'),
]
