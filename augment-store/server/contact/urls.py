from django.urls import path

from .views import ContactDetailView, ContactListView, CreateContactView

urlpatterns = [
    path('', ContactListView.as_view(), name='contact_list'),
    path('create/', CreateContactView.as_view(), name='create_contact'),
    path('<uuid:pk>/', ContactDetailView.as_view(), name='contact_detail'),
]

