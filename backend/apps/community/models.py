from django.conf import settings
from django.db import models


class CommunityPost(models.Model):
    """
    청년 정책 후기/정보 공유 게시글 (MVP).
    카테고리, 이미지는 이번 범위에서 제외.
    """

    CATEGORY_CHOICES = [
        ("general", "일반"),
        ("housing", "주거"),
        ("finance", "금융"),
        ("employment", "취업"),
        ("education", "교육"),
        ("startup", "창업"),
        ("etc", "기타"),
    ]

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="community_posts",
    )
    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default="general",
        db_index=True,
    )
    title = models.CharField(max_length=200)
    content = models.TextField()
    view_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["-created_at"]),
        ]

    def __str__(self):
        return f"{self.title} ({self.author})"
