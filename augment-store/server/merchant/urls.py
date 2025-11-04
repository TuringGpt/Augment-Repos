
from django.urls import path
from .views import AddToCartView, UpdateCartItemView, CartDetailView

app_name = "merchant"
urlpatterns = [
    path('brands', UpdateCartItemView.as_view(), name='merchant_brand_list'),
]
