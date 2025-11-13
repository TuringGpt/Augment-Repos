from django.urls import path

urlpatterns = [
    path('', NewsletterView.as_view(), name='newsletter'),
]

