# apps/notifications/urls.py

from django.urls import path

from .views import (
    NotificationListView,
    NotificationReadView,
    NotificationDeleteView,
)

urlpatterns = [
    path("", NotificationListView.as_view(), name="notification-list"),
    path("<int:notification_id>/read/", NotificationReadView.as_view(), name="notification-read"),
    path("<int:notification_id>/", NotificationDeleteView.as_view(), name="notification-delete"),
]