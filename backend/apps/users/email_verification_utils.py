import random

from django.conf import settings
from django.core.mail import send_mail

from .models import EmailVerificationCode


def generate_code() -> str:
    return f"{random.randint(0, 999999):06d}"


def issue_verification_code(email: str, purpose: str) -> EmailVerificationCode:
    """이전에 발급된(미사용) 같은 email+purpose 코드는 무효화하고 새 코드 발급"""
    EmailVerificationCode.objects.filter(
        email=email, purpose=purpose, is_used=False
    ).update(is_used=True)

    code = generate_code()
    verification = EmailVerificationCode.objects.create(
        email=email,
        code=code,
        purpose=purpose,
        expires_at=EmailVerificationCode.new_expiry(),
    )
    send_verification_email(email, code, purpose)
    return verification


def send_verification_email(email: str, code: str, purpose: str) -> None:
    if purpose == EmailVerificationCode.Purpose.SIGNUP:
        subject = "[이젠, 안쉼] 회원가입 인증번호"
    else:
        subject = "[이젠, 안쉼] 비밀번호 재설정 인증번호"

    expire_minutes = EmailVerificationCode.expiry_minutes()
    message = (
        f"인증번호는 [{code}] 입니다.\n"
        f"인증번호는 발급 후 {expire_minutes}분간 유효합니다."
    )
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )


def verify_code(email: str, code: str, purpose: str) -> EmailVerificationCode | None:
    """code가 유효하면 is_verified=True 처리 후 반환, 아니면 None"""
    verification = (
        EmailVerificationCode.objects.filter(
            email=email,
            code=code,
            purpose=purpose,
            is_used=False,
        )
        .order_by("-created_at")
        .first()
    )
    if verification is None or verification.is_expired():
        return None

    verification.is_verified = True
    verification.save(update_fields=["is_verified"])
    return verification


def consume_verified_code(email: str, code: str, purpose: str) -> bool:
    """최종 가입/비밀번호변경 시점에 검증 + 사용 처리"""
    verification = EmailVerificationCode.objects.filter(
        email=email,
        code=code,
        purpose=purpose,
        is_verified=True,
        is_used=False,
    ).order_by("-created_at").first()

    if verification is None or verification.is_expired():
        return False

    verification.is_used = True
    verification.save(update_fields=["is_used"])
    return True