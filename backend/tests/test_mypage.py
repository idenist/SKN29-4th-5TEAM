# 저장 위치: backend/tests/test_mypage.py  (신규 파일)
"""
마이페이지 테스트
대상 테스트 ID: TC-MYPAGE-01
"""
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class MypageSummaryTests(APITestCase):
    """TC-MYPAGE-01: 마이페이지 API가 본인 데이터를 반환하는가"""

    def setUp(self):
        self.user_a = User.objects.create_user(
            username="usera", email="usera@example.com", password="testpass1234"
        )
        self.user_b = User.objects.create_user(
            username="userb", email="userb@example.com", password="testpass1234"
        )
        self.url = reverse("mypage-summary")

    def test_mypage_requires_login(self):
        response = self.client.get(self.url)
        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
        )

    def test_mypage_returns_200_for_logged_in_user(self):
        self.client.force_authenticate(user=self.user_a)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_mypage_does_not_leak_other_users_email(self):
        self.client.force_authenticate(user=self.user_a)
        response = self.client.get(self.url)
        self.assertNotIn(self.user_b.email, str(response.data))