from django.shortcuts import render
from .models import Ticket, Comment
from .serializers import TicketListSerializer, TicketCreateSerializer, TicketUpdateSerializer, TicketDetailSerializer, CommentSerializer, CommentCreateSerializer, CommentUpdateSerializer
from rest_framework.generics import CreateAPIView, ListAPIView, RetrieveUpdateDestroyAPIView, RetrieveAPIView

# Create your views here.
class TicketListView(ListAPIView):
    serializer_class = TicketListSerializer

    def get_queryset(self):
        return Ticket.objects.all().order_by('-created_at')
    

class TicketCreateView(CreateAPIView):
    serializer_class = TicketCreateSerializer

    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)

class TicketDetailView(RetrieveAPIView):
    serializer_class = TicketDetailSerializer

    def get_queryset(self):
        return Ticket.objects.all()

class TicketUpdateView(RetrieveUpdateDestroyAPIView):
    serializer_class = TicketUpdateSerializer

    def get_queryset(self):
        return Ticket.objects.all()
    
class CommentListView(ListAPIView):
    serializer_class = CommentSerializer

    def get_queryset(self):
        return Comment.objects.all().order_by('-created_at')
    
class CommentCreateView(CreateAPIView):
    serializer_class = CommentCreateSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class CommentUpdateView(RetrieveUpdateDestroyAPIView):
    serializer_class = CommentUpdateSerializer

    def get_queryset(self):
        return Comment.objects.all()
    