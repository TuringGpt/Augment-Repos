from rest_framework.generics import CreateAPIView, RetrieveUpdateDestroyAPIView, ListAPIView
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from .models import ContactMessage
from .serializers import ContactMessageSerializer

class BaseContactView:
    serializer_class = ContactMessageSerializer

    def get_queryset(self):
        return ContactMessage.objects.all().order_by('-created_at')
    
class ContactListView(BaseContactView, ListAPIView):
    serializer_class = ContactMessageSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class CreateContactView(BaseContactView, CreateAPIView):
    serializer_class = ContactMessageSerializer

class ContactDetailView(BaseContactView, RetrieveUpdateDestroyAPIView):
    serializer_class = ContactMessageSerializer
    permission_classes = [IsAuthenticated]
