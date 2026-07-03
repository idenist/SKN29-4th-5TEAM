from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),

    # apps
    path("api/auth/", include("apps.users.urls")),
    path("api/policies/", include("apps.policies.urls")),
    path("api/notifications/", include("apps.notifications.urls")),
    path("api/community/", include("apps.community.urls")),
    path("api/ai/", include("apps.chat_rag.urls")),
    path("api/recommendations/", include("apps.recommendations.urls")),
    path("api/news/", include("apps.news.urls")),
]