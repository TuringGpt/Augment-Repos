from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import User
from .models import Currency
from .views import CurrencyCacheService

class CurrencyAPITests(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_superuser(
            email="admin@example.com",
            password="password123",
            role="admin"
        )
        self.regular_user = User.objects.create_user(
            email="user@example.com",
            password="password123",
            role="customer"
        )
        self.list_url = reverse('currency-list')
        self.create_url = reverse('currency-create')
        
        # Ensure cache is clean
        CurrencyCacheService().clear_namespace()

    def test_list_currencies_public(self):
        Currency.objects.create(name="US Dollar", code="USD", symbol="$")
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['code'], "USD")

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
        self.client.post(self.create_url, {"name": "US Dollar", "code": "USD", "symbol": "$"})
        
        # Same code with whitespace and lowercase should fail (400)
        # Serializer should normalize and catch it
        response = self.client.post(self.create_url, {"name": "Dollar Two", "code": " usd ", "symbol": "$"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Same name with whitespace should fail
        response = self.client.post(self.create_url, {"name": " US Dollar ", "code": "EUR", "symbol": "€"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_is_deleted_filtering(self):
        Currency.objects.create(name="Deleted", code="DEL", symbol="X", is_deleted=True)
        Currency.objects.create(name="Active", code="ACT", symbol="V", is_deleted=False)
        
        response = self.client.get(self.list_url)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['code'], "ACT")

    def test_cache_invalidation_on_create(self):
        self.client.force_authenticate(user=self.admin_user)
        
        # 1. Initially empty
        res1 = self.client.get(self.list_url)
        self.assertEqual(len(res1.data), 0)
        
        # 2. Create new
        self.client.post(self.create_url, {"name": "New", "code": "NEW", "symbol": "N"})
        
        # 3. Check list again - cache should have been invalidated
        res2 = self.client.get(self.list_url)
        self.assertEqual(len(res2.data), 1)

    def test_admin_mutation_invalidates_cache(self):
        c = Currency.objects.create(name="Old", code="OLD", symbol="O")
        
        # Cache the list
        self.client.get(self.list_url)
        
        # Mock admin update
        c.name = "New Name"
        c.save() # This calls model save, but we need admin invalidation test
        
        # In reality, admin.py's save_model does the extra step. 
        # But we can simulate the clear_namespace call or check the admin code directly.
        # Here we'll just check if the model save works as expected.
        # (Model save doesn't invalidate by default, admin/mixin does)
        
        from .admin import CurrencyAdmin
        from django.contrib.admin.sites import AdminSite
        site = AdminSite()
        admin = CurrencyAdmin(Currency, site)
        
        # Simulate admin save
        admin.save_model(None, c, None, True)
        
        response = self.client.get(self.list_url)
        self.assertEqual(response.data[0]['name'], "New Name")
