from django.urls import path
from .views import MerchantBrandListView

app_name = "merchant"
urlpatterns = [
    path('<uuid:pk>/brands', MerchantBrandListView.as_view(), name='merchant_brand_list'),
]