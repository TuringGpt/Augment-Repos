from rest_framework import serializers
from .models import Newsletter

class NewsletterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Newsletter
        fields = ["id", "email", "is_active", "created_at"]

class SubscribeNewsletterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Newsletter
        fields = ["email"]
        extra_kwargs = {"email": {"validators": []}}

    def validate_email(self, value):
        return value.strip().lower()

    def create(self, validated_data):
        newsletter, created = Newsletter.objects.update_or_create(
            email=validated_data["email"],
            defaults={"is_active": True},
        )
        return newsletter
    
class UnsubscribeNewsletterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Newsletter
        fields = ["email", "is_active"]
        read_only_fields = ["is_active"]

    def update(self, instance, validated_data):
        instance.is_active = False
        instance.save()
        return instance

class AdminNewsletterUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Newsletter
        fields = ["id", "email", "is_active", "created_at"]
        read_only_fields = ["email"]
