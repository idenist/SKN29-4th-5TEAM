from rest_framework import permissions


class IsAuthorOrReadOnly(permissions.BasePermission):
    """
    조회(GET)는 누구나 가능.
    수정(PATCH)/삭제(DELETE)는 작성자 본인 또는 관리자(is_staff)만 가능.
    """

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.author == request.user or request.user.is_staff