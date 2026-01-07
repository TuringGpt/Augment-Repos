import uuid

from django.urls import reverse

from accounts.factory import UserFactory
from core.tests import BaseAPITestCase
from newsletter.factory import NewsletterFactory


# Create your tests here.
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
        self.newsletter = NewsletterFactory(
            id=self.newsletter_id,
            email="test@example.com",
        )

    def test_subscribe_newsletter(self):
        url = reverse("v1:create_newsletter")
        self.authenticated_client.force_authenticate(user=self.user)
        payload = {
            "email": "newsubscriber@example.com",
        }
        response = self.authenticated_client.post(url, payload)
        self.assertEqual(response.status_code, 201)

    def test_unsubscribe_newsletter(self):
        url = reverse("v1:unsubscribe_newsletter", kwargs={"pk": str(self.newsletter_id)})
        self.authenticated_client.force_authenticate(user=self.user)
        response = self.authenticated_client.patch(url)
        self.assertEqual(response.status_code, 200 )

    def test_unsubscribe_newsletter_by_email(self):
        url = reverse("v1:unsubscribe_newsletter_by_email")
        self.authenticated_client.force_authenticate(user=self.user)
        payload = {
            "email": "test@example.com",
        }
        response = self.authenticated_client.patch(url, payload)
        self.assertEqual(response.status_code, 200)
        # Verify the newsletter is now inactive
        self.newsletter.refresh_from_db()
        self.assertFalse(self.newsletter.is_active)

    def test_unsubscribe_newsletter_by_email_missing_email(self):
        url = reverse("v1:unsubscribe_newsletter_by_email")
        self.authenticated_client.force_authenticate(user=self.user)
        payload = {}
        response = self.authenticated_client.patch(url, payload)
        self.assertEqual(response.status_code, 400)

    def test_unsubscribe_newsletter_by_email_not_found(self):
        url = reverse("v1:unsubscribe_newsletter_by_email")
        self.authenticated_client.force_authenticate(user=self.user)
        payload = {
            "email": "nonexistent@example.com",
        }
        response = self.authenticated_client.patch(url, payload)
        self.assertEqual(response.status_code, 404)

    def test_list_newsletter_unauthenticated(self):
        url = reverse("v1:newsletter")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 401)
        return

