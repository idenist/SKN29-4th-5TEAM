from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    """
    기본 Django User를 확장.
    email을 로그인 아이디로 사용 (username은 유지하되 email unique 처리).
    """
    email = models.EmailField(unique=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return self.email


class UserProfile(models.Model):
    """
    지침서 6.4 기준 프로필 모델.
    연령, 거주지, 관심분야, 프로필 이미지 URL 저장.
    """

    INTEREST_CHOICES = [
        ("employment", "취업"),
        ("housing", "주거"),
        ("education", "교육"),
        ("welfare", "복지"),
        ("participation", "참여"),
    ]

    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    age = models.PositiveSmallIntegerField(null=True, blank=True)
    region = models.CharField(max_length=100, blank=True)
    interests = models.JSONField(default=list, blank=True)  # 허용된 카테고리 리스트 저장
    profile_image_url = models.URLField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email}의 프로필"