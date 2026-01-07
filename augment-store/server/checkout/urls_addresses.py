
from django.urls import path

from .views import ListBillingAddressView, ListShippingAddressView

app_name = "checkout-addresses"
urlpatterns = [
    path('shipping-addresses/', ListShippingAddressView.as_view(), name='list_shipping_addresses'),
    path('billing-addresses/', ListBillingAddressView.as_view(), name='list_billing_addresses'),
]

