from django.contrib.auth.models import AbstractUser
from django.core.validators import MinLengthValidator
from django.db import models
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
