from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import CustomUser, UserProfile, EmailVerificationCode


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    extra = 0
    readonly_fields = ("created_at", "updated_at")


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ("id", "email", "username", "is_staff", "is_active", "date_joined")
    list_display_links = ("id", "email")  # 이 줄 추가
    list_filter = ("is_staff", "is_active", "date_joined")
    search_fields = ("email", "username")
    ordering = ("-date_joined",)
    inlines = [UserProfileInline]

    # AbstractUser 기본 fieldsets은 username 우선 구조라, email 기반 로그인에 맞게 조정
    fieldsets = (
        (None, {"fields": ("email", "username", "password")}),
        ("권한", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("주요 일정", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "username", "password1", "password2", "is_staff", "is_active"),
        }),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "age", "region", "interests_display", "created_at")
    list_filter = ("region",)
    search_fields = ("user__email", "user__username", "region")
    readonly_fields = ("created_at", "updated_at")

    def interests_display(self, obj):
        return ", ".join(obj.interests) if obj.interests else "-"

    interests_display.short_description = "관심분야"


@admin.register(EmailVerificationCode)
class EmailVerificationCodeAdmin(admin.ModelAdmin):
    list_display = (
        "id", "email", "code", "purpose", "is_verified", "is_used",
        "expires_at", "created_at",
    )
    list_filter = ("purpose", "is_verified", "is_used")
    search_fields = ("email", "code")
    readonly_fields = ("created_at", "verified_at")
    ordering = ("-created_at",)

    