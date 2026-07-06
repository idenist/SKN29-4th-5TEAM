# backend/apps/chat_rag/services.py

import logging
from typing import Any

logger = logging.getLogger(__name__)

FALLBACK_ANSWER = (
    "죄송합니다. 현재 정책 검색 서비스에 일시적인 문제가 발생했습니다. "
    "잠시 후 다시 시도하거나 공식 출처에서 직접 확인해 주세요."
)

ERROR_EMPTY_MESSAGE = "EMPTY_MESSAGE"
ERROR_WORKFLOW_PARSE = "WORKFLOW_PARSE_ERROR"
ERROR_CONNECTION = "AI_CONNECTION_ERROR"
ERROR_RATE_LIMIT = "LLM_RATE_LIMIT"
ERROR_TIMEOUT = "LLM_TIMEOUT"
ERROR_AUTH = "LLM_AUTH_ERROR"
ERROR_VECTOR_DB = "VECTOR_DB_ERROR"
ERROR_UNKNOWN = "AI_SERVICE_ERROR"

EMPTY_DISPLAY_TEXT = "정보 없음"
CARD_SUMMARY_MAX_CHARS = 180
CARD_TEXT_MAX_CHARS = 300
CARD_LIST_MAX_ITEMS = 3

class WorkflowParsingError(Exception):
    pass


def run_ai_chat(
    message: str,
    user_profile: dict[str, Any] | None = None,
    top_k: int = 5,
    conversation_id: str | None = None,
) -> dict[str, Any]:
    """
    Django /api/ai/chat/에서 호출하는 AI 챗봇 서비스 진입점.
    기존 RAG workflow를 Django 서비스 레이어에서 호출한다.
    """

    try:
        if not message or not message.strip():
            return _build_empty_message_response()

        # RAG import는 함수 내부에서 수행한다.
        # 이유: RAG/Chroma/OpenAI 환경 문제가 있어도 Django 서버 시작 자체는 막지 않기 위함.
        from rag_engine.graph.workflow import run_rag_workflow

        query = _build_query_with_profile(
            message=message.strip(),
            user_profile=user_profile,
        )

        raw = run_rag_workflow(
            query=query,
            top_k=top_k,
            return_full_state=False,
        )

        response = _workflow_result_to_ai_response(raw)
        _apply_user_profile_to_response_meta(response, user_profile)
        return response

    except WorkflowParsingError as e:
        logger.error("workflow 파싱 오류: %s", e)
        return _build_fallback_response(
            error_code=ERROR_WORKFLOW_PARSE,
            user_message="AI 응답 처리 중 문제가 발생했습니다.",
            detail=str(e),
        )

    except (ConnectionError, OSError) as e:
        logger.error("RAG 연결 오류: %s", e, exc_info=True)
        return _build_fallback_response(
            error_code=ERROR_CONNECTION,
            user_message="AI 검색 서비스 연결에 일시적인 문제가 발생했습니다.",
            detail=str(e),
        )

    except Exception as e:
        err = str(e).lower()

        if any(k in err for k in ("ratelimit", "rate limit", "429")):
            logger.error("LLM RateLimit: %s", e)
            return _build_fallback_response(
                error_code=ERROR_RATE_LIMIT,
                user_message="현재 AI 요청이 많아 잠시 후 다시 시도해 주세요.",
                detail=str(e),
            )

        if any(k in err for k in ("timeout", "timed out")):
            logger.error("LLM timeout: %s", e)
            return _build_fallback_response(
                error_code=ERROR_TIMEOUT,
                user_message="AI 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.",
                detail=str(e),
            )

        if any(k in err for k in ("authenticationerror", "401", "api key")):
            logger.error("LLM 인증 오류: %s", e)
            return _build_fallback_response(
                error_code=ERROR_AUTH,
                user_message="AI 인증 설정에 문제가 발생했습니다.",
                detail=str(e),
            )

        if any(k in err for k in ("no such file", "not found", "collection", "chroma")):
            logger.error("Vector DB 오류: %s", e, exc_info=True)
            return _build_fallback_response(
                error_code=ERROR_VECTOR_DB,
                user_message="정책 검색 데이터 연결에 문제가 발생했습니다.",
                detail=str(e),
            )

        logger.error("workflow 알 수 없는 오류: %s", e, exc_info=True)
        return _build_fallback_response(
            error_code=ERROR_UNKNOWN,
            user_message="AI 처리 중 알 수 없는 문제가 발생했습니다.",
            detail=str(e),
        )

def _build_query_with_profile(
    message: str,
    user_profile: dict[str, Any] | None,
) -> str:
    """
    3차 workflow는 user_profile을 직접 받지 않으므로,
    1차 이식에서는 query에 프로필 조건을 덧붙인다.

    추후 workflow가 user_profile 인자를 직접 받도록 바꾸면
    이 함수는 제거 가능.
    """

    if not user_profile:
        return message

    profile_parts = []

    age = user_profile.get("age")
    region = user_profile.get("region")
    interests = user_profile.get("interests") or user_profile.get("interest_domain")

    if age:
        profile_parts.append(f"나이: {age}")

    if region:
        profile_parts.append(f"지역: {region}")

    if interests:
        if isinstance(interests, list):
            profile_parts.append(f"관심분야: {', '.join(map(str, interests))}")
        else:
            profile_parts.append(f"관심분야: {interests}")

    if not profile_parts:
        return message

    return f"{message}\n\n사용자 프로필 조건: {' / '.join(profile_parts)}"


def _workflow_result_to_ai_response(raw: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(raw, dict):
        raise WorkflowParsingError(f"workflow가 dict가 아닌 타입을 반환했습니다: {type(raw)}")

    conditions = raw.get("user_conditions") or {}
    recommendations_raw = raw.get("recommendations") or raw.get("eligibility_results") or []

    recommendations = []

    for idx, policy in enumerate(recommendations_raw):
        try:
            recommendations.append(_policy_to_recommendation(policy))
        except Exception as e:
            logger.warning("recommendations[%s] 변환 실패: %s", idx, e)

    return {
        "answer": _safe_str(raw.get("answer")),
        "recommendations": recommendations,
        "sources": _build_sources(recommendations),
        "warnings": _safe_list(raw.get("warnings")),
        "error": None,
        "meta": {
            "user_conditions": {
                "age": conditions.get("age"),
                "region": conditions.get("region"),
                "income": conditions.get("income"),
                "employment_status": conditions.get("employment_status"),
                "interest_domain": conditions.get("interest_domain"),
            },
            "route": _safe_str(raw.get("route"), "전체"),
            "route_reason": raw.get("route_reason"),
            "tool_trace": _safe_tool_trace(raw.get("tool_trace")),
            "internal_search_sufficient": _safe_bool(
                raw.get("internal_search_sufficient"),
                default=False,
            ),
            "sufficiency_reasons": _safe_list(raw.get("sufficiency_reasons")),
            "next_action": _safe_str(raw.get("next_action")),
            "external_used": _safe_bool(raw.get("external_used"), default=False),
            "external_search_status": _safe_str(raw.get("external_search_status")),
            "external_search_targets": _safe_list(raw.get("external_search_targets")),
            "external_search_queries": _safe_list(raw.get("external_search_queries")),
        },
    }

def _apply_user_profile_to_response_meta(
    response: dict[str, Any],
    user_profile: dict[str, Any] | None,
) -> None:
    """
    workflow가 user_profile을 직접 받지 않는 구조라서,
    최종 응답 meta.user_conditions에 요청 user_profile 값을 보정한다.

    검색/라우팅 자체를 바꾸는 함수는 아니고,
    프론트에서 확인하는 사용자 조건 표시를 안정화하는 용도다.
    """

    if not isinstance(response, dict) or not user_profile:
        return

    meta = response.setdefault("meta", {})
    conditions = meta.setdefault("user_conditions", {})

    age = user_profile.get("age")
    region = user_profile.get("region")
    region_code = user_profile.get("region_code")
    interests = user_profile.get("interests") or []
    interest_domain = user_profile.get("interest_domain")

    if age is not None and not conditions.get("age"):
        conditions["age"] = age

    if region and not conditions.get("region"):
        conditions["region"] = region

    if region_code:
        conditions["region_code"] = region_code

    if interests and not conditions.get("interests"):
        conditions["interests"] = interests

    if not interest_domain and isinstance(interests, list) and interests:
        interest_domain = interests[0]

    if interest_domain and not conditions.get("interest_domain"):
        conditions["interest_domain"] = interest_domain

def _policy_to_recommendation(policy: dict[str, Any]) -> dict[str, Any]:
    metadata = policy.get("metadata") or {}
    text = _safe_str(policy.get("text"))

    item_id = (
        _safe_str(policy.get("item_id"))
        or _safe_str(metadata.get("item_id"))
        or _safe_str(policy.get("policy_id"))
        or _safe_str(metadata.get("policy_id"))
    )

    title = (
        _safe_str(policy.get("title"))
        or _safe_str(metadata.get("title"))
        or _safe_str(policy.get("policy_name"))
        or _safe_str(metadata.get("policy_name"))
        or "제목 없음"
    )

    source_category = _safe_str(
        policy.get("source_category") or metadata.get("source_category")
    )

    domain = (
        _safe_str(policy.get("domain"))
        or _safe_str(metadata.get("domain"))
        or None
    )

    raw_source_url = (
        _safe_str(metadata.get("source_url"))
        or _safe_str(policy.get("source_url"))
    )

    raw_application_url = (
        _safe_str(metadata.get("application_url"))
        or _safe_str(policy.get("application_url"))
        or _extract_field_from_text(text, "application_url")
    )

    source_url = _first_non_empty(raw_source_url, raw_application_url)
    application_url = _first_non_empty(raw_application_url, raw_source_url)
    action_url = _first_non_empty(application_url, source_url)

    raw_support_content = (
        _safe_str(policy.get("support_content"))
        or _extract_field_from_text(text, "support_content")
        or _extract_field_from_text(text, "policy_summary")
        or EMPTY_DISPLAY_TEXT
    )

    raw_application_period = (
        _safe_str(policy.get("application_period"))
        or _extract_field_from_text(text, "application_period_text")
        or EMPTY_DISPLAY_TEXT
    )

    raw_required_documents = (
        _safe_str(policy.get("required_documents"))
        or _extract_field_from_text(text, "required_documents")
        or EMPTY_DISPLAY_TEXT
    )

    summary = (
        _safe_str(policy.get("summary"))
        or _safe_str(metadata.get("summary"))
        or _extract_field_from_text(text, "policy_summary")
        or raw_support_content
    )

    if not summary or summary == EMPTY_DISPLAY_TEXT:
        if raw_application_period != EMPTY_DISPLAY_TEXT:
            summary = f"신청기간: {raw_application_period}"
        elif raw_required_documents != EMPTY_DISPLAY_TEXT:
            summary = f"제출서류 확인 가능: {raw_required_documents}"
        else:
            summary = "세부 내용은 원문에서 확인이 필요합니다."

    eligibility = _safe_str(policy.get("eligibility"), "추가 확인 필요")
    deadline_status = _safe_str(
        policy.get("deadline_status") or metadata.get("deadline_status"),
        "unknown",
    )

    application_end_date = (
        policy.get("application_end_date")
        or metadata.get("application_end_date")
    )

    is_expired = _safe_bool(
        policy.get("is_expired", metadata.get("is_expired")),
        default=False,
    )

    cautions = _limit_card_list(_build_cautions(policy))

    badges = []

    if domain:
        badges.append(domain.split(">")[0].strip())

    if eligibility:
        badges.append(eligibility)

    if is_expired or deadline_status == "expired":
        badges.append("마감")
    elif deadline_status == "open":
        badges.append("신청 가능")
    elif deadline_status == "unknown":
        badges.append("확인 필요")

    badges = list(dict.fromkeys([badge for badge in badges if badge]))

    return {
        "policy_id": item_id,
        "item_id": item_id,
        "title": title,
        "policy_name": title,
        "source_category": source_category,
        "domain": domain,
        "summary": _truncate_for_card(summary, CARD_SUMMARY_MAX_CHARS),
        "eligibility": eligibility,
        "score": _safe_float(policy.get("score")),
        "reason": _build_reason(policy),
        "match_reason": _build_reason(policy),

        # 프론트 카드 표시용 핵심 필드
        "display_summary": _truncate_for_card(summary, CARD_SUMMARY_MAX_CHARS),
        "display_period": _normalize_display_text(raw_application_period),
        "display_action_text": "신청/상세 보기" if action_url else "원문 확인 필요",
        "badges": badges,
        "action_url": action_url,
        "has_detail_url": bool(action_url),

        # 기존 호환 필드
        "support_content": _truncate_for_card(raw_support_content, CARD_TEXT_MAX_CHARS),
        "application_period": _normalize_display_text(raw_application_period),
        "required_documents": _truncate_for_card(raw_required_documents, CARD_TEXT_MAX_CHARS),
        "source_url": source_url,
        "application_url": application_url,
        "needs_detail_check": _safe_bool(
            metadata.get("needs_detail_check", policy.get("needs_detail_check")),
            default=True,
        ),
        "cautions": cautions,
        "deadline_status": deadline_status,
        "application_end_date": application_end_date,
        "is_expired": is_expired,
    }

def _build_reason(policy: dict[str, Any]) -> str:
    eligibility = _safe_str(policy.get("eligibility"), "추가 확인 필요")
    blockers = _safe_list(policy.get("blockers"))
    missing = _safe_list(policy.get("missing_conditions"))

    if blockers:
        return "검색 결과에는 포함되었지만 일부 조건이 맞지 않을 가능성이 있습니다."

    if eligibility == "가능성 높음":
        return "검색된 정책 데이터 기준으로 주요 조건이 비교적 잘 충족됩니다."

    if missing:
        return "검색된 정책 데이터 기준으로 관련성이 있으나 일부 조건은 추가 확인이 필요합니다."

    return "사용자 질문과 조건에 대해 검색 유사도가 높은 항목입니다."


def _build_cautions(policy: dict[str, Any]) -> list[str]:
    cautions = _safe_list(policy.get("cautions"))
    blockers = _safe_list(policy.get("blockers"))

    if blockers:
        cautions += [f"불충족 가능 조건: {item}" for item in blockers]

    return list(dict.fromkeys(cautions))


def _build_sources(recommendations: list[dict[str, Any]]) -> list[dict[str, str]]:
    sources = []

    for item in recommendations:
        source_url = item.get("source_url")
        if source_url:
            sources.append(
                {
                    "title": item.get("title") or "출처",
                    "url": source_url,
                }
            )

    return sources


def _extract_field_from_text(text: str, field_name: str) -> str:
    if not text:
        return ""

    import re

    known_fields = [
        "policy_summary",
        "support_content",
        "application_period_text",
        "application_method",
        "required_documents",
        "screening_method",
        "application_url",
        "age_text",
        "region_codes",
        "income_condition",
        "employment_status",
        "source_url",
    ]

    pattern = rf"{re.escape(field_name)}\s*:\s*(.*?)(?=\n?(?:{'|'.join(map(re.escape, known_fields))})\s*:|$)"
    match = re.search(pattern, text, flags=re.DOTALL)

    if not match:
        return ""

    return match.group(1).strip()


def _build_empty_message_response() -> dict[str, Any]:
    return {
        "answer": "질문을 입력해 주세요.",
        "recommendations": [],
        "sources": [],
        "warnings": ["질문 내용이 비어 있습니다."],
        "error": "EMPTY_MESSAGE",
        "meta": {},
    }


def _build_fallback_response(
    error_code: str = ERROR_UNKNOWN,
    user_message: str = FALLBACK_ANSWER,
    detail: str = "",
) -> dict[str, Any]:
    return {
        "answer": user_message or FALLBACK_ANSWER,
        "recommendations": [],
        "sources": [],
        "warnings": [user_message or FALLBACK_ANSWER],
        "error": error_code,
        "meta": {
            "error_code": error_code,
            "error_detail": _safe_str(detail),
            "fallback_used": True,
        },
    }


def _safe_str(value: Any, default: str = "") -> str:
    if value is None:
        return default

    text = str(value).strip()

    if not text or text.lower() in {"none", "null"}:
        return default

    return text


def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except Exception:
        return default


def _safe_bool(value: Any, default: bool = True) -> bool:
    if value is None:
        return default

    if isinstance(value, bool):
        return value

    text = str(value).strip().lower()

    if text in {"true", "1", "yes", "y"}:
        return True

    if text in {"false", "0", "no", "n"}:
        return False

    return default


def _safe_list(value: Any) -> list[str]:
    if value is None:
        return []

    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]

    text = str(value).strip()
    return [text] if text else []


def _safe_tool_trace(value: Any) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        return []

    trace = []

    for item in value:
        if isinstance(item, dict):
            trace.append(item)
        else:
            trace.append({"observation": str(item)})

    return trace

def _normalize_display_text(value: Any, default: str = EMPTY_DISPLAY_TEXT) -> str:
    text = _safe_str(value)

    if not text:
        return default

    if text in {"None", "null", "unknown", "제공된 데이터에는 정보가 없습니다."}:
        return default

    return text


def _truncate_for_card(value: Any, max_chars: int = CARD_TEXT_MAX_CHARS) -> str:
    text = _normalize_display_text(value)

    if text == EMPTY_DISPLAY_TEXT:
        return text

    text = " ".join(text.split())

    if len(text) <= max_chars:
        return text

    return text[:max_chars].rstrip() + "..."


def _limit_card_list(value: Any, max_items: int = CARD_LIST_MAX_ITEMS) -> list[str]:
    items = _safe_list(value)
    return items[:max_items]


def _first_non_empty(*values: Any) -> str | None:
    for value in values:
        text = _safe_str(value)
        if text:
            return text
    return None