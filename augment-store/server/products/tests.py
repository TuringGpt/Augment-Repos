from core.tests import BaseAPITestCase
from accounts.factory import UserFactory
from accounts.models import User
from rest_framework import status
from django.urls import reverse
from products.models import Product, ProductBrand, ProductCategory
from products.factory import ProductBrandFactory, ProductCategoryFactory, ProductFactory
from decimal import Decimal
from storage.factory import FileFactory
from products.services import ProductBrandCacheService, ProductCacheService, ProductCategoryCacheService, ProductSearchCacheService
from products.models import SearchQuery
from django.test.utils import CaptureQueriesContext
from django.db import connection


class ProductBrandTests(BaseAPITestCase):

    def setUp(self):
        super().setUp()
        # Create a merchant user for authenticated tests
        self.merchant_user = UserFactory(
            email="merchant@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.MERCHANT
        )
        self.merchant_client = self.authenticated_client
        self.merchant_client.force_authenticate(user=self.merchant_user)

        # Create a member user for permission tests
        self.member_user = UserFactory(
            email="member@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.MEMBER
        )

    def test_list_brands_unauthenticated(self):
        # GIVEN some brands exist in the database
        ProductBrandFactory(
            name="Test Brand 1",
            description="Test Description 1",
            created_by=self.merchant_user
        )
        ProductBrandFactory(
            name="Test Brand 2",
            description="Test Description 2",
            created_by=self.merchant_user
        )

        # WHEN we make a get request to list brands without authentication
        url = reverse("v1:product_brand_list")
        response = self.client.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND the response should contain the brands
        self.assertEqual(len(response.data.get("results", [])), 2)

    def test_create_brand_success(self):
        # GIVEN a merchant user is authenticated
        # WHEN we make a post request to create a brand with valid data
        url = reverse("v1:create_product_brand")
        payload = {
            "name": "New Brand",
            "description": "New Brand Description",
        }
        response = self.merchant_client.post(url, payload)

        # THEN we should get a 201 response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # AND a ProductBrand object should be created in the database
        self.assertTrue(ProductBrand.objects.filter(name="New Brand").exists())

        # AND the brand should be created by the merchant user
        brand = ProductBrand.objects.get(name="New Brand")
        self.assertEqual(brand.created_by, self.merchant_user)

    def test_create_brand_unauthenticated(self):
        # GIVEN a user is not authenticated
        # WHEN we make a post request to create a brand
        url = reverse("v1:create_product_brand")
        payload = {
            "name": "New Brand",
            "description": "New Brand Description",
        }
        response = self.client.post(url, payload)

        # THEN we should get a 401 response
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_brand_member_role_forbidden(self):
        # GIVEN a member user is authenticated (not merchant or admin)
        member_client = self.authenticated_client
        member_client.force_authenticate(user=self.member_user)

        # WHEN we make a post request to create a brand
        url = reverse("v1:create_product_brand")
        payload = {
            "name": "New Brand",
            "description": "New Brand Description",
        }
        response = member_client.post(url, payload)

        # THEN we should get a 403 response
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_brand_duplicate_name(self):
        # GIVEN a brand with the same name already exists
        ProductBrandFactory(
            name="Existing Brand",
            description="Existing Description",
            created_by=self.merchant_user
        )

        # WHEN we make a post request to create a brand with the same name
        url = reverse("v1:create_product_brand")
        payload = {
            "name": "Existing Brand",
            "description": "New Description",
        }
        response = self.merchant_client.post(url, payload)

        # THEN we should get a 400 response
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_brand_detail(self):
        # GIVEN a brand exists in the database
        brand = ProductBrandFactory(
            name="Test Brand",
            description="Test Description",
            created_by=self.merchant_user
        )

        # WHEN we make a get request to retrieve the brand detail
        url = reverse("v1:product_brand_detail", kwargs={"pk": str(brand.id)})
        response = self.merchant_client.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND the response should contain the brand details
        self.assertEqual(response.data["name"], "Test Brand")
        self.assertEqual(response.data["description"], "Test Description")

    def test_update_brand_success(self):
        # GIVEN a brand exists in the database
        brand = ProductBrandFactory(
            name="Test Brand",
            description="Test Description",
            created_by=self.merchant_user
        )

        # WHEN we make a patch request to update the brand
        url = reverse("v1:product_brand_detail", kwargs={"pk": str(brand.id)})
        payload = {
            "description": "Updated Description",
        }
        response = self.merchant_client.patch(url, payload)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND the brand should be updated in the database
        brand.refresh_from_db()
        self.assertEqual(brand.description, "Updated Description")

    def test_delete_brand_success(self):
        # GIVEN a brand exists in the database
        brand = ProductBrandFactory(
            name="Test Brand",
            description="Test Description",
            created_by=self.merchant_user
        )

        # WHEN we make a delete request to delete the brand
        url = reverse("v1:product_brand_detail", kwargs={"pk": str(brand.id)})
        response = self.merchant_client.delete(url)

        # THEN we should get a 204 response
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # AND the brand should be deleted from the database
        self.assertFalse(ProductBrand.objects.filter(id=brand.id).exists())

    def test_list_brands_uses_cache(self):
        # Given that I have clear all caches related to product brands
        ProductBrandCacheService().clear_namespace()
        # GIVEN some brands exist in the database
        ProductBrandFactory(name="Brand A", created_by=self.merchant_user)
        ProductBrandFactory(name="Brand B", created_by=self.merchant_user)

        url = reverse("v1:product_brand_list")

        # WHEN we make the first request
        with CaptureQueriesContext(connection) as ctx1:
            response_1 = self.client.get(url)

        # THEN the first request must hit the database
        self.assertGreater(len(ctx1), 0)

        # WHEN we make the request again
        # THEN it should return cached data without hitting the DB
        with self.assertNumQueries(0):
            response_2 = self.client.get(url)

        # AND the cached response should be identical
        self.assertEqual(response_1.data, response_2.data)

    def test_list_brands_cache_with_query_params(self):
        # Given that I have clear all caches related to product brands
        ProductBrandCacheService().clear_namespace()
        # GIVEN some brands exist in the database
        ProductBrandFactory(name="Brand A", created_by=self.merchant_user)
        ProductBrandFactory(name="Brand B", created_by=self.merchant_user)

        url = reverse("v1:product_brand_list")

        # WHEN we make the first request
        with CaptureQueriesContext(connection) as ctx1:
            response_1 = self.client.get(url, data={"name": "Brand A"})

        # THEN the first request must hit the database
        self.assertGreater(len(ctx1), 0)

        # WHEN we make the request again
        # THEN it should return cached data without hitting the DB
        with self.assertNumQueries(0):
            response_2 = self.client.get(url, data={"name": "Brand A"})

        # AND the cached response should be identical
        self.assertEqual(response_1.data, response_2.data)

class ProductCategoryTests(BaseAPITestCase):

    def setUp(self):
        super().setUp()
        # Create a merchant user for authenticated tests
        self.merchant_user = UserFactory(
            email="merchant@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.MERCHANT
        )
        self.merchant_client = self.authenticated_client
        self.merchant_client.force_authenticate(user=self.merchant_user)

        # Create a member user for permission tests
        self.member_user = UserFactory(
            email="member@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.MEMBER
        )

    def test_list_categories_unauthenticated(self):
        # GIVEN some categories exist in the database
        ProductCategoryFactory(
            name="Test Category 1",
            slug="test-category-1",
            description="Test Description 1",
            created_by=self.merchant_user
        )
        ProductCategoryFactory(
            name="Test Category 2",
            slug="test-category-2",
            description="Test Description 2",
            created_by=self.merchant_user
        )

        # WHEN we make a get request to list categories without authentication
        url = reverse("v1:product_category_list")
        response = self.client.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND the response should contain the categories
        self.assertEqual(len(response.data.get("results", [])), 2)

    def test_create_category_success(self):
        # GIVEN a merchant user is authenticated
        # WHEN we make a post request to create a category with valid data
        url = reverse("v1:create_product_category")
        payload = {
            "name": "New Category",
            "slug": "new-category",
            "description": "New Category Description",
        }
        response = self.merchant_client.post(url, payload)

        # THEN we should get a 201 response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # AND a ProductCategory object should be created in the database
        self.assertTrue(ProductCategory.objects.filter(name="New Category").exists())

        # AND the category should be created by the merchant user
        category = ProductCategory.objects.get(name="New Category")
        self.assertEqual(category.created_by, self.merchant_user)

    def test_create_category_with_parent(self):
        # GIVEN a parent category exists
        parent_category = ProductCategoryFactory(
            name="Parent Category",
            slug="parent-category",
            description="Parent Description",
            created_by=self.merchant_user
        )

        # WHEN we make a post request to create a child category
        url = reverse("v1:create_product_category")
        payload = {
            "name": "Child Category",
            "slug": "child-category",
            "description": "Child Category Description",
            "parent": str(parent_category.id),
        }
        response = self.merchant_client.post(url, payload)

        # THEN we should get a 201 response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # AND the child category should have the correct parent
        child_category = ProductCategory.objects.get(name="Child Category")
        self.assertEqual(child_category.parent, parent_category)

    def test_create_category_unauthenticated(self):
        # GIVEN a user is not authenticated
        # WHEN we make a post request to create a category
        url = reverse("v1:create_product_category")
        payload = {
            "name": "New Category",
            "slug": "new-category",
            "description": "New Category Description",
        }
        response = self.client.post(url, payload)

        # THEN we should get a 401 response
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_category_member_role_forbidden(self):
        # GIVEN a member user is authenticated (not merchant or admin)
        member_client = self.authenticated_client
        member_client.force_authenticate(user=self.member_user)

        # WHEN we make a post request to create a category
        url = reverse("v1:create_product_category")
        payload = {
            "name": "New Category",
            "slug": "new-category",
            "description": "New Category Description",
        }
        response = member_client.post(url, payload)

        # THEN we should get a 403 response
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_category_duplicate_name(self):
        # GIVEN a category with the same name already exists
        ProductCategoryFactory(
            name="Existing Category",
            slug="existing-category",
            description="Existing Description",
            created_by=self.merchant_user
        )

        # WHEN we make a post request to create a category with the same name
        url = reverse("v1:create_product_category")
        payload = {
            "name": "Existing Category",
            "slug": "existing-category-2",
            "description": "New Description",
        }
        response = self.merchant_client.post(url, payload)

        # THEN we should get a 400 response
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_category_detail(self):
        # GIVEN a category exists in the database
        category = ProductCategoryFactory(
            name="Test Category",
            slug="test-category",
            description="Test Description",
            created_by=self.merchant_user
        )

        # WHEN we make a get request to retrieve the category detail
        url = reverse("v1:product_category_detail", kwargs={"pk": str(category.id)})
        response = self.merchant_client.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND the response should contain the category details
        self.assertEqual(response.data["name"], "Test Category")
        self.assertEqual(response.data["slug"], "test-category")
        self.assertEqual(response.data["description"], "Test Description")

    def test_update_category_success(self):
        # GIVEN a category exists in the database
        category = ProductCategoryFactory(
            name="Test Category",
            slug="test-category",
            description="Test Description",
            created_by=self.merchant_user
        )

        # WHEN we make a patch request to update the category
        url = reverse("v1:product_category_detail", kwargs={"pk": str(category.id)})
        payload = {
            "description": "Updated Description",
        }
        response = self.merchant_client.patch(url, payload)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND the category should be updated in the database
        category.refresh_from_db()
        self.assertEqual(category.description, "Updated Description")

    def test_delete_category_success(self):
        # GIVEN a category exists in the database
        category = ProductCategoryFactory(
            name="Test Category",
            slug="test-category",
            description="Test Description",
            created_by=self.merchant_user
        )

        # WHEN we make a delete request to delete the category
        url = reverse("v1:product_category_detail", kwargs={"pk": str(category.id)})
        response = self.merchant_client.delete(url)

        # THEN we should get a 204 response
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # AND the category should be deleted from the database
        self.assertFalse(ProductCategory.objects.filter(id=category.id).exists())

    def test_list_categories_uses_cache(self):
        # Given that I have clear all caches related to product categories
        ProductCategoryCacheService().clear_namespace()

        # GIVEN some categories exist in the database
        ProductCategoryFactory(
            name="Test Category 1",
            slug="test-category-1",
            description="Test Description 1",
            created_by=self.merchant_user
        )
        ProductCategoryFactory(
            name="Test Category 2",
            slug="test-category-2",
            description="Test Description 2",
            created_by=self.merchant_user
        )

        url = reverse("v1:product_category_list")

        # WHEN we make the first request
        with CaptureQueriesContext(connection) as ctx1:
            response_1 = self.client.get(url)

            # THEN the first request must hit the database
            self.assertGreater(len(ctx1), 0)

        # WHEN we make the request again
        with CaptureQueriesContext(connection) as ctx2:
            response_2 = self.client.get(url)

            # THEN the second request should not hit the database
            self.assertEqual(len(ctx2), 0)

        # AND the cached response should be identical
        self.assertEqual(response_1.data, response_2.data)

    def test_list_categories_cache_invalidated_on_create(self):
        # Given that I have clear all caches related to product categories
        ProductCategoryCacheService().clear_namespace()

        # GIVEN some categories exist in the database
        category_1 = ProductCategoryFactory(
            name="Test Category 1",
            slug="test-category-1",
            description="Test Description 1",
            created_by=self.merchant_user
        )

        url = reverse("v1:product_category_list")

        # WHEN we make the first request
        with CaptureQueriesContext(connection) as ctx1:
            response_1 = self.client.get(url)

            # THEN the first request must hit the database
            self.assertGreater(len(ctx1), 0)

            # AND the response should contain the category
            self.assertEqual(response_1.data["results"][0]["name"], "Test Category 1")

        # WHEN we create a new category
        create_url = reverse("v1:create_product_category")
        payload = {
            "name": "New Category",
            "slug": "new-category",
            "description": "New Category Description",
        }

        self.merchant_client.post(create_url, payload)

        # WHEN we make the request again
        with CaptureQueriesContext(connection) as ctx2:
            response_2 = self.client.get(url)

            # THEN the second request should hit the database
            self.assertGreater(len(ctx2), 0)

        # AND the response should contain the new category (items are ordered by name)
        self.assertEqual(response_2.data["results"][0]["name"], "New Category")

        # AND the count of items should be 2
        self.assertEqual(response_2.data["count"], 2)


class ProductTests(BaseAPITestCase):

    def setUp(self):
        super().setUp()
        # Create a merchant user for authenticated tests
        self.merchant_user = UserFactory(
            email="merchant@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.MERCHANT
        )
        self.merchant_client = self.authenticated_client
        self.merchant_client.force_authenticate(user=self.merchant_user)

        # Create another merchant user for testing permissions
        self.merchant_user_2 = UserFactory(
            email="merchant2@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.MERCHANT
        )

        # Create a member user for permission tests
        self.member_user = UserFactory(
            email="member@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.MEMBER
        )

        # Create an admin user for permission tests
        self.admin_user = UserFactory(
            email="admin@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.ADMIN
        )

        # Create test brand and category
        self.brand = ProductBrandFactory(
            name="Test Brand",
            description="Test Brand Description",
            created_by=self.merchant_user
        )

        self.category = ProductCategoryFactory(
            name="Test Category",
            slug="test-category",
            description="Test Category Description",
            created_by=self.merchant_user
        )

    def test_list_products_unauthenticated(self):
        # GIVEN some products exist in the database
        ProductFactory(
            name="Test Product 1",
            description="Test Description 1",
            price=99.99,
            brand=self.brand,
            category=self.category,
            quantity=10,
            created_by=self.merchant_user
        )
        ProductFactory(
            name="Test Product 2",
            description="Test Description 2",
            price=149.99,
            brand=self.brand,
            category=self.category,
            quantity=5,
            created_by=self.merchant_user
        )

        # WHEN we make a get request to list products without authentication
        url = reverse("v1:product_list")
        response = self.client.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        result = response.data.get("results", [])
        # AND the response should contain the products
        self.assertEqual(len(result), 2)

    def test_product_list_filter_by_price_range(self):
        # GIVEN products with different prices exist in the database
        ProductFactory(
            name="Cheap Product",
            price=Decimal("50.00"),
            brand=self.brand,
            category=self.category,
            quantity=10,
            rating=Decimal("4.0"),
            created_by=self.merchant_user
        )
        ProductFactory(
            name="Mid Product",
            price=Decimal("150.00"),
            brand=self.brand,
            category=self.category,
            quantity=10,
            rating=Decimal("4.0"),
            created_by=self.merchant_user
        )
        ProductFactory(
            name="Expensive Product",
            price=Decimal("300.00"),
            brand=self.brand,
            category=self.category,
            quantity=10,
            rating=Decimal("4.0"),
            created_by=self.merchant_user
        )

        # WHEN we filter products by price range (100-200)
        url = reverse("v1:product_list")
        response = self.client.get(url, {"price_min": "100", "price_max": "200"})

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        result = response.data.get("results", [])
        # AND only products within the price range should be returned
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["name"], "Mid Product")

    def test_product_list_filter_by_rating_range(self):
        # GIVEN products with different ratings exist in the database
        ProductFactory(
            name="Low Rated Product",
            price=Decimal("100.00"),
            brand=self.brand,
            category=self.category,
            quantity=10,
            rating=Decimal("2.5"),
            created_by=self.merchant_user
        )
        ProductFactory(
            name="Mid Rated Product",
            price=Decimal("100.00"),
            brand=self.brand,
            category=self.category,
            quantity=10,
            rating=Decimal("3.5"),
            created_by=self.merchant_user
        )
        ProductFactory(
            name="High Rated Product",
            price=Decimal("100.00"),
            brand=self.brand,
            category=self.category,
            quantity=10,
            rating=Decimal("4.8"),
            created_by=self.merchant_user
        )

        # WHEN we filter products by rating range (3.0-4.0)
        url = reverse("v1:product_list")
        response = self.client.get(url, {"rating_min": "3.0", "rating_max": "4.0"})

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        result = response.data.get("results", [])
        # AND only products within the rating range should be returned
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["name"], "Mid Rated Product")

    def test_product_list_filter_by_category_slug(self):
        # GIVEN products with different categories exist in the database
        category_electronics = ProductCategoryFactory(
            name="Electronics",
            slug="electronics",
            created_by=self.merchant_user
        )
        category_clothing = ProductCategoryFactory(
            name="Clothing",
            slug="clothing",
            created_by=self.merchant_user
        )

        ProductFactory(
            name="Laptop",
            price=Decimal("1000.00"),
            brand=self.brand,
            category=category_electronics,
            quantity=10,
            rating=Decimal("4.5"),
            created_by=self.merchant_user
        )
        ProductFactory(
            name="T-Shirt",
            price=Decimal("25.00"),
            brand=self.brand,
            category=category_clothing,
            quantity=50,
            rating=Decimal("4.0"),
            created_by=self.merchant_user
        )
        ProductFactory(
            name="Smartphone",
            price=Decimal("800.00"),
            brand=self.brand,
            category=category_electronics,
            quantity=15,
            rating=Decimal("4.7"),
            created_by=self.merchant_user
        )

        # WHEN we filter products by category slug "electronics"
        url = reverse("v1:product_list")
        response = self.client.get(url, {"category": "electronics"})

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND only products in the electronics category should be returned
        result = response.data.get("results", [])
        self.assertEqual(len(result), 2)
        product_names = [product["name"] for product in result]
        self.assertIn("Laptop", product_names)
        self.assertIn("Smartphone", product_names)
        self.assertNotIn("T-Shirt", product_names)

    def test_product_list_filter_by_brand_name(self):
        # GIVEN products with different brands exist in the database
        brand_apple = ProductBrandFactory(
            name="Apple",
            created_by=self.merchant_user
        )
        brand_samsung = ProductBrandFactory(
            name="Samsung",
            created_by=self.merchant_user
        )

        ProductFactory(
            name="iPhone",
            price=Decimal("999.00"),
            brand=brand_apple,
            category=self.category,
            quantity=20,
            rating=Decimal("4.8"),
            created_by=self.merchant_user
        )
        ProductFactory(
            name="Galaxy Phone",
            price=Decimal("899.00"),
            brand=brand_samsung,
            category=self.category,
            quantity=25,
            rating=Decimal("4.6"),
            created_by=self.merchant_user
        )
        ProductFactory(
            name="MacBook",
            price=Decimal("1999.00"),
            brand=brand_apple,
            category=self.category,
            quantity=10,
            rating=Decimal("4.9"),
            created_by=self.merchant_user
        )

        # WHEN we filter products by brand name "Apple"
        url = reverse("v1:product_list")
        response = self.client.get(url, {"brand": "Apple"})

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        result = response.data.get("results", [])
        # AND only products from Apple brand should be returned
        self.assertEqual(len(result), 2)
        product_names = [product["name"] for product in result]
        self.assertIn("iPhone", product_names)
        self.assertIn("MacBook", product_names)
        self.assertNotIn("Galaxy Phone", product_names)

    def test_product_list_filter_by_quantity_range(self):
        # GIVEN products with different quantities exist in the database
        ProductFactory(
            name="Low Stock Product",
            price=Decimal("100.00"),
            brand=self.brand,
            category=self.category,
            quantity=5,
            rating=Decimal("4.0"),
            created_by=self.merchant_user
        )
        ProductFactory(
            name="Medium Stock Product",
            price=Decimal("100.00"),
            brand=self.brand,
            category=self.category,
            quantity=50,
            rating=Decimal("4.0"),
            created_by=self.merchant_user
        )
        ProductFactory(
            name="High Stock Product",
            price=Decimal("100.00"),
            brand=self.brand,
            category=self.category,
            quantity=200,
            rating=Decimal("4.0"),
            created_by=self.merchant_user
        )

        # WHEN we filter products by quantity range (20-100)
        url = reverse("v1:product_list")
        response = self.client.get(url, {"quantity_min": "20", "quantity_max": "100"})

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND only products within the quantity range should be returned
        result = response.data.get("results", [])
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["name"], "Medium Stock Product")

    def test_product_list_filter_multiple_filters_combined(self):
        # GIVEN products with various attributes exist in the database
        brand_nike = ProductBrandFactory(
            name="Nike",
            created_by=self.merchant_user
        )
        brand_adidas = ProductBrandFactory(
            name="Adidas",
            created_by=self.merchant_user
        )
        category_shoes = ProductCategoryFactory(
            name="Shoes",
            slug="shoes",
            created_by=self.merchant_user
        )

        ProductFactory(
            name="Nike Running Shoes",
            price=Decimal("120.00"),
            brand=brand_nike,
            category=category_shoes,
            quantity=30,
            rating=Decimal("4.5"),
            created_by=self.merchant_user
        )
        ProductFactory(
            name="Nike Basketball Shoes",
            price=Decimal("180.00"),
            brand=brand_nike,
            category=category_shoes,
            quantity=20,
            rating=Decimal("4.8"),
            created_by=self.merchant_user
        )
        ProductFactory(
            name="Adidas Running Shoes",
            price=Decimal("110.00"),
            brand=brand_adidas,
            category=category_shoes,
            quantity=40,
            rating=Decimal("4.3"),
            created_by=self.merchant_user
        )

        # WHEN we filter products by multiple criteria: brand=Nike, price_min=100, price_max=150, rating_min=4.0
        url = reverse("v1:product_list")
        response = self.client.get(url, {
            "brand": "Nike",
            "price_min": "100",
            "price_max": "150",
            "rating_min": "4.0"
        })

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND only products matching all criteria should be returned
        result = response.data.get("results", [])
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["name"], "Nike Running Shoes")

    def test_product_list_filter_no_results(self):
        # GIVEN products exist in the database
        ProductFactory(
            name="Product 1",
            price=Decimal("100.00"),
            brand=self.brand,
            category=self.category,
            quantity=10,
            rating=Decimal("4.0"),
            created_by=self.merchant_user
        )

        # WHEN we filter products with criteria that match no products
        url = reverse("v1:product_list")
        response = self.client.get(url, {"price_min": "1000", "price_max": "2000"})

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND an empty list should be returned
        self.assertEqual(len(response.data.get("results", [])), 0)

    def test_create_product_success(self):
        # GIVEN a merchant user is authenticated
        # WHEN we make a post request to create a product with valid data
        url = reverse("v1:create_product")
        payload = {
            "name": "New Product",
            "description": "New Product Description",
            "price": "199.99",
            "brand": str(self.brand.id),
            "category": str(self.category.id),
            "quantity": 20,
        }
        response = self.merchant_client.post(url, payload)

        # THEN we should get a 201 response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # AND a Product object should be created in the database
        self.assertTrue(Product.objects.filter(name="New Product").exists())

        # AND the product should be created by the merchant user
        product = Product.objects.get(name="New Product")
        self.assertEqual(product.created_by, self.merchant_user)
        self.assertEqual(product.price, Decimal("199.99"))

    def test_create_product_success_with_images(self):
        # GIVEN a merchant user is authenticated
        # AND some images exist in the database
        image1 = FileFactory(created_by=self.merchant_user)
        image2 = FileFactory(created_by=self.merchant_user)
        image3 = FileFactory(created_by=self.merchant_user)

        # WHEN we make a post request to create a product with images
        url = reverse("v1:create_product")
        payload = {
            "name": "New Product with Images",
            "description": "New Product Description",
            "price": "299.99",
            "brand": str(self.brand.id),
            "category": str(self.category.id),
            "quantity": 15,
            "images": [str(image1.id), str(image2.id), str(image3.id)],
        }
        response = self.merchant_client.post(url, payload)

        # THEN we should get a 201 response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # AND a Product object should be created in the database
        self.assertTrue(Product.objects.filter(name="New Product with Images").exists())

        # AND the product should have the correct images associated
        product = Product.objects.get(name="New Product with Images")
        self.assertEqual(product.images.count(), 3)
        self.assertIn(image1, product.images.all())
        self.assertIn(image2, product.images.all())
        self.assertIn(image3, product.images.all())

    def test_create_product_unauthenticated(self):
        # GIVEN a user is not authenticated
        # WHEN we make a post request to create a product
        url = reverse("v1:create_product")
        payload = {
            "name": "New Product",
            "description": "New Product Description",
            "price": "199.99",
            "brand": str(self.brand.id),
            "category": str(self.category.id),
            "quantity": 20,
        }
        response = self.client.post(url, payload)

        # THEN we should get a 401 response
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_product_member_role_forbidden(self):
        # GIVEN a member user is authenticated (not merchant or admin)
        member_client = self.authenticated_client
        member_client.force_authenticate(user=self.member_user)

        # WHEN we make a post request to create a product
        url = reverse("v1:create_product")
        payload = {
            "name": "New Product",
            "description": "New Product Description",
            "price": "199.99",
            "brand": str(self.brand.id),
            "category": str(self.category.id),
            "quantity": 20,
        }
        response = member_client.post(url, payload)

        # THEN we should get a 403 response
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_retrieve_product_detail(self):
        # GIVEN a product exists in the database
        product = ProductFactory(
            name="Test Product",
            description="Test Description",
            price=99.99,
            brand=self.brand,
            category=self.category,
            quantity=10,
            created_by=self.merchant_user
        )

        # WHEN we make a get request to retrieve the product detail
        url = reverse("v1:product_update_delete", kwargs={"pk": str(product.id)})
        response = self.merchant_client.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND the response should contain the product details
        self.assertEqual(response.data["name"], "Test Product")
        self.assertEqual(response.data["description"], "Test Description")
        self.assertEqual(float(response.data["price"]), 99.99)

    def test_update_product_success(self):
        # GIVEN a product exists in the database created by the merchant user
        product = ProductFactory(
            name="Test Product",
            description="Test Description",
            price=99.99,
            brand=self.brand,
            category=self.category,
            quantity=10,
            created_by=self.merchant_user
        )

        # WHEN we make a patch request to update the product
        url = reverse("v1:product_update_delete", kwargs={"pk": str(product.id)})
        payload = {
            "description": "Updated Description",
            "price": "149.99",
        }
        response = self.merchant_client.patch(url, payload)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND the product should be updated in the database
        product.refresh_from_db()
        self.assertEqual(product.description, "Updated Description")
        self.assertEqual(product.price, Decimal("149.99"))

    def test_update_product_by_different_merchant_forbidden(self):
        # GIVEN a product exists created by merchant_user
        product = ProductFactory(
            name="Test Product",
            description="Test Description",
            price=99.99,
            brand=self.brand,
            category=self.category,
            quantity=10,
            created_by=self.merchant_user
        )

        # WHEN merchant_user_2 tries to update the product
        merchant_client_2 = self.authenticated_client
        merchant_client_2.force_authenticate(user=self.merchant_user_2)

        url = reverse("v1:product_update_delete", kwargs={"pk": str(product.id)})
        payload = {
            "description": "Updated Description",
        }
        response = merchant_client_2.patch(url, payload)

        # THEN we should get a 404 response (product not in their queryset)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_product_by_admin_success(self):
        # GIVEN a product exists created by merchant_user
        product = ProductFactory(
            name="Test Product",
            description="Test Description",
            price=99.99,
            brand=self.brand,
            category=self.category,
            quantity=10,
            created_by=self.merchant_user
        )

        # WHEN admin user tries to update the product
        admin_client = self.authenticated_client
        admin_client.force_authenticate(user=self.admin_user)

        url = reverse("v1:product_update_delete", kwargs={"pk": str(product.id)})
        payload = {
            "description": "Updated by Admin",
        }
        response = admin_client.patch(url, payload)

        # THEN we should get a 200 response (admin can update any product)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND the product should be updated
        product.refresh_from_db()
        self.assertEqual(product.description, "Updated by Admin")

    def test_delete_product_success(self):
        # GIVEN a product exists in the database created by the merchant user
        product = ProductFactory(
            name="Test Product",
            description="Test Description",
            price=99.99,
            brand=self.brand,
            category=self.category,
            quantity=10,
            created_by=self.merchant_user
        )

        # WHEN we make a delete request to delete the product
        url = reverse("v1:product_update_delete", kwargs={"pk": str(product.id)})
        response = self.merchant_client.delete(url)

        # THEN we should get a 204 response
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # AND the product should be deleted from the database
        self.assertFalse(Product.objects.filter(id=product.id).exists())

    def test_delete_product_by_different_merchant_forbidden(self):
        # GIVEN a product exists created by merchant_user
        product = ProductFactory(
            name="Test Product",
            description="Test Description",
            price=99.99,
            brand=self.brand,
            category=self.category,
            quantity=10,
            created_by=self.merchant_user
        )

        # WHEN merchant_user_2 tries to delete the product
        merchant_client_2 = self.authenticated_client
        merchant_client_2.force_authenticate(user=self.merchant_user_2)

        url = reverse("v1:product_update_delete", kwargs={"pk": str(product.id)})
        response = merchant_client_2.delete(url)

        # THEN we should get a 404 response (product not in their queryset)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # AND the product should still exist in the database
        self.assertTrue(Product.objects.filter(id=product.id).exists())

    def test_create_product_with_invalid_brand(self):
        # GIVEN a merchant user is authenticated
        # WHEN we make a post request with an invalid brand ID
        url = reverse("v1:create_product")
        payload = {
            "name": "New Product",
            "description": "New Product Description",
            "price": "199.99",
            "brand": "99999999-9999-9999-9999-999999999999",
            "category": str(self.category.id),
            "quantity": 20,
        }
        response = self.merchant_client.post(url, payload)

        # THEN we should get a 400 response
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_product_with_invalid_category(self):
        # GIVEN a merchant user is authenticated
        # WHEN we make a post request with an invalid category ID
        url = reverse("v1:create_product")
        payload = {
            "name": "New Product",
            "description": "New Product Description",
            "price": "199.99",
            "brand": str(self.brand.id),
            "category": "99999999-9999-9999-9999-999999999999",
            "quantity": 20,
        }
        response = self.merchant_client.post(url, payload)

        # THEN we should get a 400 response
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def _create_products_and_test_ordering(self, products_data, ordering_param, expected_order):
        """
        Helper method to create products and test ordering.

        Args:
            products_data: List of dicts with product attributes
            ordering_param: The ordering parameter to use in the request
            expected_order: List of tuples (product_name, field_name, expected_value) or (product_name, nested_field_path, expected_value)
        """
        # Create products
        for product_data in products_data:
            ProductFactory(**product_data, created_by=self.merchant_user)

        # Make request with ordering
        url = reverse("v1:product_list")
        response = self.client.get(url, {"ordering": ordering_param})

        # Assert response status
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        result = response.data.get("results", [])
        self.assertEqual(len(result), len(products_data))

        # Assert ordering
        for idx, (expected_name, field_path, expected_value) in enumerate(expected_order):
            self.assertEqual(result[idx]["name"], expected_name)

            # Handle nested fields (e.g., "brand.name" or "category.name")
            if "." in field_path:
                parts = field_path.split(".")
                value = result[idx]
                for part in parts:
                    value = value[part]
                self.assertEqual(value, expected_value)
            else:
                # Handle direct fields
                actual_value = result[idx][field_path]
                if isinstance(expected_value, float):
                    self.assertEqual(float(actual_value), expected_value)
                else:
                    self.assertEqual(actual_value, expected_value)

    def test_product_list_ordering_by_price_ascending(self):
        # GIVEN multiple products with different prices exist
        products_data = [
            {"name": "Expensive Product", "price": 299.99, "brand": self.brand, "category": self.category, "quantity": 10, "rating": 4.5},
            {"name": "Cheap Product", "price": 49.99, "brand": self.brand, "category": self.category, "quantity": 20, "rating": 3.5},
            {"name": "Mid-range Product", "price": 149.99, "brand": self.brand, "category": self.category, "quantity": 15, "rating": 4.0},
        ]

        expected_order = [
            ("Cheap Product", "price", 49.99),
            ("Mid-range Product", "price", 149.99),
            ("Expensive Product", "price", 299.99),
        ]

        # WHEN we request the product list ordered by price ascending
        # THEN the products should be ordered by price ascending
        self._create_products_and_test_ordering(products_data, "price", expected_order)

    def test_product_list_ordering_by_price_descending(self):
        # GIVEN multiple products with different prices exist
        products_data = [
            {"name": "Expensive Product", "price": 299.99, "brand": self.brand, "category": self.category, "quantity": 10, "rating": 4.5},
            {"name": "Cheap Product", "price": 49.99, "brand": self.brand, "category": self.category, "quantity": 20, "rating": 3.5},
            {"name": "Mid-range Product", "price": 149.99, "brand": self.brand, "category": self.category, "quantity": 15, "rating": 4.0},
        ]

        expected_order = [
            ("Expensive Product", "price", 299.99),
            ("Mid-range Product", "price", 149.99),
            ("Cheap Product", "price", 49.99),
        ]

        # WHEN we request the product list ordered by price descending
        # THEN the products should be ordered by price descending
        self._create_products_and_test_ordering(products_data, "-price", expected_order)

    def test_product_list_ordering_by_rating_descending(self):
        # GIVEN multiple products with different ratings exist
        products_data = [
            {"name": "Highly Rated Product", "price": 199.99, "brand": self.brand, "category": self.category, "quantity": 10, "rating": 4.8},
            {"name": "Low Rated Product", "price": 99.99, "brand": self.brand, "category": self.category, "quantity": 20, "rating": 2.5},
            {"name": "Average Rated Product", "price": 149.99, "brand": self.brand, "category": self.category, "quantity": 15, "rating": 3.7},
        ]

        expected_order = [
            ("Highly Rated Product", "rating", 4.8),
            ("Average Rated Product", "rating", 3.7),
            ("Low Rated Product", "rating", 2.5),
        ]

        # WHEN we request the product list ordered by rating descending
        # THEN the products should be ordered by rating descending
        self._create_products_and_test_ordering(products_data, "-rating", expected_order)

    def test_product_list_ordering_by_quantity_ascending(self):
        # GIVEN multiple products with different quantities exist
        products_data = [
            {"name": "High Stock Product", "price": 199.99, "brand": self.brand, "category": self.category, "quantity": 100, "rating": 4.0},
            {"name": "Low Stock Product", "price": 99.99, "brand": self.brand, "category": self.category, "quantity": 5, "rating": 4.0},
            {"name": "Medium Stock Product", "price": 149.99, "brand": self.brand, "category": self.category, "quantity": 50, "rating": 4.0},
        ]

        expected_order = [
            ("Low Stock Product", "quantity", 5),
            ("Medium Stock Product", "quantity", 50),
            ("High Stock Product", "quantity", 100),
        ]

        # WHEN we request the product list ordered by quantity ascending
        # THEN the products should be ordered by quantity ascending
        self._create_products_and_test_ordering(products_data, "quantity", expected_order)

    def test_product_list_ordering_by_brand_name(self):
        # GIVEN multiple products with different brands exist
        brand_a = ProductBrandFactory(name="Alpha Brand", description="First brand", created_by=self.merchant_user)
        brand_z = ProductBrandFactory(name="Zeta Brand", description="Last brand", created_by=self.merchant_user)
        brand_m = ProductBrandFactory(name="Mega Brand", description="Middle brand", created_by=self.merchant_user)

        products_data = [
            {"name": "Product from Zeta", "price": 199.99, "brand": brand_z, "category": self.category, "quantity": 10, "rating": 4.0},
            {"name": "Product from Alpha", "price": 99.99, "brand": brand_a, "category": self.category, "quantity": 20, "rating": 4.0},
            {"name": "Product from Mega", "price": 149.99, "brand": brand_m, "category": self.category, "quantity": 15, "rating": 4.0},
        ]

        expected_order = [
            ("Product from Alpha", "brand.name", "Alpha Brand"),
            ("Product from Mega", "brand.name", "Mega Brand"),
            ("Product from Zeta", "brand.name", "Zeta Brand"),
        ]

        # WHEN we request the product list ordered by brand name ascending
        # THEN the products should be ordered by brand name ascending
        self._create_products_and_test_ordering(products_data, "brand__name", expected_order)

    def test_product_list_ordering_by_category_name(self):
        # GIVEN multiple products with different categories exist
        category_a = ProductCategoryFactory(name="Accessories", slug="accessories", description="Accessories category", created_by=self.merchant_user)
        category_e = ProductCategoryFactory(name="Electronics", slug="electronics", description="Electronics category", created_by=self.merchant_user)
        category_c = ProductCategoryFactory(name="Clothing", slug="clothing", description="Clothing category", created_by=self.merchant_user)

        products_data = [
            {"name": "Electronic Product", "price": 199.99, "brand": self.brand, "category": category_e, "quantity": 10, "rating": 4.0},
            {"name": "Accessory Product", "price": 99.99, "brand": self.brand, "category": category_a, "quantity": 20, "rating": 4.0},
            {"name": "Clothing Product", "price": 149.99, "brand": self.brand, "category": category_c, "quantity": 15, "rating": 4.0},
        ]

        expected_order = [
            ("Accessory Product", "category.name", "Accessories"),
            ("Clothing Product", "category.name", "Clothing"),
            ("Electronic Product", "category.name", "Electronics"),
        ]

        # WHEN we request the product list ordered by category name ascending
        # THEN the products should be ordered by category name ascending
        self._create_products_and_test_ordering(products_data, "category__name", expected_order)

    def test_list_products_cached(self):
        # Given that I have clear all caches related to products
        ProductCacheService().clear_namespace()

        # GIVEN some products exist in the database
        ProductFactory(
            name="Test Product 1",
            description="Test Description 1",
            price=99.99,
            brand=self.brand,
            category=self.category,
            quantity=10,
            created_by=self.merchant_user
        )
        ProductFactory(
            name="Test Product 2",
            description="Test Description 2",
            price=149.99,
            brand=self.brand,
            category=self.category,
            quantity=5,
            created_by=self.merchant_user
        )
        url = reverse("v1:product_list")

        # WHEN we make the first request
        with CaptureQueriesContext(connection) as ctx1:
            response_1 = self.client.get(url)

        # THEN the first request must hit the database
        self.assertGreater(len(ctx1), 0)

        # WHEN we make the request again
        with CaptureQueriesContext(connection) as ctx2:
            response_2 = self.client.get(url)

        # THEN the second request should not hit the database
        self.assertEqual(len(ctx2), 0)

        # AND the cached response should be identical
        self.assertEqual(response_1.data, response_2.data)

    def test_cache_invalidated_on_create(self):
        # Given that I have clear all caches related to products
        ProductCacheService().clear_namespace()

        # GIVEN some products exist in the database
        ProductFactory(
            name="Test Product 1",
            description="Test Description 1",
            price=99.99,
            brand=self.brand,
            category=self.category,
            quantity=10,
            created_by=self.merchant_user
        )
        ProductFactory(
            name="Test Product 2",
            description="Test Description 2",
            price=149.99,
            brand=self.brand,
            category=self.category,
            quantity=5,
            created_by=self.merchant_user
        )

        user = UserFactory(
            email="member@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.MEMBER
        )
        self.client.force_authenticate(user=user)
        url = reverse("v1:product_list")


        # WHEN we make the first request
        with CaptureQueriesContext(connection) as ctx1:
            self.client.get(url)
            # THEN the first request must hit the database
            self.assertGreater(len(ctx1), 0)

        # WHEN we create a new product
        create_url = reverse("v1:create_product")
        payload = {
            "name": "New Product",
            "description": "New Product Description",
            "price": "199.99",
            "brand": str(self.brand.id),
            "category": str(self.category.id),
            "quantity": 20,
        }
        self.merchant_client.post(create_url, payload)

        # WHEN we make the request again
        with CaptureQueriesContext(connection) as ctx2:
            response_2 = self.client.get(url)
            # THEN the second request should hit the database
            self.assertGreater(len(ctx2), 0)

            # AND the response should contain the new product (items are ordered by name)
            self.assertEqual(response_2.data["results"][0]["name"], "New Product")

        

class RecommendProductListViewTests(BaseAPITestCase):
    def setUp(self):
        self.member_user = UserFactory(
            email="member@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.MEMBER
        )
        super().setUp()
    
    def test_recommend_product_list_authenticated(self):
        # TODO: complete this test in next PR
        # GIVEN an authenticated user exists
        self.client.force_authenticate(user=self.member_user)
        # AND the user has products in their wishlist, cart and order
        # AND the products are in different categories
        # WHEN we make a GET request to recommend products
        url = reverse("v1:product_recommend")
        response = self.client.get(url)
        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # AND the recommended products should be in the same category as the user's wishlist, cart and order

class ProductSearchViewTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        # Let factory generate unique email to avoid django_get_or_create conflicts
        self.merchant_user = UserFactory(role=User.Role.MERCHANT)
        self.merchant_client = self.authenticated_client
        self.merchant_client.force_authenticate(user=self.merchant_user)

    def test_search_cache_and_logging(self):
        # GIVEN products exist
        ProductFactory(name="Test Phone", created_by=self.merchant_user)
        
        # Clear cache for this specific test - use service namespace clear
        # Note: clear_namespace handles Redis pattern matching; for LocMemCache it may no-op
        # but since tests run serially in Django test runner, this is generally safe
        cache_service = ProductSearchCacheService()
        cache_service.clear_namespace()
        
        url = reverse("v1:product_search")

        # WHEN making first search request (authenticated)
        # 1. Product count query
        # 2. Search logging (insert)
        # 3. Product fetch
        # Total should be > 0.
        with CaptureQueriesContext(connection) as ctx1:
            response_1 = self.merchant_client.get(url, {"search": "Phone"})
        
        self.assertEqual(response_1.status_code, status.HTTP_200_OK)
        
        # Verify first request was a cache MISS by checking for product SELECT query
        first_request_product_queries = [
            q for q in ctx1.captured_queries 
            if 'from "products_product"' in q['sql'].lower() or 'from products_product' in q['sql'].lower()
        ]
        self.assertGreater(len(first_request_product_queries), 0, "First request should query products_product (cache miss)")

        # WHEN making second search request (identical, authenticated)
        # Should hit cache (no product queries), but MUST still log search (1 DB insert).
        # We expect exactly 1 query (the insert).
        # Note: If logging uses valid connection and atomic transaction, it's 1 query.
        with CaptureQueriesContext(connection) as ctx2:
            response_2 = self.merchant_client.get(url, {"search": "Phone"})
        
        self.assertEqual(response_2.status_code, status.HTTP_200_OK)
        
        # Verify response is cached
        self.assertEqual(response_1.data, response_2.data)
        
        # Verify NO product table SELECT queries on cache hit
        # Exclude products_searchquery (INSERT for logging) - only check for SELECT FROM products_product
        product_select_queries = [
            q for q in ctx2.captured_queries 
            if 'from "products_product"' in q['sql'].lower() or 'from products_product' in q['sql'].lower()
        ]
        self.assertEqual(len(product_select_queries), 0, "Should not query products_product table on cache hit")
        
        # Verify SearchQuery was logged both times
        # We can't strictly assert len(ctx2) == 1 because middleware might add queries (session, user, etc).
        # Instead, check SearchQuery count.
        self.assertEqual(SearchQuery.objects.count(), 2)
