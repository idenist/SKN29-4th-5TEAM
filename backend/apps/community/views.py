from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CommunityPost
from .permissions import IsAuthorOrReadOnly
from .serializers import CommunityPostDetailSerializer, CommunityPostListSerializer


def success_response(data=None, message="", status_code=status.HTTP_200_OK):
    return Response(
        {"success": True, "data": data, "message": message, "error": None},
        status=status_code,
    )


def error_response(message="", error=None, status_code=status.HTTP_400_BAD_REQUEST):
    return Response(
        {"success": False, "data": None, "message": message, "error": error},
        status=status_code,
    )


# ---------------------------------------------------------
# 게시글 목록 조회 / 작성
# ---------------------------------------------------------
class CommunityPostListCreateView(APIView):
    """
    GET  /api/community/posts/   - 목록 조회 (비로그인 가능)
    POST /api/community/posts/   - 게시글 작성 (로그인 필요)
    """

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get(self, request):
        posts = CommunityPost.objects.all()
        serializer = CommunityPostListSerializer(posts, many=True)
        return success_response(data=serializer.data, message="게시글 목록을 조회했습니다.")

    def post(self, request):
        serializer = CommunityPostDetailSerializer(
            data=request.data, context={"request": request}
        )
        if not serializer.is_valid():
            first_field = next(iter(serializer.errors))
            first_reason = str(serializer.errors[first_field][0])
            return error_response(
                message="입력값이 올바르지 않습니다.",
                error={"field": first_field, "reason": first_reason},
            )
        post = serializer.save()
        return success_response(
            data=CommunityPostDetailSerializer(post).data,
            message="게시글이 작성되었습니다.",
            status_code=status.HTTP_201_CREATED,
        )


# ---------------------------------------------------------
# 게시글 상세 조회 / 수정 / 삭제
# ---------------------------------------------------------
class CommunityPostDetailView(APIView):
    """
    GET    /api/community/posts/{post_id}/   - 상세 조회 (비로그인 가능, 조회수 +1)
    PATCH  /api/community/posts/{post_id}/   - 수정 (작성자 본인만)
    DELETE /api/community/posts/{post_id}/   - 삭제 (작성자 본인 또는 관리자)
    """

    permission_classes = [IsAuthorOrReadOnly]

    def get_object(self, post_id):
        try:
            return CommunityPost.objects.get(id=post_id)
        except CommunityPost.DoesNotExist:
            return None

    def get(self, request, post_id):
        post = self.get_object(post_id)
        if post is None:
            return error_response(
                message="게시글을 찾을 수 없습니다.",
                error="NOT_FOUND",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        post.view_count += 1
        post.save(update_fields=["view_count"])
        serializer = CommunityPostDetailSerializer(post)
        return success_response(data=serializer.data, message="게시글을 조회했습니다.")

    def patch(self, request, post_id):
        post = self.get_object(post_id)
        if post is None:
            return error_response(
                message="게시글을 찾을 수 없습니다.",
                error="NOT_FOUND",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        self.check_object_permissions(request, post)

        serializer = CommunityPostDetailSerializer(
            post, data=request.data, partial=True, context={"request": request}
        )
        if not serializer.is_valid():
            first_field = next(iter(serializer.errors))
            first_reason = str(serializer.errors[first_field][0])
            return error_response(
                message="입력값이 올바르지 않습니다.",
                error={"field": first_field, "reason": first_reason},
            )
        serializer.save()
        return success_response(data=serializer.data, message="게시글이 수정되었습니다.")

    def delete(self, request, post_id):
        post = self.get_object(post_id)
        if post is None:
            return error_response(
                message="게시글을 찾을 수 없습니다.",
                error="NOT_FOUND",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        self.check_object_permissions(request, post)

        post.delete()
        return success_response(message="게시글이 삭제되었습니다.")