# backend/test_ai_chat_standalone.py

import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent

# backend/.env 로드
load_dotenv(BASE_DIR / ".env")

# 프로젝트 루트 .env도 있을 수 있으니 한 번 더 로드
load_dotenv(BASE_DIR.parent / ".env")

print("OPENAI_API_KEY loaded:", bool(os.getenv("OPENAI_API_KEY")))

from apps.chat_rag.services import run_ai_chat


def main():
    result = run_ai_chat(
        message="서울에 사는 25세 청년이 받을 수 있는 월세 지원 정책 알려줘",
        user_profile={
            "age": 25,
            "region": "서울",
            "interests": ["주거", "복지"],
        },
        top_k=5,
        conversation_id=None,
    )

    print("=== answer ===")
    print(result.get("answer"))

    print("\n=== recommendations ===")
    for item in result.get("recommendations", []):
        print("-", item.get("title"), item.get("eligibility"), item.get("deadline_status"))

    print("\n=== warnings ===")
    print(result.get("warnings"))

    print("\n=== error ===")
    print(result.get("error"))

    print("\n=== meta ===")
    print(result.get("meta"))


if __name__ == "__main__":
    main()