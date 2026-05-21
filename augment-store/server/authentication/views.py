from rest_framework.response import Response
from rest_framework.generics import CreateAPIView
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle

from .serializers import ForgotPasswordSerializer, LoginSerializer, RefreshTokenSerializer, RegisterSerializer


class AuthAnonThrottle(AnonRateThrottle):
    scope = "auth_anon"
    rate = "5/min"


class AuthUserThrottle(UserRateThrottle):
    scope = "auth_user"
    rate = "100/min"


class RegisterView(CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = []
    throttle_classes = [AuthAnonThrottle, AuthUserThrottle]


class LoginView(CreateAPIView):
    permission_classes = []

    def get_serializer_class(self):
        return LoginSerializer

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        return Response({
            "message": "Logged out"
        })
    

class RefreshTokenView(CreateAPIView):
    serializer_class = RefreshTokenSerializer
    permission_classes = []


class ResetPasswordView(CreateAPIView):
    serializer_class = ForgotPasswordSerializer
    permission_classes = []

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({
            "message": "Password reset email sent"
        })

