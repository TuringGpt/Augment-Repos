from core.tests import BaseAPITestCase
from django.urls import reverse
from rest_framework import status
from notifications.factories import NotificationFactory

class NotificationTests(BaseAPITestCase):
    def test_list_notifications(self):
        # GIVEN an authenticated user exists 
        self.authenticated_client.force_authenticate(user=self.user)
        # AND the user has notifications
        NotificationFactory(user=self.user)
        NotificationFactory(user=self.user)

        # WHEN we make a get request to list notifications
        url = reverse("v1:notifications:list_notification")
        response = self.authenticated_client.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND the response should contain the notifications
        self.assertEqual(len(response.data.get("results", [])), 2)
