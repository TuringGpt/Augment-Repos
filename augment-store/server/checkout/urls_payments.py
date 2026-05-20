
from django.urls import path
from .views import OrderPaymentView, StripePaymentCallback, PaymentStatusView

app_name = "checkout_payments"
urlpatterns = [
    path('', OrderPaymentView.as_view(), name='payment_order'),
    path("<uuid:pk>/status/", PaymentStatusView.as_view(), name="payment_status"),
    path("stripe/redirect/", StripePaymentCallback.as_view(), name="stripe_redirect"),
]

