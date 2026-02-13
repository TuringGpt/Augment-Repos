from rest_framework import serializers

from .models import Currency


class ListCurrencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Currency
        fields = ("id", "name", "code", "symbol", "created_at", "updated_at")


class CreateCurrencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Currency
        fields = ("name", "code", "symbol")
