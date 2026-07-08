from django.urls import path

from .views import CommentViewSet, CommunityPostViewSet, PostLikeToggleView

post_list = CommunityPostViewSet.as_view({"get": "list", "post": "create"})
post_detail = CommunityPostViewSet.as_view(
    {
        "get": "retrieve",
        "patch": "partial_update",
        "put": "update",
        "delete": "destroy",
    }
)
comment_list = CommentViewSet.as_view({"get": "list", "post": "create"})
comment_detail = CommentViewSet.as_view({"delete": "destroy"})
post_like = PostLikeToggleView.as_view()

urlpatterns = [
    path("posts/", post_list, name="community-post-list"),
    path("posts/<int:post_id>/", post_detail, name="community-post-detail"),
    path(
        "posts/<int:post_id>/comments/",
        comment_list,
        name="community-comment-list",
    ),
    path(
        "posts/<int:post_id>/comments/<int:pk>/",
        comment_detail,
        name="community-comment-detail",
    ),
    path(
        "posts/<int:post_id>/like/",
        post_like,
        name="community-post-like",
    ),
]
