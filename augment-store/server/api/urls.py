
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView
from rest_framework.response import Response
from rest_framework.decorators import api_view


app_name = 'v1'

@api_view(['GET'])
def health_check(request):
    return Response({'status': 'ok'})


urlpatterns = [
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('schema/redoc/', SpectacularRedocView.as_view(url_name='v1:schema'), name='redoc'),
    path('health-check/', health_check, name='health_check'),
    path('auth/', include('authentication.urls')),
    path('accounts/', include('accounts.urls')),
    path('products/', include('products.urls_products')),
    path('products/brands/', include('products.urls_brands')),
    path('products/categories/', include('products.urls_categories')),
    path('storage/', include('storage.urls', namespace='storage')),
    path('carts/', include('carts.urls')),
    path('merchant/', include('merchant.urls', namespace='merchant')),
    path('checkout/', include('checkout.urls')),
    path('checkout/addresses/', include('checkout.urls_addresses')),
    path('checkout/contact-information/', include('checkout.urls_contact_info')),
    path('contact/', include('contact.urls')),
    path('payments/', include('checkout.urls_payments')),
    path('newsletter/', include('newsletter.urls')),
    path('support/tickets/', include('ticket.urls', namespace='ticket')),
    path('wishlist/', include('carts.urls_wishlist')),
    path('notifications/', include('notifications.urls')),
    path('dashboard/', include('dashboard.urls')),
    path('currencies/', include('currencies.urls')),
]
