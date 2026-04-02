from django.urls import path
from .views import (
    CreateOrderView, 
    OrderListView, 
    RetrieveOrderView, 
    CheckoutPaymentConfirmationView,
    AdminOrderListView,
    AdminOrderUpdateView,
    AdminShippingAddressListView,
    AdminPaymentListView,
    AdminBillingAddressListView,
    AdminContactInfoListView,
    AdminOrderItemListView
)
app_name = "checkout"
urlpatterns = [
    path('orders/', OrderListView.as_view(), name='order_list'),
    path('orders/create/', CreateOrderView.as_view(), name='create_order'),
    path('orders/<uuid:pk>/', RetrieveOrderView.as_view(), name='retrieve_order'),
    path('payments/<uuid:pk>/confirmation/', CheckoutPaymentConfirmationView.as_view(), name='order_confirmation'),
    
    # Admin routes
    path('admin/orders/', AdminOrderListView.as_view(), name='admin_order_list'),
    path('admin/orders/<uuid:pk>/', AdminOrderUpdateView.as_view(), name='admin_order_update'),
    path('admin/shipping-addresses/', AdminShippingAddressListView.as_view(), name='admin_shipping_address_list'),
    path('admin/billing-addresses/', AdminBillingAddressListView.as_view(), name='admin_billing_address_list'),
    path('admin/contact-info/', AdminContactInfoListView.as_view(), name='admin_contact_info_list'),
    path('admin/payments/', AdminPaymentListView.as_view(), name='admin_payment_list'),
    path('admin/order-items/', AdminOrderItemListView.as_view(), name='admin_order_item_list'),
]
