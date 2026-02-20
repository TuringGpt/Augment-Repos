import typing

from django.conf import settings
from django.core.exceptions import ValidationError
from django.http import Http404
from django.shortcuts import redirect, get_object_or_404
from django.urls import reverse
from django.views.generic import TemplateView

from rest_framework import status
from rest_framework.generics import CreateAPIView, ListAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import BillingAddress, ContactInformation, Order, Payment, ShippingAddress
from .serializers import (
    BillingAddressListSerializer,
    ContactInformationListSerializer,
    CreateOrderSerializer,
    OrderDetailSerializer,
    OrderListSerializer,
    OrderPaymentSerializer,
    PaymentStatusSerializer,
    ShippingAddressListSerializer,
)
from .services import StripeService

from core.optimization import AutoOptimizeMixin

if typing.TYPE_CHECKING:
    from django.db.models.query import QuerySet

class BaseOrderView(AutoOptimizeMixin):
    """Base view for Order related operations with auto-optimization."""
    permission_classes = [IsAuthenticated]
    queryset = Order.objects.all()
    auto_select_related = ("shipping_address", "billing_address", "contact_information", "created_by")
    auto_prefetch_related = (
        'items__product__brand',
        'items__product__category',
        'items__product__images'
    )

    def get_queryset(self) -> "QuerySet[Order]":
        # Users can only see their own orders
        return super().get_queryset().filter(created_by=self.request.user).order_by('-created_at')


class CreateOrderView(BaseOrderView, CreateAPIView):
    serializer_class = CreateOrderSerializer


class OrderListView(BaseOrderView, ListAPIView):
    serializer_class = OrderListSerializer


class RetrieveOrderView(BaseOrderView, RetrieveAPIView):
    serializer_class = OrderDetailSerializer


class ListShippingAddressView(AutoOptimizeMixin, ListAPIView):
    serializer_class = ShippingAddressListSerializer
    permission_classes = [IsAuthenticated]
    queryset = ShippingAddress.objects.all()
    auto_select_related = ['user']

    def get_queryset(self):
        return super().get_queryset().filter(user=self.request.user)
    
class ListBillingAddressView(AutoOptimizeMixin, ListAPIView):
    serializer_class = BillingAddressListSerializer
    permission_classes = [IsAuthenticated]
    queryset = BillingAddress.objects.all()
    auto_select_related = ['user']

    def get_queryset(self):
        return super().get_queryset().filter(user=self.request.user)
    

class ListContactInformationView(AutoOptimizeMixin, ListAPIView):
    serializer_class = ContactInformationListSerializer
    permission_classes = [IsAuthenticated]
    queryset = ContactInformation.objects.all()
    auto_select_related = ['user']

    def get_queryset(self):
        return super().get_queryset().filter(user=self.request.user)


class BasePaymentView(AutoOptimizeMixin):
    """Base view for Payment related operations with auto-optimization."""
    permission_classes = [IsAuthenticated]
    queryset = Payment.objects.all()
    auto_select_related = ("order",)

    def get_queryset(self) -> "QuerySet[Payment]":
        # Users can only see their own payments
        return super().get_queryset().filter(created_by=self.request.user).order_by('-created_at')

class OrderPaymentView(BasePaymentView, CreateAPIView):
    serializer_class = OrderPaymentSerializer

class PaymentStatusView(BasePaymentView, RetrieveAPIView):
    serializer_class = PaymentStatusSerializer

    def retrieve(self, request, *args, **kwargs):
        payment = self.get_object()

        # Call Stripe here
        stripe_service = StripeService()
        stripe_service.check_and_update_payment_status(payment)

        # Now serialize updated payment
        serializer = self.get_serializer(payment)
        return Response(serializer.data)
    
class StripePaymentCallback(APIView):
    """
    Callback view for Stripe payment operations.
    """
    
    def get(self, request, *args, **kwargs):
        # Get the payment id from the query params
        payment_id = request.GET.get("payment_id")

        try:
            payment = get_object_or_404(Payment, id=payment_id)
        except (ValidationError, ValueError):
            raise Http404

        stripe_service = StripeService()

        stripe_service.check_and_update_payment_status(payment)
     
        return redirect(reverse("v1:checkout:order_confirmation", kwargs={"pk": payment.order.id}))

        
    
    def post(self, request, *args, **kwargs):
        return self.get(request, *args, **kwargs)

class CheckoutPaymentConfirmationView(TemplateView):
    template_name = "checkout/payment-confirmation.html"

    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["return_url"] = settings.FRONTEND_URL
        return context
