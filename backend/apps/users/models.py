from django.contrib.auth.models import AbstractUser
from django.core.validators import MinLengthValidator
from django.db import models
from django.utils import timezone

from datetime import timedelta
from django.conf import settings
from django.utils import timezone


class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return self.email


class UserProfile(models.Model):
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
    interests = models.JSONField(default=list, blank=True)
    profile_image_url = models.URLField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
<<<<<<< HEAD
        return f"{self.user.email} profile"


class EmailVerificationCode(models.Model):
    PURPOSE_SIGNUP = "signup"
    PURPOSE_PASSWORD_RESET = "password_reset"

    PURPOSE_CHOICES = [
        (PURPOSE_SIGNUP, "회원가입"),
        (PURPOSE_PASSWORD_RESET, "비밀번호 재설정"),
    ]

    email = models.EmailField(db_index=True)
    code = models.CharField(max_length=6, validators=[MinLengthValidator(6)])
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES)
    is_verified = models.BooleanField(default=False)
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    verified_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["email", "purpose", "-created_at"],
                name="users_email_verify_lookup",
            ),
        ]

    def is_expired(self):
        return timezone.now() > self.expires_at

    def mark_verified(self):
        self.is_verified = True
        self.verified_at = timezone.now()
        self.save(update_fields=["is_verified", "verified_at"])

    def mark_used(self):
        self.is_used = True
        self.save(update_fields=["is_used"])
=======
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
>>>>>>> 50c67f79ae02d80099f0dcb29ad86131bb44f18a
