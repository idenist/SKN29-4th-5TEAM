import logging

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import AIChatRequestSerializer
from .services import run_ai_chat

logger = logging.getLogger(__name__)


class AIChatAPIView(APIView):
    """
    POST /api/ai/chat/

    비로그인 사용자도 질문 가능.
    로그인 사용자는 UserProfile을 자동으로 user_profile에 채워 넣는다
    (프론트에서 user_profile을 명시적으로 보낸 경우 그 값을 우선한다).
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = AIChatRequestSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {
                    "answer": "",
                    "recommendations": [],
                    "sources": [],
                    "warnings": ["요청 형식이 올바르지 않습니다."],
                    "error": serializer.errors,
                    "meta": {},
                },
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
                    "interests": profile.interests,
                }

        try:
            result = run_ai_chat(
                message=data["message"],
                user_profile=user_profile,
                top_k=data.get("top_k", 5),
                conversation_id=data.get("conversation_id"),
            )
        except Exception as e:
            logger.exception("AI chat 처리 중 오류 발생")
            return Response(
                {
                    "answer": "일시적인 오류로 답변을 생성하지 못했습니다. 잠시 후 다시 시도해주세요.",
                    "recommendations": [],
                    "sources": [],
                    "warnings": ["서버 내부 오류가 발생했습니다."],
                    "error": str(e),
                    "meta": {},
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(result, status=status.HTTP_200_OK)