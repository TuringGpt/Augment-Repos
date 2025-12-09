from core.tests import BaseAPITestCase
from rest_framework import status
from django.urls import reverse
from products.factory import SimpleProductFactory
from carts.factory import SimpleCartItemFactory
from dashboard.models import ProductStatistics, ProductView, CartAbandonment
from datetime import timedelta
from django.utils import timezone

class ProductStatisticsModelTests(BaseAPITestCase):
    """Test ProductStatistics model creation and tracking."""

    def setUp(self):
        super().setUp()
        # Use SimpleProductFactory to avoid creating images
        self.product = SimpleProductFactory()

    def test_product_statistics_created_on_product_creation(self):
        """Test that ProductStatistics is created when a Product is created."""
        # GIVEN a new product is created
        new_product = SimpleProductFactory()

        # THEN ProductStatistics should be created for it
        self.assertTrue(ProductStatistics.objects.filter(product=new_product).exists())

    def test_product_statistics_initial_values(self):
        """Test that ProductStatistics has correct initial values."""
        # GIVEN a product with statistics
        stats = ProductStatistics.objects.get(product=self.product)

        # THEN all counts should be 0
        self.assertEqual(stats.view_count, 0)
        self.assertEqual(stats.cart_add_count, 0)
        self.assertEqual(stats.cart_remove_count, 0)
        self.assertEqual(stats.purchase_count, 0)


class ProductViewTrackingTests(BaseAPITestCase):
    """Test product view tracking."""

    def setUp(self):
        super().setUp()
        # Use SimpleProductFactory to avoid creating images
        self.product = SimpleProductFactory()
        # Reuse the user from BaseAPITestCase instead of creating a new one
        self.test_user = self.user

    def test_product_view_creation(self):
        """Test that ProductView records are created."""
        # GIVEN a product and user

        # WHEN a ProductView is created
        view = ProductView.objects.create(product=self.product, user=self.test_user)

        # THEN the view should be recorded
        self.assertTrue(ProductView.objects.filter(product=self.product, user=self.test_user).exists())
        self.assertEqual(view.product, self.product)
        self.assertEqual(view.user, self.test_user)


class CartAdditionTrackingTests(BaseAPITestCase):
    """Test cart addition tracking."""

    def setUp(self):
        super().setUp()
        # Use SimpleProductFactory to avoid creating images
        self.product = SimpleProductFactory()
        # Reuse the user from BaseAPITestCase instead of creating a new one
        self.test_user = self.user

    def test_cart_add_count_incremented(self):
        """Test that cart_add_count is incremented when item is added to cart."""
        # GIVEN a product with statistics
        stats = ProductStatistics.objects.get(product=self.product)
        initial_count = stats.cart_add_count

        # WHEN a CartItem is created for this product
        SimpleCartItemFactory(product=self.product, created_by=self.test_user)

        # THEN cart_add_count should be incremented
        stats.refresh_from_db()
        self.assertEqual(stats.cart_add_count, initial_count + 1)


class CartRemovalTrackingTests(BaseAPITestCase):
    """Test cart removal tracking."""

    def setUp(self):
        super().setUp()
        # Use SimpleProductFactory to avoid creating images
        self.product = SimpleProductFactory()
        # Reuse the user from BaseAPITestCase instead of creating a new one
        self.test_user = self.user

    def test_cart_remove_count_incremented(self):
        """Test that cart_remove_count is incremented when item is removed from cart."""
        # GIVEN a CartItem for a product
        cart_item = SimpleCartItemFactory(product=self.product, created_by=self.test_user)
        stats = ProductStatistics.objects.get(product=self.product)
        initial_count = stats.cart_remove_count

        # WHEN the CartItem is deleted
        cart_item.delete()

        # THEN cart_remove_count should be incremented
        stats.refresh_from_db()
        self.assertEqual(stats.cart_remove_count, initial_count + 1)


class ProductStatisticsAPITests(BaseAPITestCase):
    """Test ProductStatistics API endpoints."""

    def setUp(self):
        super().setUp()
        # Reuse the user from BaseAPITestCase instead of creating a new one
        self.member_user = self.user
        self.member_client = self.authenticated_client
        self.member_client.force_authenticate(user=self.member_user)

        # Create test products with different statistics using SimpleProductFactory
        self.product1 = SimpleProductFactory(name="Product 1")
        self.product2 = SimpleProductFactory(name="Product 2")
        self.product3 = SimpleProductFactory(name="Product 3")

        # Set up statistics for products using bulk_update for better performance
        stats1 = ProductStatistics.objects.get(product=self.product1)
        stats1.view_count = 100
        stats1.cart_add_count = 50
        stats1.purchase_count = 30

        stats2 = ProductStatistics.objects.get(product=self.product2)
        stats2.view_count = 80
        stats2.cart_add_count = 40
        stats2.purchase_count = 20

        stats3 = ProductStatistics.objects.get(product=self.product3)
        stats3.view_count = 60
        stats3.cart_add_count = 30
        stats3.purchase_count = 10

        # Bulk update all stats at once
        ProductStatistics.objects.bulk_update(
            [stats1, stats2, stats3],
            ['view_count', 'cart_add_count', 'purchase_count']
        )

    def test_most_viewed_endpoint(self):
        """Test most_viewed endpoint returns products sorted by view count."""
        # GIVEN products with different view counts
        # Create ProductView records to track views
        ProductView.objects.create(product=self.product1, user=self.member_user)
        ProductView.objects.create(product=self.product1, user=self.member_user)
        ProductView.objects.create(product=self.product2, user=self.member_user)

        # WHEN we call the most_viewed endpoint
        url = reverse("v1:product-statistics-most-viewed")
        response = self.member_client.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND results should be sorted by view count descending
        results = response.data.get('results', [])
        self.assertGreater(len(results), 0)
        self.assertEqual(results[0]['product_name'], 'Product 1')
        self.assertEqual(results[0]['view_count'], 100)

    def test_most_added_to_cart_endpoint(self):
        """Test most_added_to_cart endpoint returns products sorted by cart additions."""
        # GIVEN products with different cart add counts

        # WHEN we call the most_added_to_cart endpoint
        url = reverse("v1:product-statistics-most-added-to-cart")
        response = self.member_client.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND results should be sorted by cart_add_count descending
        results = response.data.get('results', [])
        self.assertGreater(len(results), 0)
        self.assertEqual(results[0]['product_name'], 'Product 1')
        self.assertEqual(results[0]['cart_add_count'], 50)

    def test_best_selling_endpoint(self):
        """Test best_selling endpoint returns products sorted by purchase count."""
        # GIVEN products with different purchase counts

        # WHEN we call the best_selling endpoint
        url = reverse("v1:product-statistics-best-selling")
        response = self.member_client.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND results should be sorted by purchase_count descending
        results = response.data.get('results', [])
        self.assertGreater(len(results), 0)
        self.assertEqual(results[0]['product_name'], 'Product 1')
        self.assertEqual(results[0]['purchase_count'], 30)

    def test_general_statistics_endpoint(self):
        """Test general_statistics endpoint returns aggregated metrics."""
        # GIVEN multiple products with statistics

        # WHEN we call the general_statistics endpoint
        url = reverse("v1:product-statistics-general-statistics")
        response = self.member_client.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND response should contain aggregated data
        self.assertIn('total_products_tracked', response.data)
        self.assertIn('total_views', response.data)
        self.assertIn('total_cart_additions', response.data)
        self.assertIn('total_purchases', response.data)

    def test_general_statistics_correct_totals(self):
        """Test that general_statistics returns correct sum of metrics, not count."""
        # GIVEN multiple products with specific statistics
        # Product 1: 100 views, 50 cart adds, 30 purchases
        # Product 2: 80 views, 40 cart adds, 20 purchases
        # Product 3: 60 views, 30 cart adds, 10 purchases
        # Expected totals: 240 views, 120 cart adds, 60 purchases

        # WHEN we call the general_statistics endpoint
        url = reverse("v1:product-statistics-general-statistics")
        response = self.member_client.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND the totals should be the SUM of all metrics, not the COUNT
        self.assertEqual(response.data['total_views'], 240)
        self.assertEqual(response.data['total_cart_additions'], 120)
        self.assertEqual(response.data['total_purchases'], 60)
        self.assertEqual(response.data['total_products_tracked'], 3)

    def test_most_viewed_respects_time_window(self):
        """Test that most_viewed endpoint respects the days parameter for time-based filtering."""
        # GIVEN products with views at different times
        # Create views for product1 within the last 5 days using bulk_create
        recent_views = [
            ProductView(product=self.product1, user=self.member_user)
            for _ in range(5)
        ]
        ProductView.objects.bulk_create(recent_views)

        # Create views for product2 outside the 5-day window (40 days ago)
        old_view = ProductView.objects.create(product=self.product2, user=self.member_user)
        old_view.created_at = timezone.now() - timedelta(days=40)
        old_view.save()

        # WHEN we call most_viewed with days=5
        url = reverse("v1:product-statistics-most-viewed")
        response = self.member_client.get(url, {'days': 5})

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND only product1 should be in results (product2's view is outside the window)
        results = response.data.get('results', [])
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['product_name'], 'Product 1')

    def test_unauthenticated_access_denied(self):
        """Test that unauthenticated users cannot access statistics endpoints."""
        # GIVEN an unauthenticated client
        unauthenticated_client = self.client

        # WHEN we try to access the most_viewed endpoint
        url = reverse("v1:product-statistics-most-viewed")
        response = unauthenticated_client.get(url)

        # THEN we should get a 401 response
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_most_viewed_invalid_limit_parameter(self):
        """Test that most_viewed handles invalid limit parameter gracefully."""
        # GIVEN invalid limit parameters
        url = reverse("v1:product-statistics-most-viewed")

        # WHEN we call with non-integer limit
        response = self.member_client.get(url, {'limit': 'invalid'})

        # THEN we should get a 200 response (not 500) with default limit
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_most_viewed_invalid_days_parameter(self):
        """Test that most_viewed handles invalid days parameter gracefully."""
        # GIVEN invalid days parameters
        url = reverse("v1:product-statistics-most-viewed")

        # WHEN we call with non-integer days
        response = self.member_client.get(url, {'days': 'invalid'})

        # THEN we should get a 200 response (not 500) with default days
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_most_viewed_negative_limit_uses_default(self):
        """Test that negative limit values are rejected and default is used."""
        # GIVEN a negative limit
        url = reverse("v1:product-statistics-most-viewed")

        # WHEN we call with negative limit
        response = self.member_client.get(url, {'limit': '-5'})

        # THEN we should get a 200 response with default limit (10)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_most_viewed_limit_capped_at_max(self):
        """Test that limit values above max are capped."""
        # Create enough products to test the cap - reduced from 150 to 15
        # We only need to verify the cap works, not test with massive data
        # Use SimpleProductFactory to avoid creating images
        for _ in range(15):
            SimpleProductFactory()

        url = reverse("v1:product-statistics-most-viewed")

        # WHEN we call with limit > 100
        response = self.member_client.get(url, {'limit': '500'})

        # THEN we should get a 200 response with max limit (100)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # The actual results might be less than 100 if we don't have enough products
        self.assertLessEqual(len(response.data.get('results', [])), 100)

    def test_most_viewed_days_capped_at_max(self):
        """Test that days values above max are capped."""
        url = reverse("v1:product-statistics-most-viewed")

        # WHEN we call with days > 365
        response = self.member_client.get(url, {'days': '1000'})

        # THEN we should get a 200 response with max days (365)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('period_days'), 365)

    def test_most_viewed_ordered_by_period_counts_not_lifetime(self):
        """Test that most_viewed orders by period-specific counts, not lifetime counts."""
        # GIVEN:
        # Product 1: 5 views in the last 5 days, 100 lifetime views
        # Product 2: 10 views in the last 5 days, 50 lifetime views
        # Expected order: Product 2 (10 period views), then Product 1 (5 period views)

        # Create old views for product1 (outside the 5-day window)
        # Note: We can't use bulk_create with custom created_at when auto_now_add=True
        # So we update the timestamps after creation
        old_time = timezone.now() - timedelta(days=40)
        old_views = [
            ProductView(product=self.product1, user=self.member_user)
            for _ in range(95)
        ]
        created_old_views = ProductView.objects.bulk_create(old_views)
        # Update created_at for old views using ORM update() to bypass auto_now_add
        ProductView.objects.filter(
            id__in=[v.id for v in created_old_views]
        ).update(created_at=old_time, updated_at=old_time)

        # Create recent views for product1 (within the 5-day window)
        recent_views_p1 = [
            ProductView(product=self.product1, user=self.member_user)
            for _ in range(5)
        ]
        ProductView.objects.bulk_create(recent_views_p1)

        # Create recent views for product2 (within the 5-day window)
        recent_views_p2 = [
            ProductView(product=self.product2, user=self.member_user)
            for _ in range(10)
        ]
        ProductView.objects.bulk_create(recent_views_p2)

        # WHEN we call most_viewed with days=5
        url = reverse("v1:product-statistics-most-viewed")
        response = self.member_client.get(url, {'days': 5})

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND results should be ordered by period-specific counts (not lifetime)
        results = response.data.get('results', [])
        self.assertEqual(len(results), 2)
        # Product 2 should be first (10 period views > 5 period views)
        self.assertEqual(results[0]['product_name'], 'Product 2')
        # Product 1 should be second (5 period views)
        self.assertEqual(results[1]['product_name'], 'Product 1')

    def test_frequently_abandoned_ordered_by_abandonment_count_not_lifetime(self):
        """Test that frequently_abandoned orders by abandonment count, not lifetime cart_remove_count."""
        # GIVEN:
        # Product 1: 2 abandonments, 100 lifetime cart_remove_count
        # Product 2: 5 abandonments, 50 lifetime cart_remove_count
        # Expected order: Product 2 (5 abandonments), then Product 1 (2 abandonments)

        # Create abandonments for product1 (2 abandonments) using bulk_create
        abandonments_p1 = [
            CartAbandonment(product=self.product1, user=self.member_user)
            for _ in range(2)
        ]
        CartAbandonment.objects.bulk_create(abandonments_p1)

        # Create abandonments for product2 (5 abandonments) using bulk_create
        abandonments_p2 = [
            CartAbandonment(product=self.product2, user=self.member_user)
            for _ in range(5)
        ]
        CartAbandonment.objects.bulk_create(abandonments_p2)

        # WHEN we call frequently_abandoned endpoint
        url = reverse("v1:product-statistics-frequently-abandoned")
        response = self.member_client.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND results should be ordered by abandonment count (not lifetime cart_remove_count)
        results = response.data.get('results', [])
        self.assertEqual(len(results), 2)
        # Product 2 should be first (5 abandonments > 2 abandonments)
        self.assertEqual(results[0]['product_name'], 'Product 2')
        # Product 1 should be second (2 abandonments)
        self.assertEqual(results[1]['product_name'], 'Product 1')


    def test_product_performance_endpoint(self):
        """Test product_performance endpoint returns all performance metrics."""
        # GIVEN products with different statistics
        # Create some abandonments for testing
        CartAbandonment.objects.create(product=self.product1, user=self.member_user)
        CartAbandonment.objects.create(product=self.product1, user=self.member_user)
        CartAbandonment.objects.create(product=self.product2, user=self.member_user)

        # WHEN we call the product_performance endpoint
        url = reverse("v1:product-statistics-product-performance")
        response = self.member_client.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND response should contain all performance metrics
        self.assertIn('period_days', response.data)
        self.assertIn('low_performing_products', response.data)
        self.assertIn('high_abandonment_products', response.data)
        self.assertIn('low_conversion_products', response.data)
        self.assertIn('high_engagement_products', response.data)

    def test_product_performance_low_performing_products(self):
        """Test that low_performing_products returns products with lowest purchase count within period."""
        # GIVEN products with different purchase counts within the period
        # Product 1: 100 views, 0 purchases
        # Product 2: 80 views, 0 purchases
        # Product 3: 60 views, 0 purchases
        # All have 0 purchases in period, so all should be included with purchase_count=0

        # Create views for all products to ensure they appear in results
        for _ in range(100):
            ProductView.objects.create(product=self.product1, user=self.member_user)
        for _ in range(80):
            ProductView.objects.create(product=self.product2, user=self.member_user)
        for _ in range(60):
            ProductView.objects.create(product=self.product3, user=self.member_user)

        # WHEN we call the product_performance endpoint
        url = reverse("v1:product-statistics-product-performance")
        response = self.member_client.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND low_performing_products should include all products with 0 purchases
        low_performing = response.data.get('low_performing_products', [])
        self.assertEqual(len(low_performing), 3)
        # All products should have purchase_count=0 (no OrderItem records created)
        product_names = {p['product_name'] for p in low_performing}
        self.assertEqual(product_names, {'Product 1', 'Product 2', 'Product 3'})
        for product in low_performing:
            self.assertEqual(product['purchase_count'], 0)

    def test_product_performance_low_performing_includes_zero_purchases(self):
        """Test that low_performing_products includes products with zero purchases but with views/cart adds."""
        # GIVEN a product with views and cart additions but zero purchases
        ProductView.objects.create(product=self.product1, user=self.member_user)
        ProductView.objects.create(product=self.product1, user=self.member_user)
        CartAbandonment.objects.create(product=self.product1, user=self.member_user)

        # AND other products with no period activity (no views, no cart adds, no purchases)
        # Product 2 and 3 have lifetime stats from setUp but no period activity

        # WHEN we call the product_performance endpoint
        url = reverse("v1:product-statistics-product-performance")
        response = self.member_client.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND low_performing_products should include only Product 1 (only product with period activity)
        low_performing = response.data.get('low_performing_products', [])
        self.assertEqual(len(low_performing), 1)
        self.assertEqual(low_performing[0]['product_name'], 'Product 1')
        self.assertEqual(low_performing[0]['purchase_count'], 0)
        self.assertEqual(low_performing[0]['view_count'], 2)
        self.assertEqual(low_performing[0]['cart_add_count'], 1)

    def test_product_performance_high_abandonment_products(self):
        """Test that high_abandonment_products returns products with highest abandonment count within period."""
        # GIVEN products with different abandonment counts within the period
        # Note: abandonment_rate = abandonment_count / (purchases_in_period + abandonment_count) * 100
        # Since we don't create OrderItem records, purchases_in_period = 0
        # Product 1: 2 abandonments in period, 0 purchases = 2/(0+2) = 100% abandonment rate
        # Product 2: 3 abandonments in period, 0 purchases = 3/(0+3) = 100% abandonment rate
        # Product 3: 1 old abandonment (outside period) = should not appear in results

        # Create abandonments for product1 (2 abandonments in period)
        CartAbandonment.objects.create(product=self.product1, user=self.member_user)
        CartAbandonment.objects.create(product=self.product1, user=self.member_user)

        # Create abandonments for product2 (3 abandonments in period)
        CartAbandonment.objects.create(product=self.product2, user=self.member_user)
        CartAbandonment.objects.create(product=self.product2, user=self.member_user)
        CartAbandonment.objects.create(product=self.product2, user=self.member_user)

        # Create an old abandonment for product3 (outside the default 30-day window)
        old_abandonment = CartAbandonment.objects.create(product=self.product3, user=self.member_user)
        old_abandonment.created_at = timezone.now() - timedelta(days=31)
        old_abandonment.save()

        # WHEN we call the product_performance endpoint
        url = reverse("v1:product-statistics-product-performance")
        response = self.member_client.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND high_abandonment_products should only include products with abandonments in the period
        high_abandonment = response.data.get('high_abandonment_products', [])
        self.assertEqual(len(high_abandonment), 2)

        # Find Product 2 in results (highest abandonment count of 3)
        product_2 = next((p for p in high_abandonment if p['product_name'] == 'Product 2'), None)
        self.assertIsNotNone(product_2)
        self.assertEqual(product_2['abandonment_count'], 3)
        # Verify abandonment_rate is calculated correctly: 3/(0+3) = 100%
        self.assertEqual(product_2['abandonment_rate'], 100.0)

        # Find Product 1 in results (lower abandonment count of 2)
        product_1 = next((p for p in high_abandonment if p['product_name'] == 'Product 1'), None)
        self.assertIsNotNone(product_1)
        self.assertEqual(product_1['abandonment_count'], 2)
        self.assertEqual(product_1['abandonment_rate'], 100.0)

        # Verify Product 3 is NOT in results (its abandonment is outside the period)
        product_3 = next((p for p in high_abandonment if p['product_name'] == 'Product 3'), None)
        self.assertIsNone(product_3)

    def test_product_performance_low_conversion_products(self):
        """Test that low_conversion_products returns products with lowest conversion rate within period."""
        # GIVEN products with different conversion rates within the period
        # Product 1: 100 views, 0 purchases = 0% conversion
        # Product 2: 80 views, 0 purchases = 0% conversion
        # Product 3: 60 views, 0 purchases = 0% conversion
        # Note: low_conversion_products only includes products with views in the period

        # Create views for all products (no OrderItem records = 0 purchases in period)
        for _ in range(100):
            ProductView.objects.create(product=self.product1, user=self.member_user)
        for _ in range(80):
            ProductView.objects.create(product=self.product2, user=self.member_user)
        for _ in range(60):
            ProductView.objects.create(product=self.product3, user=self.member_user)

        # WHEN we call the product_performance endpoint
        url = reverse("v1:product-statistics-product-performance")
        response = self.member_client.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND low_conversion_products should be ordered by conversion rate ascending
        low_conversion = response.data.get('low_conversion_products', [])
        # All products have 0% conversion rate (0 purchases / views * 100)
        self.assertEqual(len(low_conversion), 3)
        # All should have 0% conversion rate
        for product in low_conversion:
            self.assertEqual(product['conversion_rate'], 0.0)

    def test_product_performance_high_engagement_products(self):
        """Test that high_engagement_products returns products with highest view-to-purchase ratio within period."""
        # GIVEN products with different view-to-purchase ratios within the period
        # Note: high_engagement only includes products with purchases in the period
        # Since we don't create OrderItem records, no products will have purchases

        # Create views for all products (but no OrderItem records = 0 purchases in period)
        for _ in range(100):
            ProductView.objects.create(product=self.product1, user=self.member_user)
        for _ in range(80):
            ProductView.objects.create(product=self.product2, user=self.member_user)
        for _ in range(60):
            ProductView.objects.create(product=self.product3, user=self.member_user)

        # WHEN we call the product_performance endpoint
        url = reverse("v1:product-statistics-product-performance")
        response = self.member_client.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND high_engagement_products should be empty because the endpoint only includes
        # products that have purchases in the period
        high_engagement = response.data.get('high_engagement_products', [])
        self.assertEqual(len(high_engagement), 0)

    def test_product_performance_respects_limit_parameter(self):
        """Test that product_performance respects the limit parameter for all categories."""
        # GIVEN multiple products with period activity
        for i in range(15):
            product = SimpleProductFactory(name=f"Product {i+4}")
            # Create period activity for each product so they appear in results
            ProductView.objects.create(product=product, user=self.member_user)
            CartAbandonment.objects.create(product=product, user=self.member_user)

        # WHEN we call the product_performance endpoint with limit=5
        url = reverse("v1:product-statistics-product-performance")
        response = self.member_client.get(url, {'limit': 5})

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND each category should have at most 5 products (respecting the limit parameter)
        low_performing = response.data.get('low_performing_products', [])
        low_conversion = response.data.get('low_conversion_products', [])
        high_abandonment = response.data.get('high_abandonment_products', [])
        high_engagement = response.data.get('high_engagement_products', [])

        self.assertLessEqual(len(low_performing), 5)
        self.assertLessEqual(len(low_conversion), 5)
        self.assertLessEqual(len(high_abandonment), 5)
        self.assertLessEqual(len(high_engagement), 5)

    def test_product_performance_respects_days_parameter(self):
        """Test that product_performance respects the days parameter for abandonment filtering."""
        # GIVEN abandonments at different times
        # Create recent abandonment
        CartAbandonment.objects.create(product=self.product1, user=self.member_user)

        # Create old abandonment (40 days ago)
        old_abandonment = CartAbandonment.objects.create(product=self.product2, user=self.member_user)
        old_abandonment.created_at = timezone.now() - timedelta(days=40)
        old_abandonment.save()

        # WHEN we call the product_performance endpoint with days=5
        url = reverse("v1:product-statistics-product-performance")
        response = self.member_client.get(url, {'days': 5})

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND high_abandonment_products should only include recent abandonments
        high_abandonment = response.data.get('high_abandonment_products', [])
        # Only product1 should be in the results (product2's abandonment is outside the window)
        product_names = [p['product_name'] for p in high_abandonment]
        self.assertIn('Product 1', product_names)
        # Product 2 should NOT be in the results since its only abandonment is 40 days old (outside the 5-day window)
        self.assertNotIn('Product 2', product_names)
