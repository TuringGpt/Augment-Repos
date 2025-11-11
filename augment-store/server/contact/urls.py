from django.urls import path
from .views import ContactView

urlpatterns = [
    path('', ContactView.as_view(), name='contact_list_create'),
    path('create/', ContactView.as_view(), name='create_contact'),
    path('<uuid:pk>/', ContactView.as_view(), name='contact_detail'),
]

