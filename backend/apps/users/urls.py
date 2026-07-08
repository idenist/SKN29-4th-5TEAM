from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    LoginView,
    MeView,
    PasswordChangeView,
    PasswordResetEmailSendView,
    PasswordResetView,
    ProfileUpdateView,
    SignupEmailConfirmView,
    SignupEmailSendView,
    SignupView,
)

app_name = "users"

urlpatterns = [
    path("signup/email/send/", SignupEmailSendView.as_view(), name="signup-email-send"),
    path("signup/email/confirm/", SignupEmailConfirmView.as_view(), name="signup-email-confirm"),
    path("signup/", SignupView.as_view(), name="signup"),
    path("login/", LoginView.as_view(), name="login"),
    path("password-reset/email/send/", PasswordResetEmailSendView.as_view(), name="password-reset-email-send"),
    path("password-reset/", PasswordResetView.as_view(), name="password-reset"),
    path("password-change/", PasswordChangeView.as_view(), name="password-change"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("me/", MeView.as_view(), name="me"),
    path("profile/", ProfileUpdateView.as_view(), name="profile-update"),

]

