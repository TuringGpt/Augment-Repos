from django.urls import path

from .views import (
    CommentCreateView,
    CommentDeleteView,
    CommentListView,
    CommentUpdateView,
    TicketCreateView,
    TicketDetailView,
    TicketListView,
    TicketUpdateView,
)

app_name = 'ticket'

urlpatterns = [
    path('', TicketListView.as_view(), name='ticket_list'),
    path('create/', TicketCreateView.as_view(), name='create_ticket'),
    path('<uuid:pk>/', TicketDetailView.as_view(), name='ticket_detail'),
    path('<uuid:pk>/update/', TicketUpdateView.as_view(), name='update_ticket'),
    path('<uuid:pk>/comments/', CommentListView.as_view(), name='comment_list'),
    path('<uuid:pk>/comments/create/', CommentCreateView.as_view(), name='create_comment'),
    path('<uuid:pk>/comments/<uuid:comment_pk>/update/', CommentUpdateView.as_view(), name='update_comment'),
    path('<uuid:pk>/comments/<uuid:comment_pk>/delete/', CommentDeleteView.as_view(), name='delete_comment'),
    path('<uuid:pk>/delete/', TicketUpdateView.as_view(), name='delete_ticket'),
]
