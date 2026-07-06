# 저장 위치: backend/apps/common/responses.py  (신규 파일)
"""
공통 API 응답 형식 (지침서 4.1 공통 API 응답 통일 기준)

기존에 apps/policies/views.py, apps/uploads/views.py 등 여러 파일에
똑같이 복붙되어 있던 success_response/error_response를 여기 한 곳으로 모았습니다.
"""
from rest_framework import status
from rest_framework.response import Response


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