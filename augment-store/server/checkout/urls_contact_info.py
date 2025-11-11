
from django.urls import path
from .views import ListContactInformationView

app_name = "checkout"
urlpatterns = [
    path('contact-information/', ListContactInformationView.as_view(), name='list_contact_information'),
]

