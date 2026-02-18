from rest_framework import serializers
from .models import Newsletter

class NewsletterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Newsletter
        fields = ["email"]

class SubscribeNewsletterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Newsletter
        fields = ["email"]

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
        fields = ["email"]

    def update(self, instance, validated_data):
        instance.is_active = False
        instance.save()
        return instance