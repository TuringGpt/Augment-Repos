from django.urls import path
from .views import NewsletterView, SubscribeNewsletterView, UnsubscribeNewsletterView
urlpatterns = [
    path('', NewsletterView.as_view(), name='newsletter'),
    path('subscribe/', SubscribeNewsletterView.as_view(), name='create_newsletter'),
    path('unsubscribe/', UnsubscribeNewsletterView.as_view(), name='unsubscribe_newsletter'),
]

