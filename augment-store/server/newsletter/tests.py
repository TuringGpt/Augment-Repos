from core.tests import BaseAPITestCase
from django.urls import reverse
from accounts.factory import UserFactory
from newsletter.factory import NewsletterFactory
from newsletter.models import Newsletter
import uuid

class NewsletterTests(BaseAPITestCase):

    def setUp(self):
        super().setUp()
        self.newsletter_id = uuid.uuid4()
        self.id = uuid.uuid4()
        self.user = UserFactory(
            id=self.id,
            first_name="Test",
            email="test@example.com",
            password="testpassword",
            is_active=True,
        )
        self.authenticated_client.force_authenticate(user=self.user)
        self.newsletter = NewsletterFactory(
            id=self.newsletter_id,
            email="test@example.com",
        )
    
    def test_subscribe_newsletter(self):
        url = reverse("v1:create_newsletter")
        payload = {
            "email": "newsubscriber@example.com",
        }
        response = self.authenticated_client.post(url, payload)
        self.assertEqual(response.status_code, 201)
        self.assertIn("email", response.data)

    def test_subscribe_newsletter_reactivates(self):
        inactive = NewsletterFactory(email="inactive@example.com", is_active=False)
        url = reverse("v1:create_newsletter")
        payload = {
            "email": "inactive@example.com",
        }
        response = self.authenticated_client.post(url, payload)
        self.assertEqual(response.status_code, 201)
        inactive.refresh_from_db()
        self.assertTrue(inactive.is_active)

    def test_subscribe_newsletter_normalizes_email(self):
        url = reverse("v1:create_newsletter")
        payload = {
            "email": "  UpperCase@Example.COM  ",
        }
        response = self.authenticated_client.post(url, payload)
        self.assertEqual(response.status_code, 201)
        self.assertTrue(Newsletter.objects.filter(email="uppercase@example.com").exists())

    def test_unsubscribe_newsletter(self):
        url = reverse("v1:unsubscribe_newsletter", kwargs={"pk": str(self.newsletter_id)})
        response = self.authenticated_client.patch(url)
        self.assertEqual(response.status_code, 200)
        self.newsletter.refresh_from_db()
        self.assertFalse(self.newsletter.is_active)

    def test_unsubscribe_newsletter_by_email(self):
        url = reverse("v1:unsubscribe_newsletter_by_email")
        payload = {
            "email": "test@example.com",
        }
        response = self.authenticated_client.patch(url, payload)
        self.assertEqual(response.status_code, 200)
        self.newsletter.refresh_from_db()
        self.assertFalse(self.newsletter.is_active)

    def test_unsubscribe_newsletter_by_email_missing_email(self):
        url = reverse("v1:unsubscribe_newsletter_by_email")
        payload = {}
        response = self.authenticated_client.patch(url, payload)
        self.assertEqual(response.status_code, 400)

    def test_unsubscribe_newsletter_by_email_not_found(self):
        url = reverse("v1:unsubscribe_newsletter_by_email")
        payload = {
            "email": "nonexistent@example.com",
        }
        response = self.authenticated_client.patch(url, payload)
        self.assertEqual(response.status_code, 404)

    def test_list_newsletter_unauthenticated(self):
        url = reverse("v1:newsletter")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 401)

    def test_list_newsletter_authenticated(self):
        url = reverse("v1:newsletter")
        response = self.authenticated_client.get(url)
        self.assertEqual(response.status_code, 200)
        results = response.data.get("results", [])
        self.assertGreaterEqual(len(results), 1)

    def test_newsletter_status_subscribed(self):
        url = reverse("v1:newsletter_status")
        response = self.authenticated_client.get(url, {"email": "test@example.com"})
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["is_subscribed"])

    def test_newsletter_status_not_subscribed(self):
        url = reverse("v1:newsletter_status")
        response = self.authenticated_client.get(url, {"email": "nobody@example.com"})
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["is_subscribed"])

    def test_newsletter_status_missing_email(self):
        url = reverse("v1:newsletter_status")
        response = self.authenticated_client.get(url)
        self.assertEqual(response.status_code, 400)