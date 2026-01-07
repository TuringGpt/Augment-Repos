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

    def create(self, validated_data):
        return Newsletter.objects.create(**validated_data)

class UnsubscribeNewsletterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Newsletter
        fields = ["email"]

    def update(self, instance, validated_data):
        instance.is_active = False
        instance.save()
        return instance
