# backend/apps/chat_rag/views.py

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import AIChatRequestSerializer
from .services import run_ai_chat


class AIChatAPIView(APIView):
    """
    POST /api/ai/chat/
    """

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

        result = run_ai_chat(
            message=data["message"],
            user_profile=data.get("user_profile"),
            top_k=data.get("top_k", 5),
            conversation_id=data.get("conversation_id"),
        )

        return Response(result, status=status.HTTP_200_OK)