from django.urls import path

from .views import (
    NewsletterView,
    SubscribeNewsletterView,
    UnsubscribeNewsletterByEmailView,
    UnsubscribeNewsletterView,
)

urlpatterns = [
    path('', NewsletterView.as_view(), name='newsletter'),
    path('subscribe/', SubscribeNewsletterView.as_view(), name='create_newsletter'),
    path('unsubscribe/<uuid:pk>', UnsubscribeNewsletterView.as_view(), name='unsubscribe_newsletter'),
    path('unsubscribe-by-email/', UnsubscribeNewsletterByEmailView.as_view(), name='unsubscribe_newsletter_by_email'),
]

