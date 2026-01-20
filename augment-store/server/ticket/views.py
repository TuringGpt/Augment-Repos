from django.shortcuts import get_object_or_404
from .models import Ticket, Comment
from .serializers import TicketListSerializer, TicketCreateSerializer, TicketUpdateSerializer, TicketDetailSerializer, CommentSerializer, CommentCreateSerializer, CommentUpdateSerializer
from rest_framework.generics import CreateAPIView, ListAPIView, RetrieveUpdateDestroyAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from core.optimization import AutoOptimizeMixin

# Create your views here.
class TicketBaseView(AutoOptimizeMixin):
    permission_classes = [IsAuthenticated]
    queryset = Ticket.objects.all()
    auto_select_related = ['reporter', 'assignee']

class TicketListView(TicketBaseView, ListAPIView):
    serializer_class = TicketListSerializer

    def get_queryset(self):
        return super().get_queryset().order_by('-created_at')
    

class TicketCreateView(TicketBaseView, CreateAPIView):
    serializer_class = TicketCreateSerializer
        
    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)

class TicketDetailView(TicketBaseView, RetrieveAPIView):
    serializer_class = TicketDetailSerializer

class TicketUpdateView(TicketBaseView, RetrieveUpdateDestroyAPIView):
    serializer_class = TicketUpdateSerializer
    
class CommentBaseView(AutoOptimizeMixin):
    permission_classes = [IsAuthenticated]
    queryset = Comment.objects.all()
    auto_select_related = ['user', 'ticket']

class CommentListView(CommentBaseView, ListAPIView):
    serializer_class = CommentSerializer
    
    def get_queryset(self):
        ticket_id = self.kwargs.get("pk")
        get_object_or_404(Ticket, id=ticket_id)
        return super().get_queryset().filter(ticket_id=ticket_id).order_by('-created_at')
    
class CommentCreateView(CommentBaseView, CreateAPIView):
    serializer_class = CommentCreateSerializer
    
    def perform_create(self, serializer):
        ticket_id = self.kwargs.get("pk")
        ticket = get_object_or_404(Ticket, id=ticket_id)
        serializer.save(user=self.request.user, ticket=ticket)

class CommentUpdateView(CommentBaseView, RetrieveUpdateDestroyAPIView):
    serializer_class = CommentUpdateSerializer
    lookup_url_kwarg = 'comment_pk'

    def get_queryset(self):
        ticket_id = self.kwargs.get("pk")
        return super().get_queryset().filter(ticket_id=ticket_id)
    
class CommentDeleteView(CommentBaseView, RetrieveUpdateDestroyAPIView):
    serializer_class = CommentUpdateSerializer
    lookup_url_kwarg = 'comment_pk'

    def get_queryset(self):
        ticket_id = self.kwargs.get("pk")
        return super().get_queryset().filter(ticket_id=ticket_id)