from django.shortcuts import get_object_or_404
from .models import Ticket, Comment
from .serializers import TicketListSerializer, TicketCreateSerializer, TicketUpdateSerializer, TicketDetailSerializer, CommentSerializer, CommentCreateSerializer, CommentUpdateSerializer
from rest_framework.generics import CreateAPIView, ListAPIView, RetrieveUpdateDestroyAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated

# Create your views here.
class TicketListView(ListAPIView):
    serializer_class = TicketListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Ticket.objects.all().order_by('-created_at')
    

class TicketCreateView(CreateAPIView):
    serializer_class = TicketCreateSerializer
    permission_classes = [IsAuthenticated]
        
    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)

class TicketDetailView(RetrieveAPIView):
    serializer_class = TicketDetailSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Ticket.objects.all()

class TicketUpdateView(RetrieveUpdateDestroyAPIView):
    serializer_class = TicketUpdateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Ticket.objects.all()
    
class CommentListView(ListAPIView):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        ticket_id = self.kwargs.get("pk")
        ticket = get_object_or_404(Ticket, id=ticket_id)
        return Comment.objects.filter(ticket=ticket).order_by('-created_at')
    
class CommentCreateView(CreateAPIView):
    serializer_class = CommentCreateSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        ticket_id = self.kwargs.get("pk")
        ticket = get_object_or_404(Ticket, id=ticket_id)
        serializer.save(user=self.request.user, ticket=ticket)

class CommentUpdateView(RetrieveUpdateDestroyAPIView):
    serializer_class = CommentUpdateSerializer
    permission_classes = [IsAuthenticated]
    lookup_url_kwarg = 'comment_pk'

    def get_queryset(self):
        ticket_id = self.kwargs.get("pk")
        ticket = get_object_or_404(Ticket, id=ticket_id)
        return Comment.objects.filter(ticket=ticket)
    
class CommentDeleteView(RetrieveUpdateDestroyAPIView):
    serializer_class = CommentUpdateSerializer
    permission_classes = [IsAuthenticated]
    lookup_url_kwarg = 'comment_pk'

    def get_queryset(self):
        ticket_id = self.kwargs.get("pk")
        ticket = get_object_or_404(Ticket, id=ticket_id)
        return Comment.objects.filter(ticket=ticket)