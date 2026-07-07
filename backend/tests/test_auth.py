# 저장 위치: backend/tests/test_auth.py
"""
인증(회원가입/로그인) 테스트
대상 테스트 ID: TC-AUTH-01, TC-AUTH-02, TC-AUTH-03, TC-AUTH-04

NOTE (확인 필요):
- SignupSerializer 필드명(username/email/password/password_confirm)이
  실제 apps/users/serializers.py와 다르면 build_signup_payload()를 수정하세요.
- 로그인이 email 기준이 아니라면 LoginTests의 payload를 수정하세요.
"""
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import EmailVerificationCode

User = get_user_model()


def build_signup_payload(**overrides):
    payload = {
        "username": "testuser01",
        "email": "testuser01@example.com",
        "password": "testpass1234",
        "password_confirm": "testpass1234",
    }
    payload.update(overrides)
    return payload


def create_verified_signup_code(email, code="123456"):
    return EmailVerificationCode.objects.create(
        email=email,
        code=code,
        purpose=EmailVerificationCode.PURPOSE_SIGNUP,
        is_verified=True,
        expires_at=timezone.now() + timezone.timedelta(minutes=10),
    )


def build_verified_signup_payload(**overrides):
    payload = build_signup_payload(**overrides)
    payload["verification_code"] = overrides.get("verification_code", "123456")
    create_verified_signup_code(payload["email"], payload["verification_code"])
    return payload


class SignupTests(APITestCase):
    """TC-AUTH-01: 회원가입 API가 정상 동작하는가"""

    def setUp(self):
        self.url = reverse("users:signup")

    def test_signup_success(self):
        response = self.client.post(self.url, build_verified_signup_payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email="testuser01@example.com").exists())

    def test_signup_fails_with_short_password(self):
        payload = build_signup_payload(password="short1", password_confirm="short1")
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_signup_fails_with_invalid_email_format(self):
        payload = build_signup_payload(email="not-an-email")
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_signup_fails_with_duplicate_email(self):
        self.client.post(self.url, build_verified_signup_payload(), format="json")
        response = self.client.post(
            self.url,
            build_signup_payload(username="testuser02", verification_code="123456"),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_signup_fails_with_mismatched_passwords(self):
        payload = build_signup_payload(password_confirm="different1234")
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LoginTests(APITestCase):
    """TC-AUTH-02: 로그인 API가 JWT access/refresh 토큰을 반환하는가"""

    def setUp(self):
        self.login_url = reverse("users:login")
        self.client.post(reverse("users:signup"), build_verified_signup_payload(), format="json")

    def test_login_success_returns_jwt_tokens(self):
        response = self.client.post(
            self.login_url,
            {"email": "testuser01@example.com", "password": "testpass1234"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data.get("data", response.data)
        self.assertIn("access", data)
        self.assertIn("refresh", data)

    def test_login_fails_with_wrong_password(self):
        response = self.client.post(
            self.login_url,
            {"email": "testuser01@example.com", "password": "wrongpassword"},
            format="json",
        )
        self.assertIn(
            response.status_code,
            [status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED],
        )


class AuthRequiredTests(APITestCase):
    """TC-AUTH-03: 인증이 필요한 API에 비로그인 접근 시 차단되는가"""

    def test_me_endpoint_requires_login(self):
        response = self.client.get(reverse("users:me"))
        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
        )

    def test_profile_update_requires_login(self):
        response = self.client.patch(reverse("users:profile-update"), {}, format="json")
        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
        )


class MyPageIsolationTests(APITestCase):
    """TC-AUTH-04: 다른 사용자의 마이페이지 데이터에 접근할 수 없는가"""

    def setUp(self):
        self.user_a = User.objects.create_user(
            username="usera", email="usera@example.com", password="testpass1234"
        )
        self.user_b = User.objects.create_user(
            username="userb", email="userb@example.com", password="testpass1234"
        )

    def test_mypage_returns_only_authenticated_users_data(self):
        self.client.force_authenticate(user=self.user_a)
        response = self.client.get(reverse("mypage-summary"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn(self.user_b.email, str(response.data))
