from django.conf import settings
from django.shortcuts import redirect
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

class BaseOrderView:
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users can only see their own orders
        return Order.objects.filter(created_by=self.request.user).select_related(
            'shipping_address',
            'billing_address',
            'contact_information',
            'created_by'
        ).prefetch_related(
            'items__product__brand',
            'items__product__category',
            'items__product__images'
        ).order_by('-created_at')


class CreateOrderView(BaseOrderView, CreateAPIView):
    serializer_class = CreateOrderSerializer


class OrderListView(BaseOrderView, ListAPIView):
    serializer_class = OrderListSerializer


class RetrieveOrderView(BaseOrderView, RetrieveAPIView):
    serializer_class = OrderDetailSerializer


class ListShippingAddressView(ListAPIView):
    serializer_class = ShippingAddressListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ShippingAddress.objects.filter(user=self.request.user)
    
class ListBillingAddressView(ListAPIView):
    serializer_class = BillingAddressListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return BillingAddress.objects.filter(user=self.request.user)
    

class ListContactInformationView(ListAPIView):
    serializer_class = ContactInformationListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ContactInformation.objects.filter(user=self.request.user)


class BasePaymentView:
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users can only see their own payments
        return Payment.objects.filter(created_by=self.request.user).select_related('order').order_by('-created_at')

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
    
    def get(self, request, *args, **kwargs):
        # Get the payment id from the query params
        payment_id = request.GET.get("payment_id")

        try:
            payment = Payment.objects.get(id=payment_id)
            stripe_service = StripeService()

            stripe_service.check_and_update_payment_status(payment)
         
            return redirect(reverse("v1:checkout:order_confirmation", kwargs={"pk": payment.order.id}))
        
        except Payment.DoesNotExist:
            return Response(
                {"status": "error", "message": "Payment not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )

        
    
    def post(self, request, *args, **kwargs):
        return self.get(request, *args, **kwargs)

class CheckoutPaymentConfirmationView(TemplateView):
    template_name = "checkout/payment-confirmation.html"

    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["return_url"] = settings.FRONTEND_URL
        return context
