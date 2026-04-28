from rest_framework import serializers
from .models import User
from storage.serializers import FileSerializer, FileListSerializer
from storage.models import File
from currencies.serializers import ListCurrencySerializer


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for retrieving user profile information"""
    full_name = serializers.CharField(read_only=True)
    is_registration_completed = serializers.BooleanField(read_only=True)
    profile_image = FileSerializer(read_only=True)
    preferred_currency = ListCurrencySerializer(read_only=True)
    
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
            "preferred_currency",
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

    def validate_profile_image(self, value):
        user = self.context.get("request").user
        if value and value.created_by_id and value.created_by_id != user.id:
            raise serializers.ValidationError("Profile image does not exist")
        return value


class UserListSerializer(serializers.ModelSerializer):
    """Serializer for retrieving list of users"""
    full_name = serializers.CharField(read_only=True)
    profile_image = FileListSerializer(read_only=True)
    preferred_currency = ListCurrencySerializer(read_only=True)
    
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
            "role",
            "preferred_currency",
            "is_active",
            "date_joined",
        ]


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for admins to update a user's role or active status"""
    
    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "role",
            "is_active",
            "date_joined",
        ]
        read_only_fields = ["id", "email", "date_joined"]
