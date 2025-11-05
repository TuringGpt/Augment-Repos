
from django.urls import path
from .views import CreateOrderView, OrderListView

app_name = "checkout"
urlpatterns = [
    path('orders/', OrderListView.as_view(), name='order_list'),
    path('orders/create/', CreateOrderView.as_view(), name='create_order'),
    path('orders/<uuid:pk>/', RetrieveOrderView.as_view(), name='retrieve_order'),
]

