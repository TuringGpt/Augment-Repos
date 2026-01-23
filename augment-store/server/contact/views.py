from rest_framework.generics import CreateAPIView, RetrieveUpdateDestroyAPIView, ListAPIView
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import hasAdminRole
from .models import ContactMessage
from .serializers import ContactMessageSerializer
from core.optimization import AutoOptimizeMixin

class BaseContactView(AutoOptimizeMixin):
    serializer_class = ContactMessageSerializer
    queryset = ContactMessage.objects.all()

    def get_queryset(self):
        return super().get_queryset().order_by('-created_at')
    
class ContactListView(BaseContactView, ListAPIView):
    serializer_class = ContactMessageSerializer
    permission_classes = [IsAuthenticated, hasAdminRole]

class CreateContactView(BaseContactView, CreateAPIView):
    serializer_class = ContactMessageSerializer

class ContactDetailView(BaseContactView, RetrieveUpdateDestroyAPIView):
    serializer_class = ContactMessageSerializer
    permission_classes = [IsAuthenticated, hasAdminRole]
