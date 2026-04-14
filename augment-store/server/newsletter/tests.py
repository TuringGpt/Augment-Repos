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
        from newsletter.views import NewsletterStatusCacheService, NewsletterCacheService, AdminNewsletterCacheService
        NewsletterStatusCacheService().clear_namespace()
        NewsletterCacheService().clear_namespace()
        AdminNewsletterCacheService().clear_namespace()
    
    def test_subscribe_newsletter(self):
        url = reverse("v1:create_newsletter")
        payload = {
            "email": "newsubscriber@example.com",
        }
        response = self.authenticated_client.post(url, payload)
        self.assertEqual(response.status_code, 201)
        self.assertIn("email", response.data)

    def test_subscribe_newsletter_reactivates(self):
        NewsletterFactory(email="inactive@example.com", is_active=False)
        url = reverse("v1:create_newsletter")
        payload = {
            "email": "inactive@example.com",
        }
        response = self.authenticated_client.post(url, payload)
        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.data)

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

    def test_unsubscribe_newsletter_other_user_forbidden(self):
        other = NewsletterFactory(email="other@example.com")
        url = reverse("v1:unsubscribe_newsletter", kwargs={"pk": str(other.id)})
        response = self.authenticated_client.patch(url)
        self.assertEqual(response.status_code, 404)
        other.refresh_from_db()
        self.assertTrue(other.is_active)

    def test_unsubscribe_newsletter_normalizes_authenticated_user_email(self):
        self.user.email = "  TEST@Example.COM  "
        self.user.save(update_fields=["email"])
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

    def test_unsubscribe_newsletter_by_email_other_user_forbidden(self):
        NewsletterFactory(email="other@example.com")
        url = reverse("v1:unsubscribe_newsletter_by_email")
        response = self.authenticated_client.patch(url, {"email": "other@example.com"})
        self.assertEqual(response.status_code, 404)

    def test_unsubscribe_newsletter_by_email_normalizes_authenticated_user_email(self):
        self.user.email = "  TEST@Example.COM  "
        self.user.save(update_fields=["email"])
        url = reverse("v1:unsubscribe_newsletter_by_email")
        response = self.authenticated_client.patch(url, {"email": "test@example.com"})
        self.assertEqual(response.status_code, 200)
        self.newsletter.refresh_from_db()
        self.assertFalse(self.newsletter.is_active)

    def test_list_newsletter_unauthenticated(self):
        url = reverse("v1:newsletter")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 401)

    def test_list_newsletter_response_fields(self):
        url = reverse("v1:newsletter")
        admin = UserFactory(role="admin", email="admin-list@example.com")
        self.authenticated_client.force_authenticate(user=admin)
        response = self.authenticated_client.get(url)
        self.assertEqual(response.status_code, 200)
        results = response.data.get("results", [])
        self.assertGreater(len(results), 0)
        result = results[0]
        self.assertIn("id", result)
        self.assertIn("email", result)
        self.assertIn("is_active", result)
        self.assertIn("created_at", result)

    def test_unsubscribe_response_includes_is_active(self):
        url = reverse("v1:unsubscribe_newsletter", kwargs={"pk": str(self.newsletter_id)})
        self.authenticated_client.force_authenticate(user=self.user)
        response = self.authenticated_client.patch(url)
        self.assertEqual(response.status_code, 200)
        self.assertIn("is_active", response.data)
        self.assertFalse(response.data["is_active"])

    def test_list_newsletter_authenticated(self):
        url = reverse("v1:newsletter")
        response = self.authenticated_client.get(url)
        self.assertEqual(response.status_code, 403)

    def test_newsletter_status_subscribed(self):
        url = reverse("v1:newsletter_status")
        response = self.authenticated_client.get(url, {"email": "test@example.com"})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["is_subscribed"])

    def test_newsletter_status_not_subscribed(self):
        url = reverse("v1:newsletter_status")
        response = self.authenticated_client.get(url, {"email": "nobody@example.com"})
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["is_subscribed"])

    def test_newsletter_status_missing_email(self):
        url = reverse("v1:newsletter_status")
        response = self.authenticated_client.get(url)
        self.assertEqual(response.status_code, 400)

    def test_subscribe_newsletter_anonymous(self):
        url = reverse("v1:create_newsletter")
        payload = {
            "email": "anonymous@example.com",
        }
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, 201)
        self.assertTrue(Newsletter.objects.filter(email="anonymous@example.com").exists())

    def test_admin_list_newsletter(self):
        url = reverse("v1:admin_newsletter_list")
        
        # Regular user fails
        response = self.authenticated_client.get(url)
        self.assertEqual(response.status_code, 403)
        
        # Admin user succeeds
        admin = UserFactory(role="admin", email="admin@example.com")
        self.authenticated_client.force_authenticate(user=admin)
        response = self.authenticated_client.get(url)
        self.assertEqual(response.status_code, 200)
        
        # We want to test that adding an inactive subscription manually invalidates the admin list cache.
        # We'll use the API instead of NewsletterFactory to trigger the cache invalidation logic.
        subscribe_url = reverse("v1:create_newsletter")
        sub_resp = self.authenticated_client.post(subscribe_url, {"email": "inactive2@example.com"})
        self.assertEqual(sub_resp.status_code, 201)
        
        unsubscribe_url = reverse("v1:unsubscribe_newsletter_by_email")
        unsub_resp = self.authenticated_client.patch(unsubscribe_url, {"email": "inactive2@example.com"})
        self.assertEqual(unsub_resp.status_code, 200)
        
        response = self.authenticated_client.get(url)
        # Assert the response shape to ensure we're dealing with a list
        if isinstance(response.data, dict) and 'results' in response.data:
            results = response.data['results']
        else:
            results = response.data
        self.assertIsInstance(results, list, "API response or results should be a list")
        self.assertGreaterEqual(len(results), 2)
        
        # Verify the record is actually in the list and inactive
        inactive_record = next((r for r in results if r['email'] == "inactive2@example.com"), None)
        self.assertIsNotNone(inactive_record, "Expected cache to invalidate and return the new user")
        self.assertFalse(inactive_record['is_active'], "Expected user to be inactive via API")

    def test_admin_update_newsletter(self):
        url = reverse("v1:admin_newsletter_update", kwargs={"pk": str(self.newsletter_id)})
        
        # Regular user fails
        response = self.authenticated_client.patch(url, {"is_active": False})
        self.assertEqual(response.status_code, 403)
        
        # Admin user succeeds
        admin = UserFactory(role="admin", email="admin2@example.com")
        self.authenticated_client.force_authenticate(user=admin)
        response = self.authenticated_client.patch(url, {"is_active": False})
        self.assertEqual(response.status_code, 200)
        self.newsletter.refresh_from_db()
        self.assertFalse(self.newsletter.is_active)

    def test_admin_update_invalidates_public_cache(self):
        public_url = reverse("v1:newsletter")
        admin = UserFactory(role="admin", email="admin3@example.com")
        self.authenticated_client.force_authenticate(user=admin)
        self.authenticated_client.get(public_url) # Prime public list cache
        
        update_url = reverse("v1:admin_newsletter_update", kwargs={"pk": str(self.newsletter_id)})
        self.authenticated_client.force_authenticate(user=admin)
        patch_resp = self.authenticated_client.patch(update_url, {"is_active": False})
        self.assertEqual(patch_resp.status_code, 200, "Admin PATCH should succeed")
        
        self.authenticated_client.force_authenticate(user=admin)
        response = self.authenticated_client.get(public_url)
        if isinstance(response.data, dict) and 'results' in response.data:
            results = response.data['results']
        else:
            results = response.data
        self.assertIsInstance(results, list, "API response or results should be a list")
        
        is_present = any(r['id'] == str(self.newsletter_id) for r in results)
        self.assertFalse(is_present)
