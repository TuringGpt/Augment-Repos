from django.urls import path
from .views import CreateContactView, ContactListView

urlpatterns = [
    path('', ContactListView.as_view(), name='contact_list_create'),
    path('create/', CreateContactView.as_view(), name='create_contact'),
]

