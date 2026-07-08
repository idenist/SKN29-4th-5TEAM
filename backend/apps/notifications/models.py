# apps/notifications/models.py

from django.conf import settings
from django.db import models

from apps.policies.models import Policy


class Notification(models.Model):
    """
    마감 임박 / 정책 변경 등 사용자에게 전달되는 알림.
    알림 '생성'은 정승(데이터 파이프라인)이 담당하고,
    이 앱(한경찬 담당)은 조회 API / 읽음 처리 / 삭제만 담당한다.
    """

    class NotificationType(models.TextChoices):
        DEADLINE_SOON = "deadline_soon", "마감 임박"
        POLICY_UPDATED = "policy_updated", "정책 변경"
        POLICY_CLOSED = "policy_closed", "정책 마감"
        SYSTEM = "system", "시스템 공지"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    policy = models.ForeignKey(
        Policy,
        on_delete=models.CASCADE,
        related_name="notifications",
        null=True,
        blank=True,
        help_text="시스템 공지 등 정책과 무관한 알림의 경우 null 허용",
    )
    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    link = models.CharField(
        max_length=300, blank=True, default="",
        help_text="프론트에서 알림 클릭 시 이동할 경로 (예: /policies/{item_id})",
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_read"]),
            models.Index(fields=["user", "-created_at"]),
        ]

    def __str__(self):
        return f"[{self.notification_type}] {self.title} -> {self.user_id}"