from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    SignupView,
    LoginView,
    MeView,
    ProfileUpdateView,
    SignupEmailSendView,
    SignupEmailConfirmView,
    PasswordResetEmailSendView,
    PasswordResetView,
)

app_name = "users"

urlpatterns = [
    path("signup/email/send/", SignupEmailSendView.as_view(), name="signup-email-send"),
    path("signup/email/confirm/", SignupEmailConfirmView.as_view(), name="signup-email-confirm"),
    path("signup/", SignupView.as_view(), name="signup"),
    path("login/", LoginView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("me/", MeView.as_view(), name="me"),
    path("profile/", ProfileUpdateView.as_view(), name="profile-update"),
    path("password-reset/email/send/", PasswordResetEmailSendView.as_view(), name="password-reset-email-send"),
    path("password-reset/", PasswordResetView.as_view(), name="password-reset"),
]