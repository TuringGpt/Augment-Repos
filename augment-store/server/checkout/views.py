from rest_framework.generics import CreateAPIView, ListAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from .models import Order
from .serializers import CreateOrderSerializer, OrderListSerializer, OrderDetailSerializer


class BaseOrderView:
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users can only see their own orders
        return Order.objects.filter(created_by=self.request.user).order_by('-created_at')


class CreateOrderView(BaseOrderView, CreateAPIView):
    serializer_class = CreateOrderSerializer


class OrderListView(BaseOrderView, ListAPIView):
    serializer_class = OrderListSerializer

# RetrieveOrderView

class RetrieveOrderView(BaseOrderView, RetrieveAPIView):
    serializer_class = OrderDetailSerializer
