# tests/test_llm_exception.py

import os
import sys
import types

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from apps.chat_rag.services import run_ai_chat


def install_fake_workflow(exception_to_raise):
    """
    run_ai_chat() 내부에서 import하는 rag_engine.graph.workflow.run_rag_workflow를
    가짜 함수로 교체한다.
    """
    fake_module = types.ModuleType("rag_engine.graph.workflow")

    def fake_run_rag_workflow(*args, **kwargs):
        raise exception_to_raise

    fake_module.run_rag_workflow = fake_run_rag_workflow

    old_module = sys.modules.get("rag_engine.graph.workflow")
    sys.modules["rag_engine.graph.workflow"] = fake_module

    return old_module


def restore_workflow(old_module):
    if old_module is None:
        sys.modules.pop("rag_engine.graph.workflow", None)
    else:
        sys.modules["rag_engine.graph.workflow"] = old_module


def check_exception_case(name, exception_to_raise, expected_error_code):
    print(f"\n[{name}]")

    old_module = install_fake_workflow(exception_to_raise)

    try:
        result = run_ai_chat(
            message="서울 청년 월세 지원 정책 알려줘",
            user_profile={"age": 25, "region": "서울", "interests": ["주거"]},
            top_k=5,
        )
    finally:
        restore_workflow(old_module)

    print("answer =", result.get("answer"))
    print("recommendations =", result.get("recommendations"))
    print("sources =", result.get("sources"))
    print("warnings =", result.get("warnings"))
    print("error =", result.get("error"))
    print("meta =", result.get("meta"))

    assert result.get("recommendations") == []
    assert result.get("sources") == []
    assert result.get("warnings")
    assert result.get("error") == expected_error_code
    assert result.get("meta", {}).get("error_code") == expected_error_code
    assert result.get("meta", {}).get("fallback_used") is True


def main():
    check_exception_case(
        name="TC-LLM-01 RateLimit 예외",
        exception_to_raise=Exception("Rate limit 429"),
        expected_error_code="LLM_RATE_LIMIT",
    )

    check_exception_case(
        name="TC-LLM-02 Timeout 예외",
        exception_to_raise=TimeoutError("request timeout"),
        expected_error_code="LLM_TIMEOUT",
    )

    check_exception_case(
        name="TC-LLM-03 인증/API Key 예외",
        exception_to_raise=Exception("AuthenticationError 401 api key invalid"),
        expected_error_code="LLM_AUTH_ERROR",
    )

    check_exception_case(
        name="TC-LLM-04 Vector DB 예외",
        exception_to_raise=Exception("chroma collection not found"),
        expected_error_code="VECTOR_DB_ERROR",
    )

    check_exception_case(
        name="TC-LLM-05 알 수 없는 AI 예외",
        exception_to_raise=Exception("unexpected llm failure"),
        expected_error_code="AI_SERVICE_ERROR",
    )

    print("\n모든 LLM/API 예외 처리 테스트 통과")


if __name__ == "__main__":
    main()