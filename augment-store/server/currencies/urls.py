from django.urls import path
from .views import CurrencyListView, CreateCurrencyView, AdminCurrencyUpdateDeleteView

app_name = 'currencies'

urlpatterns = [
    path('', CurrencyListView.as_view(), name='currency_list'),
    path('create/', CreateCurrencyView.as_view(), name='create_currency'),
    path('<int:pk>/', AdminCurrencyUpdateDeleteView.as_view(), name='admin_currency_update_delete'),
]
