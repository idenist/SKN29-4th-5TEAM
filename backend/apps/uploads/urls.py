from django.urls import path
from .views import ProfileImageUploadView

app_name = "uploads"

urlpatterns = [
    path("profile-image/", ProfileImageUploadView.as_view(), name="profile-image"),
]