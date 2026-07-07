from django.contrib.auth.models import AbstractUser
from django.db import models

from datetime import timedelta
from django.conf import settings
from django.utils import timezone


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
    

class EmailVerificationCode(models.Model):
    class Purpose(models.TextChoices):
        SIGNUP = "signup", "회원가입"
        PASSWORD_RESET = "password_reset", "비밀번호 재설정"
 
    email = models.EmailField(db_index=True)
    code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=20, choices=Purpose.choices)
    is_verified = models.BooleanField(default=False)  # confirm 단계 통과 여부
    is_used = models.BooleanField(default=False)  # 실제 가입/비밀번호변경에 사용됨
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
 
    class Meta:
        indexes = [
            models.Index(fields=["email", "purpose", "code"]),
        ]
 
    def is_expired(self) -> bool:
        return timezone.now() >= self.expires_at
 
    @classmethod
    def expiry_minutes(cls) -> int:
        return getattr(settings, "EMAIL_VERIFICATION_EXPIRE_MINUTES", 10)
 
    @classmethod
    def new_expiry(cls):
        return timezone.now() + timedelta(minutes=cls.expiry_minutes())
 
    def __str__(self):
        return f"{self.email} [{self.purpose}] {self.code}"
