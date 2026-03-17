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
        # Fix: Using correct namespaced URL names (v1:currencies:...)
        self.list_url = reverse('v1:currencies:currency_list')
        self.create_url = reverse('v1:currencies:create_currency')
        
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
        
        # 1. Test code normalization (upper)
        response = self.client.post(self.create_url, {"name": "US Dollar", "code": "usd", "symbol": "$"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['code'], "USD")
        
        # 2. Test name normalization (lower)
        response = self.client.post(self.create_url, {"name": "British Pound ", "code": "GBP", "symbol": "£"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], "british pound")
        
        # 3. Same code (case variant) should fail
        response = self.client.post(self.create_url, {"name": "USD Variant", "code": " USD ", "symbol": "$"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # 4. Same name (case variant) should fail
        response = self.client.post(self.create_url, {"name": " BRITISH POUND ", "code": "BP2", "symbol": "£"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_is_deleted_filtering(self):
        Currency.objects.create(name="deleted", code="DEL", symbol="X", is_deleted=True)
        Currency.objects.create(name="active", code="ACT", symbol="V", is_deleted=False)
        
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

    def test_admin_mutation_invalidates_cache(self):
        c = Currency.objects.create(name="old name", code="OLD", symbol="O")
        
        # Cache the list
        self.client.get(self.list_url)
        
        # Mock admin update
        c.name = "NEW NAME"
        c.save() 
        
        from .admin import CurrencyAdmin
        from django.contrib.admin.sites import AdminSite
        site = AdminSite()
        admin = CurrencyAdmin(Currency, site)
        
        # Simulate admin save
        admin.save_model(None, c, None, True)
        
        response = self.client.get(self.list_url)
        results = self._get_results(response)
        # Verify both name change and invalidation worked (note normalization to lower)
        self.assertEqual(results[0]['name'], "new name")

    def test_update_delete_currency_admin_only(self):
        c = Currency.objects.create(name="peso", code="MXN", symbol="$")
        update_url = reverse('v1:currencies:admin_currency_update_delete', kwargs={"pk": c.pk})
        
        # Prime the list cache
        self.client.force_authenticate(user=self.admin_user)
        list_res_before = self.client.get(self.list_url)
        self.assertEqual(len(self._get_results(list_res_before)), 1)
        self.assertEqual(self._get_results(list_res_before)[0]['name'], "peso")

        # Regular user fails
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.patch(update_url, {"name": "Mexican Peso"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Admin user succeeds update
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.patch(update_url, {"name": "Mexican Peso"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check DB
        c.refresh_from_db()
        self.assertEqual(c.name, "mexican peso") # Normalized

        # Verify list cache was invalidated for update
        list_res_after_update = self.client.get(self.list_url)
        self.assertEqual(self._get_results(list_res_after_update)[0]['name'], "mexican peso")

        # Admin delete
        response = self.client.delete(update_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Currency.objects.filter(pk=c.pk).exists(), False)
        
        # Verify list cache was invalidated for delete
        list_res_after_delete = self.client.get(self.list_url)
        self.assertEqual(len(self._get_results(list_res_after_delete)), 0)
