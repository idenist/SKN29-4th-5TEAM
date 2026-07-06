# 저장 위치: backend/apps/common/exceptions.py  (신규 파일)
"""
공통 예외 처리 (지침서 8.2 / 9.2 "공통 예외 처리 미들웨어 또는 유틸 함수 작성")

DRF의 EXCEPTION_HANDLER를 커스터마이징해서, 아래 두 경우를 전부
같은 응답 형식 {"success": false, "data": None, "message": ..., "error": ...}
으로 통일한다.

1. DRF가 이미 처리하는 예외 (ValidationError, NotFound, PermissionDenied,
   AuthenticationFailed 등) → 형식만 우리 공통 포맷으로 재포장
2. DRF가 처리하지 못하는 예외 (DB 연결 오류, 예상 못한 버그 등)
   → 500 응답으로 감싸서, HTML 에러 페이지가 API 응답으로 나가는 것을 방지

NOTE (적용 필요):
settings.py의 REST_FRAMEWORK 딕셔너리에 아래 키를 추가해야 실제로 동작합니다.

REST_FRAMEWORK = {
    ...,  # 기존 설정 유지
    "EXCEPTION_HANDLER": "apps.common.exceptions.custom_exception_handler",
}
"""
import logging

from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    response = drf_exception_handler(exc, context)

    if response is not None:
        # DRF가 이미 처리한 예외 - 우리 공통 포맷으로 재포장
        detail = response.data
        response.data = {
            "success": False,
            "data": None,
            "message": _extract_message(detail),
            "error": detail,
        }
        return response

    # DRF가 처리하지 못한 예외 (버그, DB 오류 등) - 500으로 감싸고 로그 남김
    view = context.get("view")
    logger.exception("Unhandled exception in %s", view.__class__.__name__ if view else "unknown view")

    return Response(
        {
            "success": False,
            "data": None,
            "message": "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
            "error": str(exc) if settings.DEBUG else None,
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


def _extract_message(detail):
    """DRF 예외의 detail 구조에서 사람이 읽을 만한 메시지 한 줄을 뽑아낸다."""
    if isinstance(detail, dict):
        if "detail" in detail:
            return str(detail["detail"])
        for key, value in detail.items():
            if isinstance(value, list) and value:
                return f"{key}: {value[0]}"
        return "요청을 처리할 수 없습니다."
    if isinstance(detail, list) and detail:
        return str(detail[0])
    return str(detail)