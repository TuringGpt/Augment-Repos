from core.tests import BaseAPITestCase
from accounts.factory import UserFactory
from accounts.models import User
from rest_framework import status
from django.urls import reverse
from products.factory import ProductFactory
from carts.models import Cart, Wishlist
from carts.factory import CartItemFactory, CartFactory


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
        self.assertEqual(wishlist.products.count(), 2)
        self.assertEqual(wishlist.products.first().id, product.id)