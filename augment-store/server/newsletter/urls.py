from django.urls import path
from .views import NewsletterView, SubscribeNewsletterView, UnsubscribeNewsletterView, UnsubscribeNewsletterByEmailView, NewsletterStatusView
urlpatterns = [
    path('', NewsletterView.as_view(), name='newsletter'),
    path('subscribe/', SubscribeNewsletterView.as_view(), name='create_newsletter'),
    path('status/', NewsletterStatusView.as_view(), name='newsletter_status'),
    path('unsubscribe/<uuid:pk>', UnsubscribeNewsletterView.as_view(), name='unsubscribe_newsletter'),
    path('unsubscribe-by-email/', UnsubscribeNewsletterByEmailView.as_view(), name='unsubscribe_newsletter_by_email'),
]
