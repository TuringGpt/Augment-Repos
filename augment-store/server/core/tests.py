
from rest_framework.test import APITestCase
from rest_framework.test import APIClient
from accounts.factory import UserFactory


class BaseAPITestCase(APITestCase):
    # this class setup basic client 
    client = None
    authenticated_client = None
    user = None

    def setUp(self):
        super().setUp()
        self.user = UserFactory()
        self.client = APIClient()
        self.authenticated_client = APIClient()
        self.authenticated_client.force_authenticate(user=self.user)
