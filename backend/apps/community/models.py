from django.conf import settings
from django.db import models


class CommunityPost(models.Model):
    """
    청년 정책 후기/정보 공유 게시글 (MVP).
    이미지 첨부는 이번 범위에서 제외.
    """

<<<<<<< HEAD
    CATEGORY_CHOICES = [
        ("general", "일반"),
        ("housing", "주거"),
        ("finance", "금융"),
        ("employment", "취업"),
        ("education", "교육"),
        ("startup", "창업"),
        ("etc", "기타"),
    ]
=======
    class Category(models.TextChoices):
        GENERAL = "general", "일반"
        HOUSING = "housing", "주거"
        FINANCE = "finance", "금융"
        EMPLOYMENT = "employment", "취업"
        EDUCATION = "education", "교육"
        STARTUP = "startup", "창업"
        ETC = "etc", "기타"
>>>>>>> 50c67f79ae02d80099f0dcb29ad86131bb44f18a

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
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.GENERAL,
    )
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
<<<<<<< HEAD
=======

    @property
    def author_name(self) -> str:
        """user.username(닉네임) 우선, 없으면 email fallback"""
        user = self.author
        username = getattr(user, "username", "") or ""
        if username.strip():
            return username
        return getattr(user, "email", "") or ""


class Comment(models.Model):
    """게시글 댓글 (MVP)."""

    post = models.ForeignKey(
        CommunityPost, on_delete=models.CASCADE, related_name="comments"
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="community_comments",
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["post", "created_at"]),
        ]

    def __str__(self):
        return f"Comment({self.post_id}, {self.author})"

    @property
    def author_name(self) -> str:
        user = self.author
        username = getattr(user, "username", "") or ""
        if username.strip():
            return username
        return getattr(user, "email", "") or ""
>>>>>>> 50c67f79ae02d80099f0dcb29ad86131bb44f18a
