# 저장 위치: backend/tests/test_upload.py  (덮어쓰기)
"""
프로필 이미지 업로드 테스트
대상 테스트 ID: TC-UPLOAD-01, TC-UPLOAD-02

NOTE (확인 필요):
- UserProfile 모델의 필수 필드가 user 외에 더 있다면
  setUp()의 UserProfile.objects.get_or_create(user=self.user) 부분에 추가하세요.
"""
import io
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from PIL import Image
from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import UserProfile

User = get_user_model()


def build_invalid_file(filename="profile.jpg", content_type="image/jpeg"):
    """이미지가 아닌 가짜 파일 - 인증/권한 체크처럼 serializer까지 안 가는 테스트용"""
    return SimpleUploadedFile(filename, b"not-a-real-image", content_type=content_type)


def build_valid_image_file(filename="profile.jpg", image_format="JPEG", content_type="image/jpeg"):
    """Pillow로 실제 유효한 이미지 바이트를 생성 - ImageField 검증을 통과하기 위함"""
    buffer = io.BytesIO()
    Image.new("RGB", (10, 10), color=(255, 0, 0)).save(buffer, format=image_format)
    buffer.seek(0)
    return SimpleUploadedFile(filename, buffer.read(), content_type=content_type)


class ProfileImageUploadAuthTests(APITestCase):
    """TC-UPLOAD-01: 프로필 이미지 업로드 API가 인증 사용자에게만 허용되는가"""

    def test_upload_requires_login(self):
        url = reverse("uploads:profile-image")
        response = self.client.post(
            url, {"image": build_invalid_file()}, format="multipart"
        )
        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
        )


class ProfileImageUploadSuccessTests(APITestCase):
    """TC-UPLOAD-02: 업로드 성공 시 profile_image_url이 저장되는가"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="uploaduser", email="uploaduser@example.com", password="testpass1234"
        )
        self.profile, _ = UserProfile.objects.get_or_create(user=self.user)
        self.client.force_authenticate(user=self.user)
        self.url = reverse("uploads:profile-image")

    @patch("apps.uploads.views.delete_profile_image")
    @patch("apps.uploads.views.upload_profile_image")
    def test_upload_success_saves_url(self, mock_upload, mock_delete):
        fake_url = "https://example-bucket.s3.amazonaws.com/profile/uploaduser.jpg"
        mock_upload.return_value = fake_url
        mock_delete.return_value = None

        response = self.client.post(
            self.url, {"image": build_valid_image_file()}, format="multipart"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.profile.refresh_from_db()
        self.assertEqual(self.profile.profile_image_url, fake_url)
        mock_upload.assert_called_once()

    @patch("apps.uploads.views.delete_profile_image")
    def test_upload_rejects_invalid_extension(self, mock_delete):
        bad_file = SimpleUploadedFile(
            "profile.exe", b"not-an-image", content_type="application/octet-stream"
        )
        response = self.client.post(self.url, {"image": bad_file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)