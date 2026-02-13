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

    def validate_code(self, value):
        normalized = value.upper().strip()
        # Check uniqueness manually to handle normalization before DB check
        qs = Currency.objects.filter(code__iexact=normalized)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Currency with this code already exists.")
        return normalized

    def validate_name(self, value):
        normalized = value.strip()
        qs = Currency.objects.filter(name__iexact=normalized)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Currency with this name already exists.")
        return normalized
