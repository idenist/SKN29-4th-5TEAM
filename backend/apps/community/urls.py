from django.urls import path

from .views import CommunityPostListCreateView, CommunityPostDetailView

urlpatterns = [
    path("posts/", CommunityPostListCreateView.as_view(), name="community-post-list"),
    path("posts/<int:post_id>/", CommunityPostDetailView.as_view(), name="community-post-detail"),
]