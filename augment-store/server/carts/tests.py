from core.tests import BaseAPITestCase
from accounts.factory import UserFactory
from accounts.models import User
from rest_framework import status
from django.urls import reverse
from products.factory import ProductFactory
from carts.models import Cart, Wishlist
from carts.factory import CartItemFactory


class CartDetailViewTests(BaseAPITestCase):

    def setUp(self):
        super().setUp()
        # Create a member user for authenticated tests
        self.member_user = UserFactory(
            email="member@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.MEMBER
        )
        self.member_client = self.authenticated_client
        self.member_client.force_authenticate(user=self.member_user)

        # Create test products
        self.product1 = ProductFactory(quantity=100)
        self.product2 = ProductFactory(quantity=50)

    def test_get_cart_detail_authenticated(self):
        # GIVEN an authenticated user exists
        # AND the user has items in their cart
        cart = Cart.objects.get_user_cart(self.member_user)
        cart_item1 = CartItemFactory(
            product=self.product1,
            quantity=2,
            created_by=self.member_user
        )
        cart_item2 = CartItemFactory(
            product=self.product2,
            quantity=1,
            created_by=self.member_user
        )
        cart.items.add(cart_item1, cart_item2)
        cart.save()

        # WHEN we make a GET request to retrieve the cart
        url = reverse("v1:carts:cart_detail")
        response = self.member_client.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND the response should contain the cart details
        self.assertIn("items", response.data)
        self.assertEqual(len(response.data["items"]), 2)
        self.assertEqual(response.data["user"], self.member_user.id)

    def test_get_cart_detail_empty_cart(self):
        # GIVEN an authenticated user exists
        # AND the user has an empty cart

        # WHEN we make a GET request to retrieve the cart
        url = reverse("v1:carts:cart_detail")
        response = self.member_client.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND the response should contain an empty items list
        self.assertIn("items", response.data)
        self.assertEqual(len(response.data["items"]), 0)

    def test_get_cart_detail_unauthenticated(self):
        # GIVEN a user is not authenticated

        # WHEN we make a GET request to retrieve the cart
        url = reverse("v1:carts:cart_detail")
        response = self.client.get(url)

        # THEN we should get a 401 response
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_cart_item_has_subtotal_field(self):
        # GIVEN a user has one item in their cart with quantity=1
        from decimal import Decimal
        cart = Cart.objects.get_user_cart(self.member_user)
        cart_item = CartItemFactory(
            product=self.product1,
            quantity=1,
            created_by=self.member_user
        )
        cart.items.add(cart_item)

        # WHEN we retrieve the cart
        url = reverse("v1:carts:cart_detail")
        response = self.member_client.get(url)

        # THEN each item should have a subtotal field
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["items"]), 1)
        item = response.data["items"][0]
        self.assertIn("subtotal", item)

    def test_cart_item_subtotal_reflects_quantity(self):
        # GIVEN a user has one item in their cart with quantity=3
        from decimal import Decimal
        cart = Cart.objects.get_user_cart(self.member_user)
        cart_item = CartItemFactory(
            product=self.product1,
            quantity=3,
            created_by=self.member_user
        )
        cart.items.add(cart_item)

        # WHEN we retrieve the cart
        url = reverse("v1:carts:cart_detail")
        response = self.member_client.get(url)

        # THEN the subtotal should equal price * quantity
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["items"]), 1)
        item = response.data["items"][0]
        expected_subtotal = Decimal(str(self.product1.price)) * 3
        self.assertEqual(Decimal(str(item["subtotal"])), expected_subtotal)


class AddToCartViewTests(BaseAPITestCase):

    def setUp(self):
        super().setUp()
        # Create a member user for authenticated tests
        self.member_user = UserFactory(
            email="member@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.MEMBER
        )
        self.member_client = self.authenticated_client
        self.member_client.force_authenticate(user=self.member_user)

        # Create test products
        self.product1 = ProductFactory(quantity=100)
        self.product2 = ProductFactory(quantity=50)
        self.product_low_stock = ProductFactory(quantity=5)

    def test_add_to_cart_success(self):
        # GIVEN an authenticated user exists
        # AND a product with sufficient stock exists

        # WHEN we make a POST request to add the product to cart
        url = reverse("v1:carts:add_to_cart")
        payload = {
            "product_id": str(self.product1.id),
            "quantity": 2,
        }
        response = self.member_client.post(url, payload)

        # THEN we should get a 201 response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # AND the cart should contain the product
        cart = Cart.objects.get_user_cart(self.member_user)
        self.assertEqual(cart.items.count(), 1)
        cart_item = cart.items.first()
        self.assertEqual(cart_item.product.id, self.product1.id)
        self.assertEqual(cart_item.quantity, 2)

    def test_add_to_cart_existing_product_updates_quantity(self):
        # GIVEN an authenticated user exists
        # AND the user already has the product in their cart
        cart = Cart.objects.get_user_cart(self.member_user)
        cart_item = CartItemFactory(
            product=self.product1,
            quantity=2,
            created_by=self.member_user
        )
        cart.items.add(cart_item)
        cart.save()

        # WHEN we make a POST request to add the same product again
        url = reverse("v1:carts:add_to_cart")
        payload = {
            "product_id": str(self.product1.id),
            "quantity": 3,
        }
        response = self.member_client.post(url, payload)

        # THEN we should get a 201 response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # AND the cart should still have only one item
        cart.refresh_from_db()
        self.assertEqual(cart.items.count(), 1)

        # AND the quantity should be updated (2 + 3 = 5)
        cart_item.refresh_from_db()
        self.assertEqual(cart_item.quantity, 5)

    def test_add_to_cart_existing_product_rejects_exceeding_stock(self):
        cart = Cart.objects.get_user_cart(self.member_user)
        cart_item = CartItemFactory(product=self.product_low_stock, quantity=4, created_by=self.member_user)
        cart.items.add(cart_item)
        response = self.member_client.post(
            reverse("v1:carts:add_to_cart"),
            {"product_id": str(self.product_low_stock.id), "quantity": 2},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_add_to_cart_invalid_product_id(self):
        # GIVEN an authenticated user exists
        # AND an invalid product ID

        # WHEN we make a POST request with an invalid product ID
        url = reverse("v1:carts:add_to_cart")
        payload = {
            "product_id": "00000000-0000-0000-0000-000000000000",
            "quantity": 1,
        }
        response = self.member_client.post(url, payload)

        # THEN we should get a 400 response
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # AND the response should contain an error message
        self.assertIn("Product does not exist", str(response.data))

    def test_update_cart_item_success(self):
        # GIVEN an authenticated user exists
        user = UserFactory(
            email="member@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.MEMBER
        )
        client = self.authenticated_client
        client.force_authenticate(user=user)
        # AND the user has an item in their cart
        cart = Cart.objects.get_user_cart(user)
        cart_item = CartItemFactory(
            product=self.product1,
            quantity=2,
            created_by=user
        )
        cart.items.add(cart_item)

        # WHEN we make a PATCH request to update the cart item
        url = reverse("v1:carts:update_cart_item", kwargs={"pk": str(cart_item.id)})
        payload = {
            "operation": "set",
            "quantity": 3,
        }
        response = client.patch(url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        cart_item.refresh_from_db()
        self.assertEqual(cart_item.quantity, 3)

    def test_update_cart_item_with_deleted_product_returns_validation_error(self):
        user = self.member_user
        cart = Cart.objects.get_user_cart(user)
        cart_item = CartItemFactory(product=self.product1, quantity=2, created_by=user)
        cart.items.add(cart_item)
        self.product1.delete()

        url = reverse("v1:carts:update_cart_item", kwargs={"pk": str(cart_item.id)})
        response = self.member_client.patch(url, {"operation": "set", "quantity": 3})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Product does not exist", str(response.data))

    def test_update_cart_item_requires_quantity_when_operation_missing(self):
        user = UserFactory(
            email="member@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.MEMBER
        )
        client = self.authenticated_client
        client.force_authenticate(user=user)
        cart = Cart.objects.get_user_cart(user)
        cart_item = CartItemFactory(
            product=self.product1,
            quantity=2,
            created_by=user
        )
        cart.items.add(cart_item)

        url = reverse("v1:carts:update_cart_item", kwargs={"pk": str(cart_item.id)})
        response = client.patch(url, {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Quantity is required for set operations", str(response.data))
        cart_item.refresh_from_db()
        self.assertEqual(cart_item.quantity, 2)

    def test_update_cart_item_validates_add_and_subtract_results(self):
        user = UserFactory(
            email="member@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.MEMBER
        )
        client = self.authenticated_client
        client.force_authenticate(user=user)
        cart = Cart.objects.get_user_cart(user)
        cart_item = CartItemFactory(
            product=self.product1,
            quantity=2,
            created_by=user
        )
        cart.items.add(cart_item)

        url = reverse("v1:carts:update_cart_item", kwargs={"pk": str(cart_item.id)})

        add_response = client.patch(url, {"operation": "add", "quantity": 200})
        self.assertEqual(add_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Quantity exceeds stock", str(add_response.data))

        subtract_response = client.patch(url, {"operation": "subtract", "quantity": 3})
        self.assertEqual(subtract_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Quantity cannot be less than 1", str(subtract_response.data))

    def test_update_cart_item_requires_quantity_for_add_or_subtract(self):
        user = UserFactory(
            email="member@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.MEMBER
        )
        client = self.authenticated_client
        client.force_authenticate(user=user)
        cart = Cart.objects.get_user_cart(user)
        cart_item = CartItemFactory(
            product=self.product1,
            quantity=2,
            created_by=user
        )
        cart.items.add(cart_item)

        url = reverse("v1:carts:update_cart_item", kwargs={"pk": str(cart_item.id)})
        response = client.patch(url, {"operation": "subtract"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Quantity is required for add and subtract operations", str(response.data))

    def test_update_cart_item_requires_quantity_for_set(self):
        user = UserFactory(
            email="member@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.MEMBER
        )
        client = self.authenticated_client
        client.force_authenticate(user=user)
        cart = Cart.objects.get_user_cart(user)
        cart_item = CartItemFactory(
            product=self.product1,
            quantity=2,
            created_by=user
        )
        cart.items.add(cart_item)

        url = reverse("v1:carts:update_cart_item", kwargs={"pk": str(cart_item.id)})
        response = client.patch(url, {"operation": "set"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Quantity is required for set operations", str(response.data))
        cart_item.refresh_from_db()
        self.assertEqual(cart_item.quantity, 2)

    def test_update_cart_item_rejects_empty_patch_body(self):
        user = UserFactory(
            email="member@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.MEMBER
        )
        client = self.authenticated_client
        client.force_authenticate(user=user)
        cart = Cart.objects.get_user_cart(user)
        cart_item = CartItemFactory(
            product=self.product1,
            quantity=2,
            created_by=user
        )
        cart.items.add(cart_item)

        url = reverse("v1:carts:update_cart_item", kwargs={"pk": str(cart_item.id)})
        response = client.patch(url, {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Quantity is required for set operations", str(response.data))
        cart_item.refresh_from_db()
        self.assertEqual(cart_item.quantity, 2)

class AddToWishlistViewTests(BaseAPITestCase):

    def setUp(self):
        super().setUp()
        # Create a member user for authenticated tests
        self.member_user = UserFactory(
            email="member@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.MEMBER
        )

        self.member_client = self.authenticated_client
        self.member_client.force_authenticate(user=self.member_user)

    def test_add_to_wishlist_success(self):
        # GIVEN an authenticated user exists
        # AND a product exists
        product = ProductFactory()

        # WHEN we make a POST request to add the product to wishlist
        url = reverse("v1:wishlist:add_to_wishlist")
        payload = {
            "product_ids": [str(product.id)],
        }

        response = self.member_client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # THEN the product should be in the wishlist
        wishlist = Wishlist.objects.get_user_wishlist(self.member_user)
        self.assertEqual(wishlist.products.count(), 1)
        self.assertEqual(wishlist.products.first().id, product.id)

    def test_wishlist_list_returns_product_count(self):
        # GIVEN a user has 2 products in their wishlist
        wishlist = Wishlist.objects.get_user_wishlist(self.member_user)
        product1 = ProductFactory()
        product2 = ProductFactory()
        product3 = ProductFactory()  # not added to wishlist
        wishlist.products.add(product1, product2)

        # WHEN we list wishlist products
        url = reverse("v1:wishlist:wishlist_detail")
        response = self.member_client.get(url)

        # THEN the response should include a product_count field
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("product_count", response.data)
        self.assertEqual(response.data["product_count"], 2)
        self.assertIn("results", response.data)
        self.assertEqual(len(response.data["results"]), 2)
        result_ids = [r["id"] for r in response.data["results"]]
        self.assertNotIn(str(product3.id), result_ids)

    def test_wishlist_product_count_is_zero_for_empty_wishlist(self):
        # GIVEN a user has an empty wishlist

        # WHEN we list wishlist products
        url = reverse("v1:wishlist:wishlist_detail")
        response = self.member_client.get(url)

        # THEN product_count should be 0
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("product_count", response.data)
        self.assertEqual(response.data["product_count"], 0)
        self.assertIn("results", response.data)
        self.assertEqual(len(response.data["results"]), 0)




class RemoveFromWishlistViewTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        # Create a member user for authenticated tests
        self.member_user = UserFactory(
            email="member@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.MEMBER
        )

        self.member_client = self.authenticated_client
        self.member_client.force_authenticate(user=self.member_user)

   
    def test_remove_from_wishlist_success(self):
        # GIVEN an authenticated user exists
        # AND the user has a product in their wishlist
        wishlist = Wishlist.objects.get_user_wishlist(self.member_user)
        product = ProductFactory()
        wishlist.products.add(product)

        # WHEN we make a POST request to remove the product from wishlist
        url = reverse("v1:wishlist:remove_from_wishlist")
        payload = {
            "product_ids": [str(product.id)]
        }
        response = self.member_client.post(url, payload)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND the product should be removed from the wishlist
        wishlist.refresh_from_db()
        self.assertEqual(wishlist.products.count(), 0)


class AdminCartTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.admin = UserFactory(
            email="cartadmin@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.ADMIN
        )
        # Create a cart for the admin with items
        self.product = ProductFactory(name="Admin Cart Product")
        Cart.objects.add_to_cart(self.admin, self.product, 2)

    def test_admin_list_carts(self):
        self.authenticated_client.force_authenticate(user=self.admin)
        url = reverse("v1:carts:admin_cart_list")
        response = self.authenticated_client.get(url)
        self.assertEqual(response.status_code, 200)
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        # Verify the admin's cart is present with the expected item
        cart_user_ids = [str(cart['user']) for cart in results]
        self.assertIn(str(self.admin.id), cart_user_ids)
        admin_cart = next(c for c in results if str(c['user']) == str(self.admin.id))
        item_product_ids = [str(item['product']['id']) for item in admin_cart['items'] if item.get('product')]
        self.assertIn(str(self.product.id), item_product_ids)

    def test_admin_list_carts_non_admin_forbidden(self):
        self.authenticated_client.force_authenticate(user=self.user)
        url = reverse("v1:carts:admin_cart_list")
        response = self.authenticated_client.get(url)
        self.assertEqual(response.status_code, 403)


class AdminWishlistListViewTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.admin_user = UserFactory(role=User.Role.ADMIN)
        self.regular_user = UserFactory(role=User.Role.MEMBER)
        
        # Give admin a wishlist
        self.admin_wishlist = Wishlist.objects.get_user_wishlist(self.admin_user)
        self.admin_wishlist.products.add(ProductFactory(), ProductFactory())
        
        # Give regular user a wishlist
        self.regular_wishlist = Wishlist.objects.get_user_wishlist(self.regular_user)
        self.regular_wishlist.products.add(ProductFactory())
        
        self.url = reverse('v1:carts:admin_wishlist_list')
        
    def test_admin_can_list_all_wishlists(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data) if isinstance(response.data, dict) else response.data
        wishlist_ids = [str(r['id']) for r in results]
        self.assertIn(str(self.admin_wishlist.id), wishlist_ids)
        self.assertIn(str(self.regular_wishlist.id), wishlist_ids)
        
    def test_regular_user_cannot_list_wishlists(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
    def test_unauthenticated_cannot_list_wishlists(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
