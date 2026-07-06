# 저장 위치: backend/tests/test_exception_handling.py  (신규 파일)
"""
공통 예외 처리 테스트

apps/common/exceptions.py의 custom_exception_handler가
settings.py REST_FRAMEWORK["EXCEPTION_HANDLER"]에 등록되어 있어야 통과합니다.
"""
from django.urls import reverse
from rest_framework.test import APITestCase


class UnifiedErrorFormatTests(APITestCase):
    """DRF가 처리하는 예외들이 전부 공통 응답 형식으로 나오는가"""

    def test_404_response_uses_common_format(self):
        url = reverse("policies:policy-detail", kwargs={"item_id": "NON-EXISTENT-ID"})
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)
        self.assertIn("success", response.data)
        self.assertFalse(response.data["success"])
        self.assertIsNone(response.data["data"])
        self.assertIn("message", response.data)
        self.assertIn("error", response.data)

    def test_validation_error_uses_common_format(self):
        # signup 필수값을 하나도 안 보내서 ValidationError 유발
        response = self.client.post(reverse("users:signup"), {}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("success", response.data)
        self.assertFalse(response.data["success"])
        self.assertIn("message", response.data)

    def test_auth_required_error_uses_common_format(self):
        response = self.client.get(reverse("mypage-summary"))
        self.assertIn(response.status_code, [401, 403])
        self.assertIn("success", response.data)
        self.assertFalse(response.data["success"])