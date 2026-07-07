import logging

from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response

from apps.common.responses import error_response, success_response

from .serializers import AIChatRequestSerializer
from .services import run_ai_chat

logger = logging.getLogger(__name__)


INTEREST_LABEL_MAP = {
    "employment": "취업",
    "job": "취업",
    "work": "취업",
    "housing": "주거",
    "education": "교육",
    "training": "교육",
    "welfare": "복지",
    "participation": "참여",
    "startup": "창업",
    "finance": "금융",
}

REGION_CODE_MAP = {
    "서울": "11000",
    "서울시": "11000",
    "서울특별시": "11000",
    "부산": "26000",
    "부산광역시": "26000",
    "대구": "27000",
    "대구광역시": "27000",
    "인천": "28000",
    "인천광역시": "28000",
    "광주": "29000",
    "광주광역시": "29000",
    "대전": "30000",
    "대전광역시": "30000",
    "울산": "31000",
    "울산광역시": "31000",
    "세종": "36000",
    "세종시": "36000",
    "세종특별자치시": "36000",
    "경기": "41000",
    "경기도": "41000",
    "강원": "42000",
    "강원도": "42000",
    "강원특별자치도": "42000",
    "충북": "43000",
    "충청북도": "43000",
    "충남": "44000",
    "충청남도": "44000",
    "전북": "45000",
    "전라북도": "45000",
    "전북특별자치도": "45000",
    "전남": "46000",
    "전라남도": "46000",
    "경북": "47000",
    "경상북도": "47000",
    "경남": "48000",
    "경상남도": "48000",
    "제주": "50000",
    "제주도": "50000",
    "제주특별자치도": "50000",
}


def normalize_region(region):
    if not region:
        return None, None

    region_text = str(region).strip()
    region_code = REGION_CODE_MAP.get(region_text)

    return region_text, region_code


def normalize_user_profile(user_profile):
    if not user_profile:
        return None

    user_profile = dict(user_profile)

    interests = normalize_interests(
        user_profile.get("interests") or user_profile.get("interest_domain")
    )

    region, region_code = normalize_region(user_profile.get("region"))

    normalized = {
        **user_profile,
        "interests": interests,
        "region": region,
        "region_code": region_code,
    }

    if interests and not normalized.get("interest_domain"):
        normalized["interest_domain"] = interests[0]

    return normalized


def normalize_interests(interests):
    if not interests:
        return []

    if isinstance(interests, str):
        interests = [interests]

    return [
        INTEREST_LABEL_MAP.get(str(item), str(item))
        for item in interests
    ]

def _plain_serializer_errors(errors):
    if isinstance(errors, dict):
        return {
            key: _plain_serializer_errors(value)
            for key, value in errors.items()
        }

    if isinstance(errors, list):
        return [str(item) for item in errors]

    return str(errors)


def _get_validation_error_code(errors):
    if "message" in errors:
        return "EMPTY_MESSAGE"

    if "top_k" in errors:
        return "INVALID_TOP_K"

    if "user_profile" in errors:
        return "INVALID_USER_PROFILE"

    return "INVALID_REQUEST"


def _get_validation_error_message(error_code):
    messages = {
        "EMPTY_MESSAGE": "질문 내용을 입력해 주세요.",
        "INVALID_TOP_K": "추천 개수는 1개 이상 20개 이하로 입력해 주세요.",
        "INVALID_USER_PROFILE": "사용자 프로필 형식이 올바르지 않습니다.",
        "INVALID_REQUEST": "요청 형식이 올바르지 않습니다.",
    }

    return messages.get(error_code, "요청 형식이 올바르지 않습니다.")


def _build_validation_error_response(serializer_errors):
    plain_errors = _plain_serializer_errors(serializer_errors)
    error_code = _get_validation_error_code(plain_errors)
    message = _get_validation_error_message(error_code)

    error_payload = {
        "code": error_code,
        "message": message,
        "fields": plain_errors,
    }

    return {
        "success": False,
        "data": {
            "answer": "",
            "recommendations": [],
            "sources": [],
            "warnings": [message],
            "error": error_payload,
            "meta": {
                "error_code": error_code,
                "fallback_used": True,
            },
        },
        "message": message,
        "error": error_payload,
    }

class AIChatAPIView(APIView):
    """
    POST /api/ai/chat/

    비로그인 사용자도 질문 가능.
    로그인 사용자는 UserProfile을 자동으로 user_profile에 채워 넣는다.
    프론트에서 user_profile을 명시적으로 보낸 경우 해당 값을 우선한다.

    응답은 공통 포맷 {success, data, message, error}을 따르며,
    AI 원형 응답(answer/recommendations/sources/warnings/meta)은
    data 내부에 그대로 유지한다.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = AIChatRequestSerializer(data=request.data)

        if not serializer.is_valid():

            return Response(
                _build_validation_error_response(serializer.errors),
                status=status.HTTP_400_BAD_REQUEST,

            )

        data = serializer.validated_data
        user_profile = data.get("user_profile")

        # 프론트가 user_profile을 안 보냈고, 로그인한 사용자라면
        # UserProfile에서 자동으로 채워준다.
        if not user_profile and request.user and request.user.is_authenticated:
            profile = getattr(request.user, "profile", None)

            if profile:
                user_profile = {
                    "age": profile.age,
                    "region": profile.region,
                    "interests": normalize_interests(profile.interests),
                }

        # 로그인 사용자/프론트 전달 user_profile 모두 동일한 방식으로 정규화
        user_profile = normalize_user_profile(user_profile)

        try:
            result = run_ai_chat(
                message=data["message"],
                user_profile=user_profile,
                top_k=data.get("top_k", 5),
                conversation_id=data.get("conversation_id"),
            )

            return Response(
                {
                    "success": True,
                    "data": result,
                    "message": "AI 응답 생성 성공",
                    "error": None,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.exception("AI chat 처리 중 오류 발생")

            fallback_data = {
                "answer": "일시적인 오류로 답변을 생성하지 못했습니다. 잠시 후 다시 시도해주세요.",
                "recommendations": [],
                "sources": [],
                "warnings": ["서버 내부 오류가 발생했습니다."],
                "error": "AI_CHAT_SERVER_ERROR",
                "meta": {},
            }

            return Response(
                {
                    "success": False,
                    "data": fallback_data,
                    "message": "AI 응답 생성 실패",
                    "error": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

