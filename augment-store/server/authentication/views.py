from .serializers import ForgotPasswordSerializer, LoginSerializer, RefreshTokenSerializer, RegisterSerializer
from rest_framework.response import Response
from rest_framework.generics import CreateAPIView



class RegisterView(CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = []


class LoginView(CreateAPIView):
    permission_classes = []

    def get_serializer_class(self):
        return LoginSerializer
    

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

