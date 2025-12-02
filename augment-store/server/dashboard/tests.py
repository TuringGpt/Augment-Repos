from core.tests import BaseAPITestCase
from accounts.factory import UserFactory
from accounts.models import User
from rest_framework import status
from django.urls import reverse
from products.factory import ProductFactory
from carts.factory import CartItemFactory
from dashboard.models import ProductStatistics, ProductView, CartAbandonment
from datetime import timedelta, timezone

class ProductStatisticsModelTests(BaseAPITestCase):
    """Test ProductStatistics model creation and tracking."""

    def setUp(self):
        super().setUp()
        self.product = ProductFactory()

    def test_product_statistics_created_on_product_creation(self):
        """Test that ProductStatistics is created when a Product is created."""
        # GIVEN a new product is created
        new_product = ProductFactory()

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
        self.product = ProductFactory()
        self.user = UserFactory(
            email="viewer@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.MEMBER
        )

    def test_product_view_creation(self):
        """Test that ProductView records are created."""
        # GIVEN a product and user

        # WHEN a ProductView is created
        view = ProductView.objects.create(product=self.product, user=self.user)

        # THEN the view should be recorded
        self.assertTrue(ProductView.objects.filter(product=self.product, user=self.user).exists())
        self.assertEqual(view.product, self.product)
        self.assertEqual(view.user, self.user)


class CartAdditionTrackingTests(BaseAPITestCase):
    """Test cart addition tracking."""

    def setUp(self):
        super().setUp()
        self.product = ProductFactory()
        self.user = UserFactory(
            email="buyer@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.MEMBER
        )

    def test_cart_add_count_incremented(self):
        """Test that cart_add_count is incremented when item is added to cart."""
        # GIVEN a product with statistics
        stats = ProductStatistics.objects.get(product=self.product)
        initial_count = stats.cart_add_count

        # WHEN a CartItem is created for this product
        CartItemFactory(product=self.product, created_by=self.user)

        # THEN cart_add_count should be incremented
        stats.refresh_from_db()
        self.assertEqual(stats.cart_add_count, initial_count + 1)


class CartRemovalTrackingTests(BaseAPITestCase):
    """Test cart removal tracking."""

    def setUp(self):
        super().setUp()
        self.product = ProductFactory()
        self.user = UserFactory(
            email="buyer@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.MEMBER
        )

    def test_cart_remove_count_incremented(self):
        """Test that cart_remove_count is incremented when item is removed from cart."""
        # GIVEN a CartItem for a product
        cart_item = CartItemFactory(product=self.product, created_by=self.user)
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
        self.member_user = UserFactory(
            email="member@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.MEMBER
        )
        self.member_client = self.authenticated_client
        self.member_client.force_authenticate(user=self.member_user)

        # Create test products with different statistics
        self.product1 = ProductFactory(name="Product 1")
        self.product2 = ProductFactory(name="Product 2")
        self.product3 = ProductFactory(name="Product 3")

        # Set up statistics for products
        stats1 = ProductStatistics.objects.get(product=self.product1)
        stats1.view_count = 100
        stats1.cart_add_count = 50
        stats1.purchase_count = 30
        stats1.save()

        stats2 = ProductStatistics.objects.get(product=self.product2)
        stats2.view_count = 80
        stats2.cart_add_count = 40
        stats2.purchase_count = 20
        stats2.save()

        stats3 = ProductStatistics.objects.get(product=self.product3)
        stats3.view_count = 60
        stats3.cart_add_count = 30
        stats3.purchase_count = 10
        stats3.save()

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
        url = reverse("product-statistics-most-added-to-cart")
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
        url = reverse("product-statistics-best-selling")
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
        url = reverse("product-statistics-general-statistics")
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
        url = reverse("product-statistics-general-statistics")
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
        # Create views for product1 within the last 10 days
        for _ in range(5):
            ProductView.objects.create(product=self.product1, user=self.member_user)

        # Create views for product2 outside the 5-day window (40 days ago)
        old_view = ProductView.objects.create(product=self.product2, user=self.member_user)
        old_view.created_at = timezone.now() - timedelta(days=40)
        old_view.save()

        # WHEN we call most_viewed with days=5
        url = reverse("product-statistics-most-viewed")
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
        url = reverse("product-statistics-most-viewed")
        response = unauthenticated_client.get(url)

        # THEN we should get a 401 response
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_most_viewed_invalid_limit_parameter(self):
        """Test that most_viewed handles invalid limit parameter gracefully."""
        # GIVEN invalid limit parameters
        url = reverse("product-statistics-most-viewed")

        # WHEN we call with non-integer limit
        response = self.member_client.get(url, {'limit': 'invalid'})

        # THEN we should get a 200 response (not 500) with default limit
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_most_viewed_invalid_days_parameter(self):
        """Test that most_viewed handles invalid days parameter gracefully."""
        # GIVEN invalid days parameters
        url = reverse("product-statistics-most-viewed")

        # WHEN we call with non-integer days
        response = self.member_client.get(url, {'days': 'invalid'})

        # THEN we should get a 200 response (not 500) with default days
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_most_viewed_negative_limit_uses_default(self):
        """Test that negative limit values are rejected and default is used."""
        # GIVEN a negative limit
        url = reverse("product-statistics-most-viewed")

        # WHEN we call with negative limit
        response = self.member_client.get(url, {'limit': '-5'})

        # THEN we should get a 200 response with default limit (10)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_most_viewed_limit_capped_at_max(self):
        """Test that limit values above max are capped."""
        # Create enough products to test the cap
        for _ in range(150):
            ProductFactory()

        url = reverse("product-statistics-most-viewed")

        # WHEN we call with limit > 100
        response = self.member_client.get(url, {'limit': '500'})

        # THEN we should get a 200 response with max limit (100)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # The actual results might be less than 100 if we don't have enough products
        self.assertLessEqual(len(response.data.get('results', [])), 100)

    def test_most_viewed_days_capped_at_max(self):
        """Test that days values above max are capped."""
        url = reverse("product-statistics-most-viewed")

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
        for _ in range(95):
            old_view = ProductView.objects.create(product=self.product1, user=self.member_user)
            old_view.created_at = timezone.now() - timedelta(days=40)
            old_view.save()

        # Create recent views for product1 (within the 5-day window)
        for _ in range(5):
            ProductView.objects.create(product=self.product1, user=self.member_user)

        # Create recent views for product2 (within the 5-day window)
        for _ in range(10):
            ProductView.objects.create(product=self.product2, user=self.member_user)

        # WHEN we call most_viewed with days=5
        url = reverse("product-statistics-most-viewed")
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

        # Create abandonments for product1 (2 abandonments)
        for _ in range(2):
            CartAbandonment.objects.create(product=self.product1, user=self.member_user)

        # Create abandonments for product2 (5 abandonments)
        for _ in range(5):
            CartAbandonment.objects.create(product=self.product2, user=self.member_user)

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
