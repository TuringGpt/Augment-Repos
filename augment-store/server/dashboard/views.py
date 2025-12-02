from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Sum
from django.db.models.functions import TruncDate, TruncHour
from django.utils import timezone
from datetime import timedelta

from carts.models import CartItem
from checkout.models import OrderItem
from .models import ProductStatistics, ProductView, CartAbandonment
from .serializers import ProductStatisticsSerializer


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

    @action(detail=False, methods=['get'])
    def time_series_trends(self, request):
        """
        Get time-series trends for various metrics.
        Query params:
        - metric: Metric to track (views, cart_additions, purchases, abandonments, all)
        - days: Number of days to look back (default: 30, max: 365)
        - granularity: Time granularity (daily, hourly) (default: daily)
        - product_id: Optional product ID to filter by specific product

        Returns time-series data with counts for each time period.
        """
        # Parse parameters
        metric = request.query_params.get('metric', 'all')
        days = parse_int_param(request.query_params.get('days'), default=30, max_value=365)
        granularity = request.query_params.get('granularity', 'daily')
        product_id = request.query_params.get('product_id')

        # Validate granularity
        if granularity not in ['daily', 'hourly']:
            return Response(
                {'error': 'Invalid granularity. Must be "daily" or "hourly".'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate metric
        valid_metrics = ['views', 'cart_additions', 'purchases', 'abandonments', 'all']
        if metric not in valid_metrics:
            return Response(
                {'error': f'Invalid metric. Must be one of: {", ".join(valid_metrics)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate product_id if provided
        if product_id is not None:
            try:
                product_id = int(product_id)
                if product_id < 1:
                    return Response(
                        {'error': 'Invalid product_id. Must be a positive integer.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except (ValueError, TypeError):
                return Response(
                    {'error': 'Invalid product_id. Must be a valid integer.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Calculate date range
        cutoff_date = timezone.now() - timedelta(days=days)

        # Choose truncation function based on granularity
        trunc_func = TruncDate if granularity == 'daily' else TruncHour

        result = {}

        # Helper function to get time series data
        def get_time_series(queryset, date_field='created_at'):
            qs = queryset.filter(**{f'{date_field}__gte': cutoff_date})
            if product_id:
                qs = qs.filter(product_id=product_id)

            data = qs.annotate(
                period=trunc_func(date_field)
            ).values('period').annotate(
                count=Count('id')
            ).order_by('period')

            return [
                {
                    'date': item['period'].isoformat() if hasattr(item['period'], 'isoformat') else str(item['period']),
                    'count': item['count']
                }
                for item in data
            ]

        # Get data for requested metrics
        if metric in ['views', 'all']:
            result['views'] = get_time_series(ProductView.objects.all())

        if metric in ['cart_additions', 'all']:
            result['cart_additions'] = get_time_series(
                CartItem.objects.filter(is_deleted=False)
            )

        if metric in ['purchases', 'all']:
            result['purchases'] = get_time_series(
                OrderItem.objects.filter(is_deleted=False)
            )

        if metric in ['abandonments', 'all']:
            result['abandonments'] = get_time_series(CartAbandonment.objects.all())

        # Add metadata
        response_data = {
            'metric': metric,
            'period_days': days,
            'granularity': granularity,
            'data': result,
        }

        if product_id:
            response_data['product_id'] = product_id

        return Response(response_data)

    @action(detail=False, methods=['get'])
    def trends_comparison(self, request):
        """
        Compare current period trends with previous period.
        Query params:
        - days: Number of days for current period (default: 7, max: 90)

        Returns comparison of key metrics between current and previous period.
        """
        days = parse_int_param(request.query_params.get('days'), default=7, max_value=90)

        # Calculate date ranges
        now = timezone.now()
        current_period_start = now - timedelta(days=days)
        previous_period_start = current_period_start - timedelta(days=days)

        # Helper function to get counts for a period
        def get_period_counts(start_date, end_date):
            return {
                'views': ProductView.objects.filter(
                    created_at__gte=start_date,
                    created_at__lt=end_date
                ).count(),
                'cart_additions': CartItem.objects.filter(
                    created_at__gte=start_date,
                    created_at__lt=end_date,
                    is_deleted=False
                ).count(),
                'purchases': OrderItem.objects.filter(
                    created_at__gte=start_date,
                    created_at__lt=end_date,
                    is_deleted=False
                ).count(),
                'abandonments': CartAbandonment.objects.filter(
                    created_at__gte=start_date,
                    created_at__lt=end_date
                ).count(),
            }

        # Get counts for both periods
        current_counts = get_period_counts(current_period_start, now)
        previous_counts = get_period_counts(previous_period_start, current_period_start)

        # Calculate percentage changes
        def calculate_change(current, previous):
            if previous == 0:
                return 100.0 if current > 0 else 0.0
            return round(((current - previous) / previous) * 100, 2)

        comparison = {}
        for metric in current_counts.keys():
            comparison[metric] = {
                'current': current_counts[metric],
                'previous': previous_counts[metric],
                'change': current_counts[metric] - previous_counts[metric],
                'change_percentage': calculate_change(
                    current_counts[metric],
                    previous_counts[metric]
                ),
            }

        return Response({
            'period_days': days,
            'current_period': {
                'start': current_period_start.isoformat(),
                'end': now.isoformat(),
            },
            'previous_period': {
                'start': previous_period_start.isoformat(),
                'end': current_period_start.isoformat(),
            },
            'comparison': comparison,
        })
