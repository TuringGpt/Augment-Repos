from django.shortcuts import render

# Create your views here.
class TicketListView:
    class_serializer = TicketListSerializer

    def get_queryset(self):
        return Ticket.objects.all().order_by('-created_at')
    

class TicketCreateView:
    serializer_class = TicketCreateSerializer

    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)

class TicketDetailView:
    serializer_class = TicketDetailSerializer

    def get_queryset(self):
        return Ticket.objects.all()

class TicketUpdateView:
    serializer_class = TicketUpdateSerializer

    def get_queryset(self):
        return Ticket.objects.all()
    
class CommentListView:
    serializer_class = CommentSerializer

    def get_queryset(self):
        return Comment.objects.all().order_by('-created_at')
    
class CommentCreateView:
    serializer_class = CommentCreateSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class CommentUpdateView:
    serializer_class = CommentUpdateSerializer

    def get_queryset(self):
        return Comment.objects.all()
    