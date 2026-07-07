from django.conf import settings
from django.db import models


class CommunityPost(models.Model):
    class Category(models.TextChoices):
        GENERAL = "general", "일반"
        HOUSING = "housing", "주거"
        FINANCE = "finance", "금융"
        EMPLOYMENT = "employment", "취업"
        EDUCATION = "education", "교육"
        STARTUP = "startup", "창업"
        ETC = "etc", "기타"

    CATEGORY_CHOICES = Category.choices

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="community_posts",
    )
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.GENERAL,
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

    @property
    def author_name(self):
        username = getattr(self.author, "username", "") or ""
        return username.strip() or getattr(self.author, "email", "") or ""


class Comment(models.Model):
    post = models.ForeignKey(
        CommunityPost,
        on_delete=models.CASCADE,
        related_name="comments",
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
    def author_name(self):
        username = getattr(self.author, "username", "") or ""
        return username.strip() or getattr(self.author, "email", "") or ""