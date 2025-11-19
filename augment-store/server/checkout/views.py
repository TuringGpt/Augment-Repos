from rest_framework.generics import CreateAPIView, ListAPIView, RetrieveAPIView
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .services import StripeService
from .models import BillingAddress, ContactInformation, Order, ShippingAddress
from .serializers import BillingAddressListSerializer, ContactInformationListSerializer, CreateOrderSerializer, OrderListSerializer, OrderDetailSerializer, ShippingAddressListSerializer
from .models import Order, Payment
from .serializers import CreateOrderSerializer, OrderListSerializer, OrderDetailSerializer, OrderPaymentSerializer, PaymentStatusSerializer


class BaseOrderView:
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users can only see their own orders
        return Order.objects.filter(created_by=self.request.user).order_by('-created_at')


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

class OrderPaymentView(BaseOrderView, CreateAPIView):
    serializer_class = OrderPaymentSerializer



class BasePaymentView:
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users can only see their own payments
        return Payment.objects.filter(created_by=self.request.user).order_by('-created_at')

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
    pass
