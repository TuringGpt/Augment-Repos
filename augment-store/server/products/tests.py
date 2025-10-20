from core.tests import BaseAPITestCase
from accounts.factory import UserFactory
from accounts.models import User
from rest_framework import status
from django.urls import reverse
from products.models import Product, ProductBrand, ProductCategory
from products.factory import ProductBrandFactory, ProductCategoryFactory, ProductFactory
from decimal import Decimal
from storage.factory import FileFactory


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
        self.assertEqual(len(response.data), 2)

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
        self.assertEqual(len(response.data), 2)

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

        # AND the response should contain the products
        self.assertEqual(len(response.data), 2)

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
