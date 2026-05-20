from core.tests import BaseAPITestCase
from accounts.factory import UserFactory
from rest_framework import status
from django.urls import reverse
from django.test import override_settings
from accounts.models import User


class AuthenticationTests(BaseAPITestCase):

    def setUp(self):
        super().setUp()

    def test_register(self):
        # GIVEN a user does not exist
        # WHEN we make a post request to /auth/register/ with valid data
        url = reverse("v1:register")
        payload = {
            "email": "test@example.com",
            "password": "testpassword",
            "first_name": "Test",
            "last_name": "User",
        }
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, 201)

    @override_settings(DISABLE_EMAIL_VERIFICATION=True)
    def test_create_user_when_verification_disabled(self):
        # GIVEN verification is disabled
        # WHEN we create a user
        url = reverse("v1:register")
        payload = {
            "email": "test@example.com",
            "password": "testpassword",
            "first_name": "Test",
            "last_name": "User",
        }
        response = self.client.post(url, payload)

        user = User.objects.get(email="test@example.com")
        # THEN the user should be active
        self.assertTrue(user.is_active)

    @override_settings(DISABLE_EMAIL_VERIFICATION=False)
    def test_create_user_when_verification_enabled(self):
        # GIVEN verification is enabled
        # WHEN we create a user
        url = reverse("v1:register")
        payload = {
            "email": "test@example.com",
            "password": "testpassword",
            "first_name": "Test",
            "last_name": "User",
        }
        response = self.client.post(url, payload)
        user = User.objects.get(email="test@example.com")

        # THEN the user should not be active
        self.assertFalse(user.is_active)


    def test_active_user_login(self):
        # GIVEN a user with email:user@demo.com and passowrd:asdf1234 exist
        UserFactory(email="user@demo.com", password="asdf1234", is_active=True)

        # WHEN we make a post request to login with the user credentials
        url = reverse("v1:login")
        payload = {
            "email": "user@demo.com",
            "password": "asdf1234",
        }
        response = self.client.post(url, payload)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # AND the response should contain access and refresh tokens
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_normalizes_email_whitespace_and_case(self):
        UserFactory(email="user@demo.com", password="asdf1234", is_active=True)

        url = reverse("v1:login")
        payload = {
            "email": "  USER@DEMO.COM  ",
            "password": "asdf1234",
        }
        response = self.client.post(url, payload)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_inactive_user_login(self):
        # GIVEN a user with email:user@demo.com and passowrd:asdf1234 exist
        UserFactory(email="user@demo.com", password="asdf1234", is_active=False)

        # WHEN we make a post request to login with the user credentials
        url = reverse("v1:login")

        payload = {
            "email": "user@demo.com",
            "password": "asdf1234",
        }
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # THEN we should get a 401 response
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        # AND the response should contain error message
        self.assertEqual(response.data["detail"], "User is not active")
        # AND the response should not contain access and refresh tokens
        self.assertNotIn("access", response.data)
        self.assertNotIn("refresh", response.data)

    def test_invalid_user_login(self):
        # GIVEN a user with email:user@demo.com and passowrd:asdf1234 exist
        UserFactory(email="user@demo.com", password="asdf1234", is_active=True)

        # WHEN we make a post request to login with the user credentials
        url = reverse("v1:login")

        payload = {
            "email": "user@demo.com",
            "password": "wrongpassword",
        }
        response = self.client.post(url, payload)

        # THEN we should get a 401 response
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # AND the response should contain error message
        self.assertEqual(response.data["detail"], "Invalid credentials")

        # AND the response should not contain access and refresh tokens
        self.assertNotIn("access", response.data)
        self.assertNotIn("refresh", response.data)

    def test_refresh_token(self):
        # GIVEN a user with email:user@demo.com and passowrd:asdf1234 exist
        user = UserFactory(email="user@demo.com", password="asdf1234", is_active=True)
        # AND the user has a refresh token
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)

        # WHEN we make a post request to refresh token with the refresh token
        url = reverse("v1:refresh_token")
        payload = {
            "refresh": str(refresh),
        }
        response = self.client.post(url, payload)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # AND the response should contain access and refresh tokens
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_invalid_refresh_token(self):
        # GIVEN a user with email:user@demo.com and passowrd:asdf1234 exist
        UserFactory(email="user@demo.com", password="asdf1234", is_active=True)

        # WHEN we make a post request to refresh token with the refresh token
        url = reverse("v1:refresh_token")
        payload = {
            "refresh": "invalidrefresh",
        }
        response = self.client.post(url, payload)

        # THEN we should get a 401 response
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        # AND the response should contain error message
        self.assertEqual(response.data["detail"], "Invalid refresh token")

    def test_forgot_password(self):
        # GIVEN a user with email:user@demo.com and passowrd:asdf1234 exist
        UserFactory(email="user@demo.com", password="asdf1234", is_active=True)
        # WHEN we make a post request to forgot password with the user email
        url = reverse("v1:forgot_password")
        payload = {
            "email": "user@demo.com",
        }
        response = self.client.post(url, payload)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # AND the response should contain success message
        self.assertEqual(response.data["message"], "Password reset email sent")

    def test_logout(self):
        # GIVEN a user with email:user@demo.com and passowrd:asdf1234 exist
        user = UserFactory(email="user@demo.com", password="asdf1234", is_active=True)
        # AND the user is logged in
        self.client.force_authenticate(user=user)

        # WHEN we make a post request to logout
        url = reverse("v1:logout")
        response = self.client.post(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND the response should contain success message
        self.assertEqual(response.data["message"], "Logged out")
