from core.tests import BaseAPITestCase
from accounts.factory import UserFactory
from accounts.models import User
from rest_framework import status
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from storage.models import File
from django.test import override_settings
from django.conf import settings
import os


@override_settings(
    FILE_UPLOAD_STORAGE='local',
    MEDIA_ROOT=os.path.join(settings.BASE_DIR, 'test_media'),
    DEFAULT_FILE_STORAGE='django.core.files.storage.FileSystemStorage',
    APP_DOMAIN='http://testserver'
)
class StorageTests(BaseAPITestCase):

    def setUp(self):
        super().setUp()
        # Create a merchant user for authenticated tests
        self.merchant_user = UserFactory(
            email="merchant@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.MERCHANT
        )
        self.merchant_client = self.authenticated_client
        self.merchant_client.force_authenticate(user=self.merchant_user)

        # Create a member user for permission tests
        self.member_user = UserFactory(
            email="member@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.MEMBER
        )

    def test_start_direct_upload_success(self):
        # GIVEN a merchant user is authenticated
        # WHEN we make a post request to start direct upload with valid data
        url = reverse("v1:storage:start_direct_upload")
        payload = {
            "original_file_name": "test_image.jpg",
            "file_type": "image/jpeg",
        }
        response = self.merchant_client.post(url, payload)

        # THEN we should get a 201 response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # AND a File object should be created in the database
        self.assertTrue(File.objects.filter(original_file_name="test_image.jpg").exists())

    def test_start_direct_upload_unauthenticated(self):
        # GIVEN a user is not authenticated
        # WHEN we make a post request to start direct upload
        url = reverse("v1:storage:start_direct_upload")
        payload = {
            "original_file_name": "test_image.jpg",
            "file_type": "image/jpeg",
        }
        response = self.client.post(url, payload)

        # THEN we should get a 401 response
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_start_direct_upload_member_role_success(self):
        # GIVEN a member user is authenticated
        member_client = self.authenticated_client
        member_client.force_authenticate(user=self.member_user)

        # WHEN we make a post request to start direct upload
        url = reverse("v1:storage:start_direct_upload")
        payload = {
            "original_file_name": "test_image.jpg",
            "file_type": "image/jpeg",
        }
        response = member_client.post(url, payload)

        # THEN we should get a 201 response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # AND a File object should be created in the database
        self.assertTrue(File.objects.filter(original_file_name="test_image.jpg").exists())

    def test_start_direct_upload_missing_fields(self):
        # GIVEN a merchant user is authenticated
        # WHEN we make a post request with missing required fields
        url = reverse("v1:storage:start_direct_upload")
        payload = {
            "original_file_name": "test_image.jpg",
            # missing file_type
        }
        response = self.merchant_client.post(url, payload)

        # THEN we should get a 400 response
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_direct_local_upload_success(self):
        # GIVEN a merchant user is authenticated
        # AND a file record exists in the database
        file_record = File.objects.create(
            original_file_name="test_upload.jpg",
            file_name="test_upload_123.jpg",
            file_type="image/jpeg",
            created_by=self.merchant_user
        )

        # WHEN we make a post request to upload the actual file
        url = reverse("v1:storage:direct_local_upload", kwargs={"file_id": str(file_record.id)})
        test_file = SimpleUploadedFile(
            "test_upload.jpg",
            b"file_content",
            content_type="image/jpeg"
        )
        payload = {
            "file": test_file,
            "file_id": str(file_record.id),
        }
        response = self.merchant_client.post(url, payload, format='multipart')

        # THEN we should get a 201 response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # AND the file record should be updated with the file
        file_record.refresh_from_db()
        self.assertIsNotNone(file_record.file)

    def test_direct_local_upload_unauthenticated(self):
        # GIVEN a user is not authenticated
        # AND a file record exists
        file_record = File.objects.create(
            original_file_name="test_upload.jpg",
            file_name="test_upload_123.jpg",
            file_type="image/jpeg",
            created_by=self.merchant_user
        )

        # WHEN we make a post request to upload the actual file
        url = reverse("v1:storage:direct_local_upload", kwargs={"file_id": str(file_record.id)})
        test_file = SimpleUploadedFile(
            "test_upload.jpg",
            b"file_content",
            content_type="image/jpeg"
        )
        payload = {
            "file": test_file,
            "file_id": str(file_record.id),
        }
        response = self.client.post(url, payload, format='multipart')

        # THEN we should get a 401 response
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_direct_local_upload_member_role_success(self):
        # GIVEN a member user is authenticated
        member_client = self.authenticated_client
        member_client.force_authenticate(user=self.member_user)

        # AND a file record exists
        file_record = File.objects.create(
            original_file_name="test_upload.jpg",
            file_name="test_upload_123.jpg",
            file_type="image/jpeg",
            created_by=self.merchant_user
        )

        # WHEN we make a post request to upload the actual file
        url = reverse("v1:storage:direct_local_upload", kwargs={"file_id": str(file_record.id)})
        test_file = SimpleUploadedFile(
            "test_upload.jpg",
            b"file_content",
            content_type="image/jpeg"
        )
        payload = {
            "file": test_file,
            "file_id": str(file_record.id),
        }
        response = member_client.post(url, payload, format='multipart')

        # THEN we should get a 201 response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # AND the file record should be updated with the file
        file_record.refresh_from_db()
        self.assertIsNotNone(file_record.file)

    def test_direct_local_upload_file_not_found(self):
        # GIVEN a merchant user is authenticated
        # WHEN we make a post request with a non-existent file_id
        url = reverse("v1:storage:direct_local_upload", kwargs={"file_id": "99999999-9999-9999-9999-999999999999"})
        test_file = SimpleUploadedFile(
            "test_upload.jpg",
            b"file_content",
            content_type="image/jpeg"
        )
        payload = {
            "file": test_file,
            "file_id": "99999999-9999-9999-9999-999999999999",
        }
        response = self.merchant_client.post(url, payload, format='multipart')

        # THEN we should get a 404 response
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_finish_direct_upload_success(self):
        # GIVEN a merchant user is authenticated
        # AND a file record exists with an uploaded file
        file_record = File.objects.create(
            original_file_name="test_finish.jpg",
            file_name="test_finish_123.jpg",
            file_type="image/jpeg",
            created_by=self.merchant_user,
            file=SimpleUploadedFile("test_finish.jpg", b"file_content")
        )

        # WHEN we make a post request to finish the upload
        url = reverse("v1:storage:finish_direct_upload")
        payload = {
            "file_id": str(file_record.id),
        }
        response = self.merchant_client.post(url, payload)

        # THEN we should get a 201 response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # AND the response should contain file data
        self.assertIn("file", response.data)

        # AND the file record should have upload_finished_at set
        file_record.refresh_from_db()
        self.assertIsNotNone(file_record.upload_finished_at)

    def test_finish_direct_upload_unauthenticated(self):
        # GIVEN a user is not authenticated
        # AND a file record exists
        file_record = File.objects.create(
            original_file_name="test_finish.jpg",
            file_name="test_finish_123.jpg",
            file_type="image/jpeg",
            created_by=self.merchant_user
        )

        # WHEN we make a post request to finish the upload
        url = reverse("v1:storage:finish_direct_upload")
        payload = {
            "file_id": str(file_record.id),
        }
        response = self.client.post(url, payload)

        # THEN we should get a 401 response
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_finish_direct_upload_member_role_success(self):
        # GIVEN a member user is authenticated
        member_client = self.authenticated_client
        member_client.force_authenticate(user=self.member_user)

        # AND a file record exists
        file_record = File.objects.create(
            original_file_name="test_finish.jpg",
            file_name="test_finish_123.jpg",
            file_type="image/jpeg",
            created_by=self.merchant_user
        )

        # WHEN we make a post request to finish the upload
        url = reverse("v1:storage:finish_direct_upload")
        payload = {
            "file_id": str(file_record.id),
        }
        response = member_client.post(url, payload)

        # THEN we should get a 201 response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # AND the response should contain file data
        self.assertIn("file", response.data)

        # AND the file record should have upload_finished_at set
        file_record.refresh_from_db()
        self.assertIsNotNone(file_record.upload_finished_at)

    def test_finish_direct_upload_file_not_found(self):
        # GIVEN a merchant user is authenticated
        # WHEN we make a post request with a non-existent file_id
        url = reverse("v1:storage:finish_direct_upload")
        payload = {
            "file_id": "99999999-9999-9999-9999-999999999999",
        }
        response = self.merchant_client.post(url, payload)

        # THEN we should get a 404 response
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_finish_direct_upload_missing_file_id(self):
        # GIVEN a merchant user is authenticated
        # WHEN we make a post request without file_id
        url = reverse("v1:storage:finish_direct_upload")
        payload = {}
        response = self.merchant_client.post(url, payload)

        # THEN we should get a 400 response
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


@override_settings(
    FILE_UPLOAD_STORAGE='local',
    MEDIA_ROOT=os.path.join(settings.BASE_DIR, 'test_media'),
    DEFAULT_FILE_STORAGE='django.core.files.storage.FileSystemStorage',
    APP_DOMAIN='http://testserver'
)
class AdminFileTests(BaseAPITestCase):

    def setUp(self):
        super().setUp()
        self.admin_user = UserFactory(
            email="admin_storage@example.com",
            password="testpass123",
            is_active=True,
            role=User.Role.ADMIN
        )
        self.regular_user = UserFactory(
            email="regular_storage@example.com",
            password="testpass123",
            is_active=True,
            role=User.Role.MEMBER
        )
        # Create file records for the admin user
        self.file1 = File.objects.create(
            original_file_name="admin_file_1.jpg",
            file_name="admin_file_1_abc.jpg",
            file_type="image/jpeg",
            created_by=self.admin_user
        )
        self.file2 = File.objects.create(
            original_file_name="admin_file_2.png",
            file_name="admin_file_2_def.png",
            file_type="image/png",
            created_by=self.admin_user
        )

        from rest_framework.test import APIClient
        self.admin_client = APIClient()
        self.admin_client.force_authenticate(user=self.admin_user)

    def test_admin_list_files(self):
        url = reverse("v1:storage:admin_file_list")
        response = self.admin_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data) if isinstance(response.data, dict) else response.data
        self.assertTrue(len(results) >= 2)

    def test_admin_list_files_non_admin_forbidden(self):
        self.authenticated_client.force_authenticate(user=self.regular_user)
        url = reverse("v1:storage:admin_file_list")
        response = self.authenticated_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_delete_file(self):
        # Create a file with an actual stored blob to exercise cleanup logic
        file_with_blob = File.objects.create(
            original_file_name="deletable_file.jpg",
            file_name="deletable_file_xyz.jpg",
            file_type="image/jpeg",
            created_by=self.admin_user,
            file=SimpleUploadedFile("deletable_file.jpg", b"file_content", content_type="image/jpeg")
        )
        file_id = file_with_blob.id
        file_path = file_with_blob.file.path

        url = reverse("v1:storage:admin_file_delete", kwargs={"pk": file_id})
        # Use captureOnCommitCallbacks so deferred blob cleanup actually runs
        with self.captureOnCommitCallbacks(execute=True):
            response = self.admin_client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        # Verify the file record is actually removed from the database
        self.assertFalse(File.objects.filter(id=file_id).exists())
        # Verify the underlying media file is removed from disk
        self.assertFalse(os.path.exists(file_path))

    def test_admin_delete_file_non_admin_forbidden(self):
        self.authenticated_client.force_authenticate(user=self.regular_user)
        url = reverse("v1:storage:admin_file_delete", kwargs={"pk": self.file1.id})
        response = self.authenticated_client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

