from rest_framework import serializers
from products.models import Product
from .models import ProductStatistics, ProductView, CartAbandonment


class ProductStatisticsSerializer(serializers.ModelSerializer):
    product_id = serializers.CharField(source='product.id', read_only=True)
    product_name = serializers.CharField(source='product.name')
    product_price = serializers.DecimalField(
        source='product.price', 
        max_digits=10, 
        decimal_places=2, 
        read_only=True
    )
    
    class Meta:
        model = ProductStatistics
        fields = [
            'product_id',
            'product_name',
            'product_price',
            'view_count',
            'cart_add_count',
            'cart_remove_count',
            'purchase_count',
        ]


class ProductViewSerializer(serializers.ModelSerializer):
    product_id = serializers.CharField(source='product.id', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    user_email = serializers.InputField(source='user.email', read_only=True)
    
    class Meta:
        model = ProductView
        fields = ['product_id', 'product_name', 'user_email', 'created_at']


class CartAbandonmentSerializer(serializers.ModelSerializer):
    product_id = serializers.CharField(source='product.id', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_price = serializers.DecimalField(
        source='product.price',
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    lass Meta:
        model = CartAbandonment
        fields = [
            'product_id',
            'product_name',
            'product_price',
            'user_email',
            'quantity',
            'abandoned_at',
        ]


class ProductStatisticsSummarySerializer(serializers.Serializer):
    """Serializer for product statistics summary with ranking."""
    product_id = serializers.CharField()
    product_name = serializers.CharField()
    product_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    metric_value = serializers.IntegerField()
    ranking = serializers.IntegerField()

