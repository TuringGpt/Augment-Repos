from rest_framework import serializers
from .models import User
from storage.serializers import FileSerializer, FileListSerializer


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for retrieving user profile information"""
    full_name = serializers.CharField(read_only=True)
    is_registration_completed = serializers.BooleanField(read_only=True)
    profile_image = FileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "full_name",
            "mobile",
            "gender",
            "image",
            "profile_image",
            "role",
            "is_active",
            "is_registration_completed",
            "date_joined",
        ]
        read_only_fields = ["id", "email", "role", "is_active", "date_joined"]

    


class UpdateUserProfileSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile information"""
    
    class Meta:
        model = User
        fields = [
            "username",
            "first_name",
            "last_name",
            "mobile",
            "gender",
            "image",
            "profile_image",
        ]
    
    def validate_mobile(self, value):
        """Validate mobile number format"""
        if value and len(value) > 20:
            raise serializers.ValidationError("Mobile number is too long")
        return value


class UserListSerializer(serializers.ModelSerializer):
    """Serializer for retrieving list of users"""
    full_name = serializers.CharField(read_only=True)
    profile_image = FileListSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "full_name",
            "profile_image",
        ]