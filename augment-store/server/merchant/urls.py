from django.urls import path
from .views import MerchantBrandListView, MerchantProductListView, MerchantOrdersListView

app_name = "merchant"
urlpatterns = [
    path('<uuid:pk>/brands/', MerchantBrandListView.as_view(), name='merchant_brand_list'),
    path('<uuid:pk>/products/', MerchantProductListView.as_view(), name='merchant_product_list'),
    path('orders/', MerchantOrdersListView.as_view(), name='merchant_order_list'),
]