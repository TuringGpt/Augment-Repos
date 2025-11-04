
from django.urls import path
from .views import AddToCartView, UpdateCartItemView, CartDetailView, MerchantBrandListView

app_name = "merchant"
urlpatterns = [
    path('brands', MerchantBrandListView.as_view(), name='merchant_brand_list'),
]
