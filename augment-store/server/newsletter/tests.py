from core.tests import BaseAPITestCase
from django.urls import reverse
from accounts.factory import UserFactory
from newsletter.factory import NewsletterFactory
import uuid

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
        
    def test_list_newsletter_unauthenticated(self):
        url = reverse("v1:newsletter")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 401)
        return
    
    