import requests
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from .services import fetch_naver_news


def _parse_display(raw_value, default=10, minimum=1, maximum=20):
    """display 쿼리 파라미터를 안전한 정수 범위(1~20)로 정규화."""
    try:
        value = int(raw_value)
    except (TypeError, ValueError):
        return default
    return max(minimum, min(value, maximum))


@api_view(["GET"])
@permission_classes([AllowAny])
def news_list(request):
    keyword = request.GET.get("query", "청년월세지원")
    display = _parse_display(request.GET.get("display", 10))

    try:
        data = fetch_naver_news(keyword=keyword, display=display)
    except requests.RequestException:
        return Response(
            {
                "success": False,
                "data": None,
                "message": "뉴스 정보를 불러오지 못했습니다.",
                "error": "NEWS_API_FAIL",
            },
            status=status.HTTP_502_BAD_GATEWAY,
        )

    return Response(
        {
            "success": True,
            "data": data.get("items", []),
            "message": "뉴스 목록 조회 성공",
            "error": None,
        },
        status=status.HTTP_200_OK,
    )