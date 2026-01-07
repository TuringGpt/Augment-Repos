from collections import defaultdict
from datetime import timedelta
from decimal import Decimal

from django.db.models import Count, Sum
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import User
from accounts.permissions import hasAdminOrMerchantRole
from carts.models import CartItem
from checkout.models import Order, OrderItem, Payment
from products.models import Product, ProductCategory

from .models import CartAbandonment, ProductStatistics, ProductView
from .serializers import (
    ProductStatisticsSerializer,
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
    ViewSet for product and customer analytics with multiple endpoints:

    Product Analytics:
    - most_viewed: Products with highest view count within a time window
    - most_added_to_cart: Products most frequently added to cart
    - best_selling: Products with highest purchase count
    - frequently_abandoned: Products frequently abandoned in cart
    - general_statistics: Aggregated statistics across all products
    - analytics_overview: Comprehensive dashboard overview
    - product_performance: Detailed product performance metrics

    Customer Analytics:
    - customer_lifetime_value: Top customers by revenue and value tier
    """
    queryset = ProductStatistics.objects.all()
    serializer_class = ProductStatisticsSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'product_id'

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
    def analytics_overview(self, request):
        """
        Get comprehensive analytics overview for the dashboard.

        Query params:
        - days: Number of days to look back (default: 30, max: 365)

        Returns a dictionary with the following keys:
        - period_days: Number of days included in the analysis
        - overview: Overview metrics (total_revenue, total_orders, completed_orders,
                    average_order_value, total_products, total_categories, new_customers)
        - conversion_funnel: Conversion metrics (total_views, total_cart_additions,
                             total_purchases, view_to_cart_rate, cart_to_purchase_rate,
                             overall_conversion_rate)
        - cart_abandonment: Abandonment metrics (total_abandonments, abandonment_rate)
        - top_products_by_revenue: List of top 5 products by revenue (product_id,
                                    product_name, revenue, units_sold, price)
        - category_performance: List of top 5 categories by revenue (category_name,
                                revenue, units_sold, orders)
        """
        days = parse_int_param(request.query_params.get('days'), default=30, max_value=365)
        cutoff_date = timezone.now() - timedelta(days=days)

        # ===== OVERVIEW METRICS =====
        total_products = Product.objects.count()
        total_categories = ProductCategory.objects.count()
        total_users = User.objects.filter(date_joined__gte=cutoff_date).count()

        # Order metrics
        orders_in_period = Order.objects.filter(created_at__gte=cutoff_date)
        total_orders = orders_in_period.count()
        completed_orders = orders_in_period.filter(status=Order.OrderStatus.COMPLETED).count()

        # Revenue calculation (from completed orders using actual charged amounts)
        # Use Payment.amount as the source of truth for actual charged amounts
        completed_payments = Payment.objects.filter(
            order__created_at__gte=cutoff_date,
            order__status=Order.OrderStatus.COMPLETED,
            payment_status=Payment.PaymentStatus.PAID
        )

        total_revenue = sum(
            payment.amount for payment in completed_payments
        ) if completed_payments.exists() else Decimal('0.00')

        # Average order value (based on paid orders only)
        # Use count of paid orders to match the revenue calculation
        paid_orders_count = completed_payments.count()
        avg_order_value = (total_revenue / paid_orders_count) if paid_orders_count > 0 else Decimal('0.00')

        # ===== CONVERSION FUNNEL =====
        total_views = ProductView.objects.filter(created_at__gte=cutoff_date).count()
        total_cart_adds = CartItem.objects.filter(created_at__gte=cutoff_date).count()
        # Count actual purchases (order items) in the time period from paid orders
        # Use payment_status=PAID to match revenue calculation logic
        total_purchases = OrderItem.objects.filter(
            order__created_at__gte=cutoff_date,
            order__status=Order.OrderStatus.COMPLETED,
            order__payment__payment_status=Payment.PaymentStatus.PAID,
            product__isnull=False
        ).aggregate(total=Sum('quantity'))['total'] or 0

        # Conversion rates
        view_to_cart_rate = (total_cart_adds / total_views * 100) if total_views > 0 else 0
        cart_to_purchase_rate = (total_purchases / total_cart_adds * 100) if total_cart_adds > 0 else 0
        overall_conversion_rate = (total_purchases / total_views * 100) if total_views > 0 else 0

        # ===== CART ABANDONMENT =====
        total_abandonments = CartAbandonment.objects.filter(created_at__gte=cutoff_date).count()
        abandonment_rate = (total_abandonments / total_cart_adds * 100) if total_cart_adds > 0 else 0

        # ===== TOP PERFORMING PRODUCTS (by revenue) =====
        top_products_by_revenue = []
        product_revenue = {}

        # Calculate revenue per product using Payment.amount distributed across items
        for payment in completed_payments:
            order = payment.order
            order_items = order.items.select_related('product').all()

            if not order_items.exists():
                continue

            # Distribute payment amount proportionally across items based on their value
            # (unit price × quantity), not just quantity. This ensures products are credited
            # with revenue proportional to their actual value contribution.
            items_with_products = [item for item in order_items if item.product]
            total_value = sum(item.product.price * item.quantity for item in items_with_products)
            if total_value == 0:
                continue

            # Allocate payment amount proportionally by each item's value
            for item in items_with_products:
                product_id = str(item.product.id)
                item_value = item.product.price * item.quantity
                item_revenue = (item_value / total_value) * payment.amount

                if product_id in product_revenue:
                    product_revenue[product_id]['revenue'] += item_revenue
                    product_revenue[product_id]['units_sold'] += item.quantity
                else:
                    product_revenue[product_id] = {
                        'product_id': product_id,
                        'product_name': item.product.name,
                        'revenue': item_revenue,
                        'units_sold': item.quantity,
                        'price': item.product.price
                    }

        # Sort by revenue and get top 5
        sorted_products = sorted(
            product_revenue.values(),
            key=lambda x: x['revenue'],
            reverse=True
        )[:5]

        top_products_by_revenue = [
            {
                'product_id': p['product_id'],
                'product_name': p['product_name'],
                'revenue': float(p['revenue']),
                'units_sold': p['units_sold'],
                'price': float(p['price'])
            }
            for p in sorted_products
        ]

        # ===== CATEGORY PERFORMANCE =====
        category_stats = {}
        for payment in completed_payments:
            order = payment.order
            order_items = order.items.select_related('product', 'product__category').all()

            if not order_items.exists():
                continue

            # Distribute payment amount proportionally across items based on their value
            # (unit price × quantity), not just quantity. This ensures categories are credited
            # with revenue proportional to their actual value contribution.
            items_with_categories = [item for item in order_items if item.product and item.product.category]
            total_value = sum(item.product.price * item.quantity for item in items_with_categories)
            if total_value == 0:
                continue

            # Allocate payment amount proportionally by each item's value
            for item in items_with_categories:
                category_name = item.product.category.name
                item_value = item.product.price * item.quantity
                item_revenue = (item_value / total_value) * payment.amount

                if category_name in category_stats:
                    category_stats[category_name]['revenue'] += item_revenue
                    category_stats[category_name]['units_sold'] += item.quantity
                    category_stats[category_name]['order_ids'].add(item.order_id)
                else:
                    category_stats[category_name] = {
                        'category_name': category_name,
                        'revenue': item_revenue,
                        'units_sold': item.quantity,
                        'order_ids': {item.order_id}  # Track unique order IDs
                    }

        # Sort by revenue
        sorted_categories = sorted(
            category_stats.values(),
            key=lambda x: x['revenue'],
            reverse=True
        )[:5]

        category_performance = [
            {
                'category_name': c['category_name'],
                'revenue': float(c['revenue']),
                'units_sold': c['units_sold'],
                'orders': len(c['order_ids'])  # Count distinct orders
            }
            for c in sorted_categories
        ]

        # ===== RESPONSE =====
        return Response({
            'period_days': days,
            'overview': {
                'total_revenue': float(total_revenue),
                'total_orders': total_orders,
                'completed_orders': completed_orders,
                'average_order_value': float(avg_order_value),
                'total_products': total_products,
                'total_categories': total_categories,
                'new_customers': total_users,
            },
            'conversion_funnel': {
                'total_views': total_views,
                'total_cart_additions': total_cart_adds,
                'total_purchases': total_purchases,
                'view_to_cart_rate': round(view_to_cart_rate, 2),
                'cart_to_purchase_rate': round(cart_to_purchase_rate, 2),
                'overall_conversion_rate': round(overall_conversion_rate, 2),
            },
            'cart_abandonment': {
                'total_abandonments': total_abandonments,
                'abandonment_rate': round(abandonment_rate, 2),
            },
            'top_products_by_revenue': top_products_by_revenue,
            'category_performance': category_performance,
        })


    @action(detail=False, methods=['get'])
    def product_performance(self, request):
        """
        Get detailed product performance metrics for all products within a specified time period.

        All metrics are calculated based on data from the last N days (specified by the 'days' parameter).

        Query params:
        - limit: Maximum number of products to return for each metric (default: 10, max: 100)
        - days: Number of days to look back (default: 30, max: 365)

        Returns a dictionary with the following keys:
        - period_days: Number of days included in the analysis
        - low_performing_products: Top products with lowest purchase count within period (product_id,
                                   product_name, view_count, cart_add_count, purchase_count,
                                   view_to_purchase_ratio, cart_to_purchase_ratio)
        - high_abandonment_products: Top products with highest cart abandonment rate within period (product_id,
                                     product_name, cart_add_count, abandonment_count,
                                     abandonment_rate)
        - low_conversion_products: Top products with lowest conversion rate within period (product_id,
                                   product_name, view_count, purchase_count, conversion_rate)
        - high_engagement_products: Top products with highest view-to-purchase ratio within period (product_id,
                                    product_name, view_count, purchase_count, engagement_ratio)
        """
        limit = parse_int_param(request.query_params.get('limit'), default=10, max_value=100)
        days = parse_int_param(request.query_params.get('days'), default=30, max_value=365)
        cutoff_date = timezone.now() - timedelta(days=days)

        # ===== COMPUTE PERIOD-SPECIFIC DATA UPFRONT =====
        # Get all views within the time window
        views_by_product = {}
        for item in ProductView.objects.filter(
            created_at__gte=cutoff_date
        ).values('product_id').annotate(view_count=Count('id')):
            views_by_product[item['product_id']] = item['view_count']

        # Get all purchases within the time window (only from paid orders)
        # Use payment_status=PAID to match revenue calculation logic
        purchases_by_product = {}
        for item in OrderItem.objects.filter(
            created_at__gte=cutoff_date,
            order__status=Order.OrderStatus.COMPLETED,
            order__payment__payment_status=Payment.PaymentStatus.PAID
        ).values('product_id').annotate(purchase_count=Count('id')):
            purchases_by_product[item['product_id']] = item['purchase_count']

        # Get all abandonments within the time window
        abandonments_by_product = {}
        for item in CartAbandonment.objects.filter(
            created_at__gte=cutoff_date
        ).values('product_id').annotate(abandonment_count=Count('id')):
            abandonments_by_product[item['product_id']] = item['abandonment_count']

        # ===== LOW PERFORMING PRODUCTS (lowest purchase count within period) =====
        # Get cart additions within the time window
        # Note: We calculate cart additions in period as: purchases + abandonments
        cart_adds_by_product = {}
        for product_id in set(list(purchases_by_product.keys()) + list(abandonments_by_product.keys())):
            cart_adds_by_product[product_id] = purchases_by_product.get(product_id, 0) + abandonments_by_product.get(product_id, 0)

        # Build low performing products list including products with zero purchases
        # Include all products that have views or cart additions in the period
        products_with_activity = set(list(views_by_product.keys()) + list(cart_adds_by_product.keys()))

        low_performing_list = []
        for product_id in products_with_activity:
            purchase_count = purchases_by_product.get(product_id, 0)
            view_count = views_by_product.get(product_id, 0)
            cart_add_count = cart_adds_by_product.get(product_id, 0)

            # Only include products with some activity (views or cart additions)
            if view_count > 0 or cart_add_count > 0:
                low_performing_list.append({
                    'product_id': product_id,
                    'view_count': view_count,
                    'cart_add_count': cart_add_count,
                    'purchase_count': purchase_count,
                })

        # Sort by purchase count (ascending) to get lowest performing first
        low_performing_list.sort(key=lambda x: x['purchase_count'])

        # Build response data for top limit items
        low_performing_data = []
        for item in low_performing_list[:limit]:
            try:
                product = Product.objects.get(id=item['product_id'])
                view_count = item['view_count']
                cart_add_count = item['cart_add_count']
                purchase_count = item['purchase_count']

                view_to_purchase = (view_count / purchase_count) if purchase_count > 0 else 0
                cart_to_purchase = (cart_add_count / purchase_count) if purchase_count > 0 else 0

                low_performing_data.append({
                    'product_id': str(product.id),
                    'product_name': product.name,
                    'view_count': view_count,
                    'cart_add_count': cart_add_count,
                    'purchase_count': purchase_count,
                    'view_to_purchase_ratio': round(view_to_purchase, 2),
                    'cart_to_purchase_ratio': round(cart_to_purchase, 2),
                })
            except Product.DoesNotExist:
                continue

        # ===== HIGH ABANDONMENT PRODUCTS (within period) =====
        # Calculate abandonment rates and sort by rate (descending)
        products_with_abandonment = []
        for product_id, abandonment_count in abandonments_by_product.items():
            purchases_in_period = purchases_by_product.get(product_id, 0)
            period_cart_adds = purchases_in_period + abandonment_count
            abandonment_rate = (abandonment_count / period_cart_adds * 100) if period_cart_adds > 0 else 0
            products_with_abandonment.append((product_id, abandonment_count, period_cart_adds, abandonment_rate))

        # Sort by abandonment_rate (descending), then by abandonment_count (descending) as tiebreaker
        products_with_abandonment.sort(key=lambda x: (x[3], x[1]), reverse=True)

        high_abandonment_data = []
        for product_id, abandonment_count, period_cart_adds, abandonment_rate in products_with_abandonment[:limit]:
            try:
                product = Product.objects.get(id=product_id)
                high_abandonment_data.append({
                    'product_id': str(product.id),
                    'product_name': product.name,
                    'cart_add_count': period_cart_adds,
                    'abandonment_count': abandonment_count,
                    'abandonment_rate': round(abandonment_rate, 2),
                })
            except Product.DoesNotExist:
                continue

        # ===== LOW CONVERSION PRODUCTS (within period) =====
        # Calculate conversion rates for products with views
        products_with_conversion = []
        for product_id, view_count in views_by_product.items():
            purchase_count = purchases_by_product.get(product_id, 0)
            conversion_rate = (purchase_count / view_count * 100) if view_count > 0 else 0
            products_with_conversion.append({
                'product_id': product_id,
                'view_count': view_count,
                'purchase_count': purchase_count,
                'conversion_rate': conversion_rate,
            })

        # Sort by conversion rate (ascending) and take top limit
        products_with_conversion.sort(key=lambda x: x['conversion_rate'])
        low_conversion = products_with_conversion[:limit]

        low_conversion_data = []
        for item in low_conversion:
            try:
                product = Product.objects.get(id=item['product_id'])
                low_conversion_data.append({
                    'product_id': str(product.id),
                    'product_name': product.name,
                    'view_count': item['view_count'],
                    'purchase_count': item['purchase_count'],
                    'conversion_rate': round(item['conversion_rate'], 2),
                })
            except Product.DoesNotExist:
                continue

        # ===== HIGH ENGAGEMENT PRODUCTS (high view-to-purchase ratio within period) =====
        # Reuse views and purchases from previous sections
        products_with_engagement = []
        for product_id, view_count in views_by_product.items():
            purchase_count = purchases_by_product.get(product_id, 0)
            if purchase_count > 0:  # Only include products with purchases
                engagement_ratio = (view_count / purchase_count) if purchase_count > 0 else 0
                products_with_engagement.append({
                    'product_id': product_id,
                    'view_count': view_count,
                    'purchase_count': purchase_count,
                    'engagement_ratio': engagement_ratio,
                })

        # Sort by engagement ratio (descending) and take top limit
        products_with_engagement.sort(key=lambda x: x['engagement_ratio'], reverse=True)
        high_engagement = products_with_engagement[:limit]

        high_engagement_data = []
        for item in high_engagement:
            try:
                product = Product.objects.get(id=item['product_id'])
                high_engagement_data.append({
                    'product_id': str(product.id),
                    'product_name': product.name,
                    'view_count': item['view_count'],
                    'purchase_count': item['purchase_count'],
                    'engagement_ratio': round(item['engagement_ratio'], 2),
                })
            except Product.DoesNotExist:
                continue

        # ===== RESPONSE =====
        return Response({
            'period_days': days,
            'low_performing_products': low_performing_data,
            'high_abandonment_products': high_abandonment_data,
            'low_conversion_products': low_conversion_data,
            'high_engagement_products': high_engagement_data,
        })

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, hasAdminOrMerchantRole])
    def customer_lifetime_value(self, request):
        """
        Get top customers by lifetime value with detailed metrics.

        RESTRICTED: Admin and Merchant users only. This endpoint exposes sensitive customer data
        including email addresses and purchase history.

        Query params:
        - limit: Number of customers to return (default: 20, max: 100)
        - min_orders: Minimum number of orders to include customer (default: 1)
        - days: Number of days to look back (default: 365 for all-time analysis)

        Returns a dictionary with the following keys:
        - period_days: Number of days included in the analysis
        - total_customers: Total number of customers meeting the criteria
        - customers: List of top customers with metrics (customer_id, customer_name,
                     customer_email, total_revenue, total_orders, average_order_value,
                     first_purchase_date, last_purchase_date, days_since_last_purchase,
                     customer_tier)
        """
        limit = parse_int_param(request.query_params.get('limit'), default=20, max_value=100)
        days = parse_int_param(request.query_params.get('days'), default=365, max_value=3650)
        min_orders = parse_int_param(request.query_params.get('min_orders'), default=1, min_value=1)
        cutoff_date = timezone.now() - timedelta(days=days)

        # Get all completed payments in the period (source of truth for actual charged amounts)
        completed_payments = Payment.objects.filter(
            order__created_at__gte=cutoff_date,
            order__status=Order.OrderStatus.COMPLETED,
            payment_status=Payment.PaymentStatus.PAID
        ).select_related('order', 'order__created_by')

        # Calculate customer metrics
        customer_data = {}
        for payment in completed_payments:
            user_id = payment.order.created_by.id
            if user_id not in customer_data:
                customer_data[user_id] = {
                    'user': payment.order.created_by,
                    'total_revenue': Decimal('0.00'),
                    'order_count': 0,
                    'order_dates': []
                }

            # Use actual charged amount from payment
            customer_data[user_id]['total_revenue'] += payment.amount
            customer_data[user_id]['order_count'] += 1
            customer_data[user_id]['order_dates'].append(payment.order.created_at)

        # Filter by minimum orders and build response
        customers_list = []
        for user_id, data in customer_data.items():
            if data['order_count'] >= min_orders:
                order_dates = sorted(data['order_dates'])
                first_purchase = order_dates[0]
                last_purchase = order_dates[-1]
                days_since_last = (timezone.now() - last_purchase).days
                avg_order_value = data['total_revenue'] / data['order_count']

                # Determine customer tier
                if data['order_count'] >= 11:
                    tier = 'VIP'
                elif data['order_count'] >= 6:
                    tier = 'Loyal'
                elif data['order_count'] >= 2:
                    tier = 'Repeat'
                else:
                    tier = 'New'

                customers_list.append({
                    'customer_id': str(data['user'].id),
                    'customer_name': data['user'].full_name,
                    'customer_email': data['user'].email,
                    'total_revenue': Decimal(data['total_revenue']),
                    'total_orders': data['order_count'],
                    'average_order_value': Decimal(avg_order_value),
                    'first_purchase_date': first_purchase.date().isoformat(),
                    'last_purchase_date': last_purchase.date().isoformat(),
                    'days_since_last_purchase': days_since_last,
                    'customer_tier': tier
                })

        # Sort by total revenue (descending) and limit
        customers_list.sort(key=lambda x: x['total_revenue'], reverse=True)
        top_customers = customers_list[:limit]

        return Response({
            'period_days': days,
            'total_customers': len(customers_list),
            'customers': top_customers
        })



    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, hasAdminOrMerchantRole])
    def customer_segments(self, request):
        """
        Get customer segmentation by behavior patterns.

        RESTRICTED: Admin and Merchant users only. This endpoint exposes sensitive customer data
        including behavioral patterns and purchase history.

        Query params:
        - days: Number of days to look back for revenue calculations (default: 365)

        Returns a dictionary with the following keys:
        - period_days: Number of days included in the analysis
        - segments: Dictionary containing metrics for each segment:
          - new_customers: Customers with exactly 1 order (all-time)
          - repeat_customers: Customers with 2-5 orders (all-time)
          - loyal_customers: Customers with 6-10 orders (all-time)
          - vip_customers: Customers with 11+ orders (all-time)
          - at_risk_customers: Customers who haven't ordered in 90+ days
          - churned_customers: Customers who haven't ordered in 180+ days
        """
        days = parse_int_param(request.query_params.get('days'), default=365, max_value=3650)
        cutoff_date = timezone.now() - timedelta(days=days)
        now = timezone.now()

        # Get ALL completed payments (not filtered by date) to properly identify all customers
        # and their recency, including those at risk or churned
        # Use actual charged amounts from Payment as source of truth
        all_payments = Payment.objects.filter(
            order__status=Order.OrderStatus.COMPLETED,
            payment_status=Payment.PaymentStatus.PAID
        ).select_related('order', 'order__created_by')

        # Calculate customer metrics
        customer_data = {}
        for payment in all_payments:
            user_id = payment.order.created_by.id
            if user_id not in customer_data:
                customer_data[user_id] = {
                    'order_count': 0,
                    'total_revenue': Decimal('0.00'),
                    'period_revenue': Decimal('0.00'),  # Revenue within the time period
                    'period_order_count': 0,  # Order count within the time period
                    'last_order_date': None
                }

            # Use actual charged amount from payment
            customer_data[user_id]['total_revenue'] += payment.amount
            customer_data[user_id]['order_count'] += 1

            # Only count revenue and orders within the period for period-specific metrics
            if payment.order.created_at >= cutoff_date:
                customer_data[user_id]['period_revenue'] += payment.amount
                customer_data[user_id]['period_order_count'] += 1

            # Track most recent order
            if customer_data[user_id]['last_order_date'] is None or payment.order.created_at > customer_data[user_id]['last_order_date']:
                customer_data[user_id]['last_order_date'] = payment.order.created_at

        # Segment customers
        segments = {
            'new_customers': {'count': 0, 'period_revenue': Decimal('0.00'), 'period_order_count': 0},
            'repeat_customers': {'count': 0, 'period_revenue': Decimal('0.00'), 'period_order_count': 0},
            'loyal_customers': {'count': 0, 'period_revenue': Decimal('0.00'), 'period_order_count': 0},
            'vip_customers': {'count': 0, 'period_revenue': Decimal('0.00'), 'period_order_count': 0},
            'at_risk_customers': {'count': 0, 'days_since_purchase': []},
            'churned_customers': {'count': 0, 'days_since_purchase': []}
        }

        for user_id, data in customer_data.items():
            order_count = data['order_count']
            period_revenue = data['period_revenue']  # Revenue within the time period
            period_order_count = data['period_order_count']  # Order count within the time period
            days_since_last = (now - data['last_order_date']).days

            # Categorize by order count (all-time)
            if order_count == 1:
                segments['new_customers']['count'] += 1
                segments['new_customers']['period_revenue'] += period_revenue
                segments['new_customers']['period_order_count'] += period_order_count
            elif 2 <= order_count <= 5:
                segments['repeat_customers']['count'] += 1
                segments['repeat_customers']['period_revenue'] += period_revenue
                segments['repeat_customers']['period_order_count'] += period_order_count
            elif 6 <= order_count <= 10:
                segments['loyal_customers']['count'] += 1
                segments['loyal_customers']['period_revenue'] += period_revenue
                segments['loyal_customers']['period_order_count'] += period_order_count
            else:  # 11+
                segments['vip_customers']['count'] += 1
                segments['vip_customers']['period_revenue'] += period_revenue
                segments['vip_customers']['period_order_count'] += period_order_count

            # Check for at-risk and churned (based on recency, not period)
            if days_since_last >= 180:
                segments['churned_customers']['count'] += 1
                segments['churned_customers']['days_since_purchase'].append(days_since_last)
            elif days_since_last >= 90:
                segments['at_risk_customers']['count'] += 1
                segments['at_risk_customers']['days_since_purchase'].append(days_since_last)

        # Calculate percentages and averages
        total_customers = len(customer_data)

        response_segments = {}
        for segment_name, segment_data in segments.items():
            count = segment_data['count']
            percentage = (count / total_customers * 100) if total_customers > 0 else 0

            if segment_name in ['at_risk_customers', 'churned_customers']:
                avg_days = (sum(segment_data['days_since_purchase']) / count) if count > 0 else 0
                response_segments[segment_name] = {
                    'count': count,
                    'percentage': round(percentage, 2),
                    'last_purchase_avg_days': round(avg_days, 0)
                }
            else:
                period_rev = segment_data['period_revenue']
                period_orders = segment_data['period_order_count']
                # Calculate segment-level avg_order_value as period_revenue / period_order_count
                # This ensures numerator and denominator are from the same time window
                avg_order_val = (period_rev / period_orders) if period_orders > 0 else Decimal('0.00')
                response_segments[segment_name] = {
                    'count': count,
                    'percentage': round(percentage, 2),
                    'total_revenue': float(period_rev),
                    'avg_order_value': float(avg_order_val)
                }

        return Response({
            'period_days': days,
            'segments': response_segments
        })
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, hasAdminOrMerchantRole])
    def customer_retention(self, request):
        """
        Get customer retention metrics and cohort analysis.

        RESTRICTED: Admin and Merchant users only. This endpoint exposes sensitive customer data
        including behavioral patterns and purchase history.

        Query params:
        - days: Number of days to look back (default: 365)

        Returns a dictionary with the following keys:
        - period_days: Number of days included in the analysis
        - total_customers: Total customers who made at least one purchase
        - customers_with_multiple_orders: Count of customers with 2+ orders
        - repeat_purchase_rate: Percentage of customers who made repeat purchases
        - average_days_between_purchases: Average time between orders for repeat customers
        - cohort_analysis: Monthly cohort breakdown with retention rates
        """
        days = parse_int_param(request.query_params.get('days'), default=365, max_value=3650)
        cutoff_date = timezone.now() - timedelta(days=days)

        # Get all completed payments in the period (source of truth for actual paid orders)
        # Use payment_status=PAID to match other analytics endpoints
        completed_payments = Payment.objects.filter(
            order__created_at__gte=cutoff_date,
            order__status=Order.OrderStatus.COMPLETED,
            payment_status=Payment.PaymentStatus.PAID
        ).select_related('order', 'order__created_by').order_by('order__created_at')

        # Track customer order history
        customer_orders = defaultdict(list)
        for payment in completed_payments:
            customer_orders[payment.order.created_by.id].append(payment.order.created_at)

        # Calculate retention metrics
        total_customers = len(customer_orders)
        customers_with_multiple = sum(1 for orders in customer_orders.values() if len(orders) > 1)
        repeat_purchase_rate = (customers_with_multiple / total_customers * 100) if total_customers > 0 else 0

        # Calculate average days between purchases for repeat customers
        days_between_purchases = []
        for orders in customer_orders.values():
            if len(orders) > 1:
                sorted_orders = sorted(orders)
                for i in range(1, len(sorted_orders)):
                    days_diff = (sorted_orders[i] - sorted_orders[i-1]).days
                    days_between_purchases.append(days_diff)

        avg_days_between = (sum(days_between_purchases) / len(days_between_purchases)) if days_between_purchases else 0

        # Cohort analysis by month
        # Get all users who made their first purchase in the period
        user_first_purchase = {}
        for user_id, orders in customer_orders.items():
            first_purchase = min(orders)
            user_first_purchase[user_id] = first_purchase

        # Group by cohort month
        cohorts = defaultdict(lambda: {'total': 0, 'repeat': 0})
        for user_id, first_purchase in user_first_purchase.items():
            cohort_month = first_purchase.strftime('%Y-%m')
            cohorts[cohort_month]['total'] += 1
            if len(customer_orders[user_id]) > 1:
                cohorts[cohort_month]['repeat'] += 1

        # Build cohort analysis response
        cohort_analysis = []
        for cohort_month in sorted(cohorts.keys()):
            cohort_data = cohorts[cohort_month]
            retention_rate = (cohort_data['repeat'] / cohort_data['total'] * 100) if cohort_data['total'] > 0 else 0
            cohort_analysis.append({
                'cohort_month': cohort_month,
                'customers': cohort_data['total'],
                'repeat_customers': cohort_data['repeat'],
                'retention_rate': round(retention_rate, 2)
            })

        return Response({
            'period_days': days,
            'total_customers': total_customers,
            'customers_with_multiple_orders': customers_with_multiple,
            'repeat_purchase_rate': round(repeat_purchase_rate, 2),
            'average_days_between_purchases': round(avg_days_between, 0),
            'cohort_analysis': cohort_analysis
        })


    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, hasAdminOrMerchantRole])
    def customer_purchase_behavior(self, request):
        """
        Get detailed customer purchase behavior analysis.

        RESTRICTED: Admin and Merchant users only. This endpoint exposes sensitive customer data
        including email addresses, payment methods, and behavioral patterns.

        Query params:
        - days: Number of days to look back (default: 90)
        - limit: Number of results to return (default: 20, max: 100)

        Returns a dictionary with the following keys:
        - period_days: Number of days included in the analysis
        - most_active_customers: Top customers by order frequency
        - category_preferences: Popular categories with customer counts
        - payment_method_distribution: Payment method usage by customers
        """
        days = parse_int_param(request.query_params.get('days'), default=90, max_value=365)
        limit = parse_int_param(request.query_params.get('limit'), default=20, max_value=100)
        cutoff_date = timezone.now() - timedelta(days=days)

        # Get all completed payments in the period (source of truth for actual charged amounts)
        completed_payments = Payment.objects.filter(
            order__created_at__gte=cutoff_date,
            order__status=Order.OrderStatus.COMPLETED,
            payment_status=Payment.PaymentStatus.PAID
        ).select_related('order', 'order__created_by')

        # Track customer activity
        customer_activity = {}
        category_stats = defaultdict(lambda: {'customers': set(), 'order_ids': set(), 'revenue': Decimal('0.00')})
        # Track per-user payment method counts to find most-used method
        user_payment_methods = defaultdict(lambda: defaultdict(int))

        for payment in completed_payments:
            order = payment.order
            user_id = order.created_by.id

            # Initialize customer data
            if user_id not in customer_activity:
                customer_activity[user_id] = {
                    'user': order.created_by,
                    'order_count': 0,
                    'total_spent': Decimal('0.00'),
                    'categories': defaultdict(int)
                }

            customer_activity[user_id]['order_count'] += 1

            # Track payment method usage per user
            payment_method = payment.payment_method
            user_payment_methods[user_id][payment_method] += 1

            # Process order items and distribute payment amount proportionally
            order_items = order.items.select_related('product', 'product__category').all()
            if order_items.exists():
                # Only count items with products (items without products are skipped in allocation)
                items_with_products = [item for item in order_items if item.product]
                total_value = sum(item.product.price * item.quantity for item in items_with_products)
                if total_value > 0:
                    # Allocate payment amount proportionally by each item's value
                    # (unit price × quantity), not just quantity
                    for item in items_with_products:
                        item_value = item.product.price * item.quantity
                        item_revenue = (item_value / total_value) * payment.amount
                        customer_activity[user_id]['total_spent'] += item_revenue

                        # Track category preference
                        category_name = item.product.category.name
                        customer_activity[user_id]['categories'][category_name] += 1

                        # Track category stats
                        category_stats[category_name]['customers'].add(user_id)
                        category_stats[category_name]['order_ids'].add(order.id)  # Track distinct orders
                        category_stats[category_name]['revenue'] += item_revenue

        # Build most active customers list
        most_active = []
        for user_id, data in customer_activity.items():
            # Find favorite category
            favorite_category = max(data['categories'].items(), key=lambda x: x[1])[0] if data['categories'] else 'N/A'

            # Find preferred payment method (most-used method for this user)
            preferred_payment = 'N/A'
            if user_id in user_payment_methods and user_payment_methods[user_id]:
                # Get the payment method with the highest count
                preferred_payment = max(user_payment_methods[user_id].items(), key=lambda x: x[1])[0]

            most_active.append({
                'customer_id': str(data['user'].id),
                'customer_name': data['user'].full_name,
                'customer_email': data['user'].email,
                'order_count': data['order_count'],
                'total_spent': float(data['total_spent']),
                'favorite_category': favorite_category,
                'preferred_payment_method': preferred_payment
            })

        # Sort by order count and limit
        most_active.sort(key=lambda x: x['order_count'], reverse=True)
        most_active = most_active[:limit]

        # Build category preferences
        category_preferences = []
        for category_name, stats in category_stats.items():
            total_orders = len(stats['order_ids'])  # Count distinct orders
            avg_order_value = (stats['revenue'] / total_orders) if total_orders > 0 else Decimal('0.00')
            category_preferences.append({
                'category': category_name,
                'unique_customers': len(stats['customers']),
                'total_orders': total_orders,
                'avg_order_value': float(avg_order_value)
            })

        # Sort by unique customers
        category_preferences.sort(key=lambda x: x['unique_customers'], reverse=True)

        # Build payment method distribution
        # Assign each customer to their most-used payment method for a mutually-exclusive distribution
        customer_preferred_methods = {}
        for user_id, methods in user_payment_methods.items():
            if methods:
                # Get the method with the highest count for this customer
                preferred_method = max(methods.items(), key=lambda x: x[1])[0]
                customer_preferred_methods[user_id] = preferred_method

        # Count customers by their preferred (most-used) method
        payment_distribution = {}
        total_customers_with_payments = len(customer_preferred_methods)

        # Initialize distribution for all methods found
        for method in set(customer_preferred_methods.values()):
            payment_distribution[method] = {
                'customers': 0,
                'percentage': 0.0
            }

        # Count customers assigned to each method
        for preferred_method in customer_preferred_methods.values():
            payment_distribution[preferred_method]['customers'] += 1

        # Calculate percentages based on total customers with payments
        for method in payment_distribution:
            if total_customers_with_payments > 0:
                percentage = (payment_distribution[method]['customers'] / total_customers_with_payments * 100)
                payment_distribution[method]['percentage'] = round(percentage, 2)

        return Response({
            'period_days': days,
            'most_active_customers': most_active,
            'category_preferences': category_preferences,
            'payment_method_distribution': payment_distribution
        })

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, hasAdminOrMerchantRole])
    def churn_risk(self, request):
        """
        Identify customers at risk of churning based on inactivity.

        RESTRICTED: Admin and Merchant users only. This endpoint exposes sensitive customer data
        including email addresses, names, and purchase history.

        Query params:
        - limit: Number of at-risk customers to return (default: 50, max: 100)
        - inactive_days: Days since last purchase to consider 'at risk' (default: 60)

        Returns a dictionary with the following keys:
        - at_risk_customers: List of customers at risk with detailed metrics
        - summary: Overall summary of churn risk (total_at_risk, high_risk, medium_risk,
                   potential_revenue_at_risk)
        """
        limit = parse_int_param(request.query_params.get('limit'), default=50, max_value=100)
        inactive_days = parse_int_param(request.query_params.get('inactive_days'), default=60, max_value=365)

        now = timezone.now()

        # Get all completed payments (source of truth for actual charged amounts)
        completed_payments = Payment.objects.filter(
            order__status=Order.OrderStatus.COMPLETED,
            payment_status=Payment.PaymentStatus.PAID
        ).select_related('order', 'order__created_by')

        # Track customer order history
        customer_data = {}
        for payment in completed_payments:
            order = payment.order
            user_id = order.created_by.id
            if user_id not in customer_data:
                customer_data[user_id] = {
                    'user': order.created_by,
                    'order_dates': [],
                    'total_revenue': Decimal('0.00')
                }

            customer_data[user_id]['order_dates'].append(order.created_at)

            # Use actual charged amount from payment (source of truth)
            customer_data[user_id]['total_revenue'] += payment.amount

        # Identify at-risk customers
        at_risk_list = []
        high_risk_count = 0
        medium_risk_count = 0
        potential_revenue = Decimal('0.00')

        for user_id, data in customer_data.items():
            order_dates = sorted(data['order_dates'])
            last_purchase = order_dates[-1]
            days_since_last = (now - last_purchase).days

            # Only include customers who are inactive
            if days_since_last >= inactive_days:
                order_count = len(order_dates)

                # Calculate average days between orders (for customers with multiple orders)
                avg_days_between = 0
                if order_count > 1:
                    total_days = (order_dates[-1] - order_dates[0]).days
                    avg_days_between = total_days / (order_count - 1)

                # Determine risk level
                # High risk: inactive longer than 2x their average purchase cycle
                # Medium risk: inactive longer than their average purchase cycle
                if order_count > 1 and avg_days_between > 0:
                    if days_since_last > avg_days_between * 2:
                        risk_level = 'high'
                        high_risk_count += 1
                    else:
                        risk_level = 'medium'
                        medium_risk_count += 1
                else:
                    # Single purchase customers
                    if days_since_last > 120:
                        risk_level = 'high'
                        high_risk_count += 1
                    else:
                        risk_level = 'medium'
                        medium_risk_count += 1

                potential_revenue += data['total_revenue']

                at_risk_list.append({
                    'customer_id': str(data['user'].id),
                    'customer_name': data['user'].full_name,
                    'customer_email': data['user'].email,
                    'last_purchase_date': last_purchase.date().isoformat(),
                    'days_since_last_purchase': days_since_last,
                    'total_lifetime_orders': order_count,
                    'total_lifetime_revenue': float(data['total_revenue']),
                    'risk_level': risk_level,
                    'previous_avg_days_between_orders': round(avg_days_between, 0) if avg_days_between > 0 else 0
                })

        # Sort by risk level (high first) then by days since last purchase
        at_risk_list.sort(key=lambda x: (0 if x['risk_level'] == 'high' else 1, -x['days_since_last_purchase']))
        at_risk_list = at_risk_list[:limit]

        return Response({
            'at_risk_customers': at_risk_list,
            'summary': {
                'total_at_risk': len(at_risk_list),
                'high_risk': high_risk_count,
                'medium_risk': medium_risk_count,
                'potential_revenue_at_risk': float(potential_revenue)
            }
        })


    @action(detail=False, methods=['get'])
    def new_vs_returning(self, request):
        """
        Compare new vs returning customer metrics.

        Query params:
        - days: Number of days to look back (default: 30)

        Returns a dictionary with the following keys:
        - period_days: Number of days included in the analysis
        - new_customers: Metrics for customers making their first purchase
        - returning_customers: Metrics for customers with previous purchases
        """
        days = parse_int_param(request.query_params.get('days'), default=30, max_value=365)
        cutoff_date = timezone.now() - timedelta(days=days)

        # Get all completed payments in the period (source of truth for actual charged amounts)
        period_payments = Payment.objects.filter(
            order__created_at__gte=cutoff_date,
            order__status=Order.OrderStatus.COMPLETED,
            payment_status=Payment.PaymentStatus.PAID
        ).select_related('order', 'order__created_by')

        # Get all customers with paid orders before the period (to identify returning customers)
        # Use payment_status=PAID to match the period revenue calculation logic
        historical_customers = set(
            Payment.objects.filter(
                order__created_at__lt=cutoff_date,
                order__status=Order.OrderStatus.COMPLETED,
                payment_status=Payment.PaymentStatus.PAID
            ).values_list('order__created_by_id', flat=True).distinct()
        )

        # Categorize orders and calculate metrics
        new_customer_data = {
            'customer_ids': set(),
            'order_count': 0,
            'revenue': Decimal('0.00')
        }

        returning_customer_data = {
            'customer_ids': set(),
            'order_count': 0,
            'revenue': Decimal('0.00')
        }

        for payment in period_payments:
            order = payment.order
            user_id = order.created_by.id

            # Use actual charged amount from payment (source of truth)
            order_revenue = payment.amount

            # Check if this is a new or returning customer
            if user_id in historical_customers:
                # Returning customer
                returning_customer_data['customer_ids'].add(user_id)
                returning_customer_data['order_count'] += 1
                returning_customer_data['revenue'] += order_revenue
            else:
                # New customer (first purchase in or after the period)
                new_customer_data['customer_ids'].add(user_id)
                new_customer_data['order_count'] += 1
                new_customer_data['revenue'] += order_revenue

        # Calculate metrics
        new_count = len(new_customer_data['customer_ids'])
        new_orders = new_customer_data['order_count']
        new_revenue = new_customer_data['revenue']
        new_avg_order_value = (new_revenue / new_orders) if new_orders > 0 else Decimal('0.00')

        returning_count = len(returning_customer_data['customer_ids'])
        returning_orders = returning_customer_data['order_count']
        returning_revenue = returning_customer_data['revenue']
        returning_avg_order_value = (returning_revenue / returning_orders) if returning_orders > 0 else Decimal('0.00')

        total_revenue = new_revenue + returning_revenue
        new_revenue_percentage = (new_revenue / total_revenue * 100) if total_revenue > 0 else 0
        returning_revenue_percentage = (returning_revenue / total_revenue * 100) if total_revenue > 0 else 0

        return Response({
            'period_days': days,
            'new_customers': {
                'count': new_count,
                'orders': new_orders,
                'revenue': float(new_revenue),
                'percentage_of_revenue': round(new_revenue_percentage, 2),
                'avg_order_value': float(new_avg_order_value)
            },
            'returning_customers': {
                'count': returning_count,
                'orders': returning_orders,
                'revenue': float(returning_revenue),
                'percentage_of_revenue': round(returning_revenue_percentage, 2),
                'avg_order_value': float(returning_avg_order_value)
            }
        })
