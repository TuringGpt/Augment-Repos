from rest_framework.generics import CreateAPIView, ListAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from .models import BillingAddress, ContactInformation, Order, ShippingAddress
from .serializers import BillingAddressListSerializer, ContactInformationListSerializer, CreateOrderSerializer, OrderListSerializer, OrderDetailSerializer, ShippingAddressListSerializer


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
<<<<<<< HEAD


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
=======
class OrderPaymentView(BaseOrderView, CreateAPIView):
    serializer_class = OrderPaymentSerializer
>>>>>>> 2c9b8412 (SCRUM-35 - create serializer for order payment)
