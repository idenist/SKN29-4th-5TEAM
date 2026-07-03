# backend/apps/chat_rag/urls.py

from django.urls import path

from .views import AIChatAPIView

app_name = "chat_rag"

urlpatterns = [
    path("chat/", AIChatAPIView.as_view(), name="chat"),
]

