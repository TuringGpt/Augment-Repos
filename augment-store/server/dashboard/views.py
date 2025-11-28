from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q, Sum
from django.utils import timezone
from datetime import timedelta

from products.models import Product
from .models import ProductStatistics, ProductView, CartAbandonment
from .serializers import (
    ProductStatisticsSerializer,
    ProductStatisticsSummarySerializer,
    CartAbandonmentSerializer,
)


def parse_int_param(value, default, min_value=1, max_value=None):
    """
    Safely parse an integer query parameter with validation.

    Args:
        value: The value to parse (typically from request.query_params)
        default: Default value if parsing fails or value is None
        min_value: Minimum allowed value (default: 1)
        max_value: Maximum allowed value (default: None for no limit)

    Returns:
        A validated integer value
    """
    if value is None:
        return default

    try:
        parsed = int(value)
        # Validate bounds
        if parsed < min_value:
            return default
        if max_value is not None and parsed > max_value:
            return max_value
        return parsed
    except (ValueError, TypeError):
        return default


class ProductStatisticsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for product statistics with multiple endpoints:
    - most_viewed: Products with highest view count within a time window
    - most_added_to_cart: Products most frequently added to cart
    - best_selling: Products with highest purchase count
    - frequently_abandoned: Products frequently abandoned in cart
    - general_statistics: Aggregated statistics across all products
    """
    queryset = ProductStatistics.objects.all()
    serializer_class = ProductStatisticsSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def most_viewed(self, request):
        """
        Get products sorted by view count within a time window (most viewed first).
        Query params:
        - limit: Number of products to return (default: 10, max: 100)
        - days: Number of days to look back (default: 30, max: 365)
        """
        limit = parse_int_param(request.query_params.get('limit'), default=10, max_value=100)
        days = parse_int_param(request.query_params.get('days'), default=30, max_value=365)

        cutoff_date = timezone.now() - timedelta(days=days)

        # Count views from ProductView records within the time window, ordered by period-specific counts
        viewed_products = ProductView.objects.filter(
            created_at__gte=cutoff_date
        ).values('product_id').annotate(
            period_view_count=Count('id')
        ).order_by('-period_view_count')[:limit]

        # Extract product IDs in the order they were ranked by period views
        product_ids = [item['product_id'] for item in viewed_products]

        # Fetch ProductStatistics in the same order as the period-specific ranking
        stats_dict = {stat.product_id: stat for stat in ProductStatistics.objects.filter(
            product_id__in=product_ids
        )}
        stats = [stats_dict[pid] for pid in product_ids if pid in stats_dict]

        serializer = ProductStatisticsSerializer(stats, many=True)
        return Response({
            'count': len(serializer.data),
            'results': serializer.data,
            'metric': 'view_count',
            'period_days': days,
        })

    @action(detail=False, methods=['get'])
    def most_added_to_cart(self, request):
        """
        Get products most frequently added to cart.
        Query params:
        - limit: Number of products to return (default: 10, max: 100)
        """
        limit = parse_int_param(request.query_params.get('limit'), default=10, max_value=100)

        stats = ProductStatistics.objects.filter(
            cart_add_count__gt=0
        ).order_by('-cart_add_count')[:limit]

        serializer = ProductStatisticsSerializer(stats, many=True)
        return Response({
            'count': len(serializer.data),
            'results': serializer.data,
            'metric': 'cart_add_count',
        })

    @action(detail=False, methods=['get'])
    def best_selling(self, request):
        """
        Get best-selling products (highest purchase count).
        Query params:
        - limit: Number of products to return (default: 10, max: 100)
        """
        limit = parse_int_param(request.query_params.get('limit'), default=10, max_value=100)

        stats = ProductStatistics.objects.filter(
            purchase_count__gt=0
        ).order_by('-purchase_count')[:limit]

        serializer = ProductStatisticsSerializer(stats, many=True)
        return Response({
            'count': len(serializer.data),
            'results': serializer.data,
            'metric': 'purchase_count',
        })

    @action(detail=False, methods=['get'])
    def frequently_abandoned(self, request):
        """
        Get products frequently abandoned in cart.
        Query params:
        - limit: Number of products to return (default: 10, max: 100)
        """
        limit = parse_int_param(request.query_params.get('limit'), default=10, max_value=100)

        # Count abandonments per product, ordered by abandonment count
        abandoned_products = CartAbandonment.objects.values('product_id').annotate(
            abandonment_count=Count('id')
        ).order_by('-abandonment_count')[:limit]

        # Extract product IDs in the order they were ranked by abandonment count
        product_ids = [item['product_id'] for item in abandoned_products]

        # Fetch ProductStatistics in the same order as the abandonment ranking
        stats_dict = {stat.product_id: stat for stat in ProductStatistics.objects.filter(
            product_id__in=product_ids
        )}
        stats = [stats_dict[pid] for pid in product_ids if pid in stats_dict]

        serializer = ProductStatisticsSerializer(stats, many=True)
        return Response({
            'count': len(serializer.data),
            'results': serializer.data,
            'metric': 'cart_remove_count',
        })

    @action(detail=False, methods=['get'])
    def general_statistics(self, request):
        """
        Get general statistics for all products.
        Returns aggregated metrics.
        """
        stats_count = ProductStatistics.objects.count()

        return Response({
            'total_products_tracked': stats_count,
            'total_views': ProductStatistics.objects.aggregate(
                total=Sum('view_count')
            )['total'] or 0,
            'total_cart_additions': ProductStatistics.objects.aggregate(
                total=Sum('cart_add_count')
            )['total'] or 0,
            'total_purchases': ProductStatistics.objects.aggregate(
                total=Sum('purchase_count')
            )['total'] or 0,
        })
 