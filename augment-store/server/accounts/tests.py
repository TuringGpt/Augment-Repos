from core.tests import BaseAPITestCase
from accounts.factory import UserFactory
from rest_framework import status
from django.urls import reverse


class UserProfileTests(BaseAPITestCase):

    def test_get_user_profile_authenticated(self):
        # GIVEN an authenticated user exists
        user = UserFactory(
            email="testuser@example.com",
            first_name="John",
            last_name="Doe",
            username="johndoe",
            mobile="1234567890",
            gender="Male",
            is_active=True
        )

        # WHEN we make a GET request to retrieve the user profile
        self.authenticated_client.force_authenticate(user=user)
        url = reverse("v1:user_profile")
        response = self.authenticated_client.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND the response should contain the user profile data
        self.assertEqual(response.data["email"], "testuser@example.com")
        self.assertEqual(response.data["first_name"], "John")
        self.assertEqual(response.data["last_name"], "Doe")
        self.assertEqual(response.data["username"], "johndoe")
        self.assertEqual(response.data["mobile"], "1234567890")
        self.assertEqual(response.data["gender"], "Male")
        self.assertEqual(response.data["full_name"], "John Doe")
        self.assertIn("id", response.data)
        self.assertIn("date_joined", response.data)
        self.assertIn("preferred_currency", response.data)

    def test_get_user_profile_unauthenticated(self):
        # GIVEN an unauthenticated user
        # WHEN we make a GET request to retrieve the user profile
        url = reverse("v1:user_profile")
        response = self.client.get(url)

        # THEN we should get a 401 Unauthorized response
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_user_profile_authenticated(self):
        # GIVEN an authenticated user exists
        user = UserFactory(
            email="testuser@example.com",
            first_name="John",
            last_name="Doe",
            username="johndoe",
            is_active=True
        )

        # WHEN we make a PATCH request to update the user profile
        self.authenticated_client.force_authenticate(user=user)
        url = reverse("v1:user_profile")
        payload = {
            "first_name": "Jane",
            "last_name": "Smith",
            "username": "janesmith",
            "mobile": "9876543210",
            "gender": "Female"
        }
        response = self.authenticated_client.patch(url, payload)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND the user profile should be updated
        user.refresh_from_db()
        self.assertEqual(user.first_name, "Jane")
        self.assertEqual(user.last_name, "Smith")
        self.assertEqual(user.username, "janesmith")
        self.assertEqual(user.mobile, "9876543210")
        self.assertEqual(user.gender, "Female")

    def test_update_user_profile_partial(self):
        # GIVEN an authenticated user exists
        user = UserFactory(
            email="testuser@example.com",
            first_name="John",
            last_name="Doe",
            username="johndoe",
            is_active=True
        )

        # WHEN we make a PATCH request to update only some fields
        self.authenticated_client.force_authenticate(user=user)
        url = reverse("v1:user_profile")
        payload = {
            "first_name": "Jane"
        }
        response = self.authenticated_client.patch(url, payload)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND only the specified field should be updated
        user.refresh_from_db()
        self.assertEqual(user.first_name, "Jane")
        self.assertEqual(user.last_name, "Doe")  # Should remain unchanged
        self.assertEqual(user.username, "johndoe")  # Should remain unchanged

    def test_update_user_profile_unauthenticated(self):
        # GIVEN an unauthenticated user
        # WHEN we make a PATCH request to update the user profile
        url = reverse("v1:user_profile")
        payload = {
            "first_name": "Jane"
        }
        response = self.client.patch(url, payload)

        # THEN we should get a 401 Unauthorized response
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_user_profile_readonly_fields(self):
        # GIVEN an authenticated user exists
        user = UserFactory(
            email="testuser@example.com",
            first_name="John",
            last_name="Doe",
            is_active=True
        )
        original_email = user.email
        original_role = user.role

        # WHEN we try to update read-only fields like email and role
        self.authenticated_client.force_authenticate(user=user)
        url = reverse("v1:user_profile")
        payload = {
            "email": "newemail@example.com",
            "role": "admin",
            "first_name": "Jane"
        }
        response = self.authenticated_client.patch(url, payload)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND the read-only fields should not be updated
        user.refresh_from_db()
        self.assertEqual(user.email, original_email)  # Should remain unchanged
        self.assertEqual(user.role, original_role)  # Should remain unchanged
        self.assertEqual(user.first_name, "Jane")  # Should be updated

    def test_update_user_profile_invalid_mobile(self):
        # GIVEN an authenticated user exists
        user = UserFactory(
            email="testuser@example.com",
            first_name="John",
            last_name="Doe",
            is_active=True
        )

        # WHEN we try to update with an invalid mobile number (too long)
        self.authenticated_client.force_authenticate(user=user)
        url = reverse("v1:user_profile")
        payload = {
            "mobile": "1" * 25  # More than 20 characters
        }
        response = self.authenticated_client.patch(url, payload)

        # THEN we should get a 400 Bad Request response
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("mobile", response.data)

    def test_user_profile_caching(self):
        from django.core.cache import cache
        cache.clear()

        # GIVEN an authenticated user exists
        user = UserFactory(email="cachetest@example.com")
        self.authenticated_client.force_authenticate(user=user)
        url = reverse("v1:user_profile")

        # WHEN we fetch the profile for the first time
        # SHOULD hit the database (queries > 0)
        with self.assertNumQueries(1):
            response1 = self.authenticated_client.get(url)
            self.assertEqual(response1.status_code, status.HTTP_200_OK)

        # AND we fetch the profile again
        # SHOULD be cached (0 database queries)
        with self.assertNumQueries(0):
            response2 = self.authenticated_client.get(url)
            self.assertEqual(response2.status_code, status.HTTP_200_OK)
            self.assertEqual(response1.data, response2.data)

        # WHEN we update the profile
        payload = {"first_name": "NewName"}
        response_update = self.authenticated_client.patch(url, payload)
        self.assertEqual(response_update.status_code, status.HTTP_200_OK)

        # THEN fetching the profile again SHOULD hit the database again (cache invalidated)
        with self.assertNumQueries(1):
            response3 = self.authenticated_client.get(url)
            self.assertEqual(response3.status_code, status.HTTP_200_OK)
            self.assertEqual(response3.data["first_name"], "NewName")
