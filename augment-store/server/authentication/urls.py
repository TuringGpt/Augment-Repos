
from django.urls import path
from .views import RegisterView, LoginView, RefreshTokenView, ResetPasswordView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('refresh-token/', RefreshTokenView.as_view(), name='refresh_token'),
    path('forgot-password/', ResetPasswordView.as_view(), name='forgot_password'),
]
