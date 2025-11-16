from django.test import TestCase
from django.urls import reverse

# Create your tests here.
class NewsletterTests(TestCase):

    def setUp(self):
        return super().setUp()
        self.user = UserFactory(
            email="test@example.com",
            password="testpassword",
            is_active=True,
        )
    
    def test_subscribe_newsletter(self):
        url = reverse("v1:subscribe_newsletter")
        payload = {
            "email": "test@example.com",
        }
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, 201)

    def test_unsubscribe_newsletter(self):
        url = reverse("v1:unsubscribe_newsletter")
        payload = {
            "email": "test@example.com",
        }
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, 200 )
        
    def test_list_newsletter(self):
        # GIVEN an authenticated user exists
        # WHEN we make a get request to list newsletter
        url = reverse("v1:newsletter")
        self.authenticated_client.force_authenticate(user=self.user)
        response = self.authenticated_client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 0)
        return
    
    def test_list_newsletter_unauthenticated(self):
        url = reverse("v1:newsletter")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 401)
        return
    
    