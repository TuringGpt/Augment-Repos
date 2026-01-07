
from django.urls import path

from .views import ListContactInformationView

app_name = "checkout-contact-info"
urlpatterns = [
    path('', ListContactInformationView.as_view(), name='list_contact_information'),
]

