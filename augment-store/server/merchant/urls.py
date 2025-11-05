
from django.urls import path
from .views import AddToCartView, UpdateCartItemView, CartDetailView, MerchantBrandListView

app_name = "merchant"
urlpatterns = [
    path('brands', MerchantBrand.as_view(), name='merchant_brand_list'),
]
