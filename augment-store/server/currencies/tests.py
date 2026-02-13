from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import User
from .models import Currency
from .services import CurrencyCacheService

class CurrencyAPITests(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_superuser(
            email="admin@example.com",
            password="password123",
            role=User.Role.ADMIN
        )
        self.regular_user = User.objects.create_user(
            email="user@example.com",
            password="password123",
            role=User.Role.MEMBER
        )
        self.list_url = reverse('currencies:currency_list')
        self.create_url = reverse('currencies:create_currency')
        
        # Ensure cache is clean
        CurrencyCacheService().clear_namespace()

    def _get_results(self, response):
        """Helper to handle paginated vs non-paginated responses."""
        if isinstance(response.data, dict) and 'results' in response.data:
            return response.data['results']
        return response.data

    def test_list_currencies_public(self):
        Currency.objects.create(name="US Dollar", code="USD", symbol="$")
        response = self.client.get(self.list_url)
        results = self._get_results(response)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['code'], "USD")

    def test_create_currency_admin_only(self):
        data = {"name": "Euro", "code": "EUR", "symbol": "€"}
        
        # Regular user fails
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(self.create_url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Admin user succeeds
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(self.create_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Currency.objects.filter(code="EUR").count(), 1)

    def test_normalization_and_uniqueness(self):
        self.client.force_authenticate(user=self.admin_user)
        
        # Create initial
        response = self.client.post(self.create_url, {"name": "US Dollar", "code": "USD", "symbol": "$"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Same code with whitespace and lowercase should fail (400)
        response = self.client.post(self.create_url, {"name": "Dollar Two", "code": " usd ", "symbol": "$"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Blank code after normalization should fail
        response = self.client.post(self.create_url, {"name": "Bankrupt", "code": "   ", "symbol": "0"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_is_deleted_filtering(self):
        Currency.objects.create(name="Deleted", code="DEL", symbol="X", is_deleted=True)
        Currency.objects.create(name="Active", code="ACT", symbol="V", is_deleted=False)
        
        response = self.client.get(self.list_url)
        results = self._get_results(response)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['code'], "ACT")

    def test_cache_invalidation_on_create(self):
        self.client.force_authenticate(user=self.admin_user)
        
        # 1. Initially empty
        res1 = self.client.get(self.list_url)
        results1 = self._get_results(res1)
        self.assertEqual(len(results1), 0)
        
        # 2. Create new
        self.client.post(self.create_url, {"name": "New", "code": "NEW", "symbol": "N"})
        
        # 3. Check list again - cache should have been invalidated
        res2 = self.client.get(self.list_url)
        results2 = self._get_results(res2)
        self.assertEqual(len(results2), 1)
