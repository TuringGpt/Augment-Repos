

from rest_framework import serializers
from accounts.models import User
from rest_framework_simplejwt.tokens import RefreshToken



class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    class Meta:
        model = User
        fields = ["email", "password", "first_name", "last_name"]

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
        )
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(write_only=True, required=True)
    password = serializers.CharField(write_only=True, required=True)
    refresh = serializers.CharField(read_only=True)
    access = serializers.CharField(read_only=True)

 
    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        user = User.objects.filter(email=email).first()

        if not user:
            raise serializers.ValidationError("Invalid credentials")
        # if user is not active, raise error
        if not user.is_active:
            raise serializers.ValidationError("User is not active")
        
        if not user.check_password(password):
            raise serializers.ValidationError("Invalid credentials")
        
        return attrs
        
    def create(self, validated_data):
        user = User.objects.filter(email=validated_data["email"]).get()
        refresh = RefreshToken.for_user(user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class RefreshTokenSerializer(serializers.Serializer):
    refresh = serializers.CharField(required=True)
    access = serializers.CharField(read_only=True)

    
    def create(self, validated_data):
        refresh = RefreshToken(validated_data["refresh"])
        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }
