from rest_framework import serializers
from .models import User


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for retrieving user profile information"""

    full_name = serializers.CharField(read_only=True)
    is_registration_completed = serializers.BooleanField(read_only=True)
    profile_image = serializers.SerializerMethodField()

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

    def get_profile_image(self, obj: User):
        if obj.profile_image:
            return obj.profile_image.file.url
        return None


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
