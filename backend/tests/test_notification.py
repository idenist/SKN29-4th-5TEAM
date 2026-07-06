# 저장 위치: backend/tests/test_notification.py
"""
알림 테스트
대상 테스트 ID: TC-NOTI-01

NOTE (확인 필요):
- Notification 모델 필드명(user/message/is_read)이 실제
  apps/notifications/models.py와 다르면 create_notification()을 수정하세요.
"""
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.notifications.models import Notification

User = get_user_model()


def create_notification(user, **overrides):
    defaults = {"message": "테스트 알림입니다.", "is_read": False}
    defaults.update(overrides)
    return Notification.objects.create(user=user, **defaults)


class NotificationListTests(APITestCase):
    """TC-NOTI-01: 알림 목록 API가 본인 알림만 반환하는가"""

    def setUp(self):
        self.user_a = User.objects.create_user(
            username="usera", email="usera@example.com", password="testpass1234"
        )
        self.user_b = User.objects.create_user(
            username="userb", email="userb@example.com", password="testpass1234"
        )
        self.notif_a = create_notification(self.user_a, message="A의 알림")
        self.notif_b = create_notification(self.user_b, message="B의 알림")
        self.url = reverse("notification-list")

    def test_notification_list_requires_login(self):
        response = self.client.get(self.url)
        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
        )

    def test_notification_list_returns_only_own_notifications(self):
        self.client.force_authenticate(user=self.user_a)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = str(response.data)
        self.assertIn("A의 알림", body)
        self.assertNotIn("B의 알림", body)

    def test_mark_notification_as_read(self):
        self.client.force_authenticate(user=self.user_a)
        url = reverse("notification-read", kwargs={"notification_id": self.notif_a.id})
        response = self.client.patch(url)
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT])
        self.notif_a.refresh_from_db()
        self.assertTrue(self.notif_a.is_read)

    def test_cannot_mark_other_users_notification_as_read(self):
        self.client.force_authenticate(user=self.user_a)
        url = reverse("notification-read", kwargs={"notification_id": self.notif_b.id})
        response = self.client.patch(url)
        self.assertIn(
            response.status_code,
            [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND],
        )