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
BENEFIT_TEXT_MAX_CHARS = 160

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
            recommendations.append(
                _policy_to_recommendation(
                    policy,
                    user_conditions=conditions,
                )
            )
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

def _policy_to_recommendation(
    policy: dict[str, Any],
    user_conditions: dict[str, Any] | None = None,
) -> dict[str, Any]:
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

    personalization_info = _build_personalization_info(
        policy=policy,
        domain=domain,
        eligibility=eligibility,
        user_conditions=user_conditions,
    )
    
    benefit_info = _build_benefit_info(
        summary=summary,
        support_content=raw_support_content,
        text=text,
    )
    
    eligibility_display = _build_eligibility_display(
        eligibility=eligibility,
        matched_conditions=personalization_info["matched_user_conditions"],
        missing_conditions=personalization_info["missing_user_conditions"],
        blockers=policy.get("blockers"),
        cautions=cautions,
        is_expired=is_expired,
        deadline_status=deadline_status,
    )
    
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

        # 개인화 추천/혜택 표시용 필드
        "personalized_reason": personalization_info["personalized_reason"],
        "matched_user_conditions": personalization_info["matched_user_conditions"],
        "missing_user_conditions": personalization_info["missing_user_conditions"],
        "benefit_summary": benefit_info["benefit_summary"],
        "benefit_amount_text": benefit_info["benefit_amount_text"],
        "benefit_period_text": benefit_info["benefit_period_text"],
        "estimated_benefit_text": benefit_info["estimated_benefit_text"],
        
        # 6-7 예상 지원금 계산 표시용 필드
        "benefit_estimate_available": benefit_info["benefit_estimate_available"],
        "benefit_type": benefit_info["benefit_type"],
        "benefit_amount_number": benefit_info["benefit_amount_number"],
        "benefit_amount_unit": benefit_info["benefit_amount_unit"],
        "benefit_period_months": benefit_info["benefit_period_months"],
        "max_total_benefit_text": benefit_info["max_total_benefit_text"],
        "benefit_calculation_text": benefit_info["benefit_calculation_text"],
        "benefit_calculation_notice": benefit_info["benefit_calculation_notice"],

        # 신청 가능성 표시용 필드
        "eligibility_label": eligibility_display["eligibility_label"],
        "eligibility_status": eligibility_display["eligibility_status"],
        "eligibility_badge_text": eligibility_display["eligibility_badge_text"],
        "eligibility_badge_type": eligibility_display["eligibility_badge_type"],
        "eligibility_reason": eligibility_display["eligibility_reason"],
        "eligibility_check_items": eligibility_display["eligibility_check_items"],
        
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

def _build_personalization_info(
    policy: dict[str, Any],
    domain: str | None,
    eligibility: str,
    user_conditions: dict[str, Any] | None = None,
) -> dict[str, Any]:
    user_conditions = user_conditions or {}

    matched = _normalize_condition_labels(policy.get("matched_conditions"))
    missing = _normalize_condition_labels(policy.get("missing_conditions"))
    blockers = _normalize_condition_labels(policy.get("blockers"))

    if domain and "관심분야" not in matched:
        matched.append("관심분야")

    user_has_income = bool(user_conditions.get("income"))
    user_has_employment = bool(user_conditions.get("employment_status"))

    # 사용자 입력에 없는 소득/고용 상태는 매칭이 아니라 추가 확인으로 본다.
    if not user_has_income and "소득" in matched:
        matched = [item for item in matched if item != "소득"]
        missing.append("소득")

    if not user_has_employment and "고용 상태" in matched:
        matched = [item for item in matched if item != "고용 상태"]
        missing.append("고용 상태")

    missing.extend(blockers)

    matched = _unique_keep_order(matched)[:3]
    missing = [
        item for item in _unique_keep_order(missing)
        if item not in matched
    ][:3]

    if matched:
        reason = f"{', '.join(matched)} 조건이 사용자 입력과 매칭됩니다."
    elif eligibility == "가능성 높음":
        reason = "사용자 조건과 주요 자격이 비교적 잘 맞는 항목입니다."
    else:
        reason = "사용자 질문과 관련성이 높은 항목입니다."

    if missing:
        reason += f" 다만 {', '.join(missing)} 조건은 추가 확인이 필요합니다."

    return {
        "personalized_reason": reason,
        "matched_user_conditions": matched,
        "missing_user_conditions": missing,
    }

def _build_eligibility_display(
    eligibility: str,
    matched_conditions: list[str],
    missing_conditions: list[str],
    blockers: Any,
    cautions: list[str],
    is_expired: bool,
    deadline_status: str,
) -> dict[str, Any]:
    blockers_list = _normalize_condition_labels(blockers)

    if is_expired or deadline_status == "expired":
        status = "low"
        badge_text = "신청 어려움"
        badge_type = "danger"
        label = "가능성 낮음"
    elif eligibility == "가능성 높음":
        status = "high"
        badge_text = "가능성 높음"
        badge_type = "success"
        label = "가능성 높음"
    elif blockers_list:
        status = "low"
        badge_text = "신청 어려움"
        badge_type = "danger"
        label = "가능성 낮음"
    else:
        status = "needs_check"
        badge_text = "확인 필요"
        badge_type = "warning"
        label = "추가 확인 필요"

    check_items = _build_eligibility_check_items(
        matched_conditions=matched_conditions,
        missing_conditions=missing_conditions,
        blockers=blockers_list,
        cautions=cautions,
    )

    reason = _build_eligibility_reason(
        label=label,
        matched_conditions=matched_conditions,
        missing_conditions=missing_conditions,
        blockers=blockers_list,
        is_expired=is_expired,
        deadline_status=deadline_status,
    )

    return {
        "eligibility_label": label,
        "eligibility_status": status,
        "eligibility_badge_text": badge_text,
        "eligibility_badge_type": badge_type,
        "eligibility_reason": reason,
        "eligibility_check_items": check_items,
    }


def _build_eligibility_check_items(
    matched_conditions: list[str],
    missing_conditions: list[str],
    blockers: list[str],
    cautions: list[str],
) -> list[dict[str, str]]:
    items = []

    for label in matched_conditions:
        items.append({
            "label": label,
            "status": "matched",
            "display_status": "충족 가능",
        })

    for label in missing_conditions:
        items.append({
            "label": label,
            "status": "needs_check",
            "display_status": "확인 필요",
        })

    for label in blockers:
        items.append({
            "label": label,
            "status": "unmatched",
            "display_status": "불충족 가능",
        })

    if cautions and not any(item["label"] == "상세 조건" for item in items):
        items.append({
            "label": "상세 조건",
            "status": "needs_check",
            "display_status": "확인 필요",
        })

    deduped = []
    seen = set()

    for item in items:
        key = item["label"]
        if key in seen:
            continue
        seen.add(key)
        deduped.append(item)

    return deduped[:5]


def _build_eligibility_reason(
    label: str,
    matched_conditions: list[str],
    missing_conditions: list[str],
    blockers: list[str],
    is_expired: bool,
    deadline_status: str,
) -> str:
    if is_expired or deadline_status == "expired":
        return "신청 또는 접수 기간이 마감된 것으로 보여 신청 가능성이 낮습니다."

    if blockers:
        return f"{', '.join(blockers[:2])} 조건이 맞지 않을 가능성이 있어 신청 가능성이 낮습니다."

    if label == "가능성 높음":
        if matched_conditions:
            return f"{', '.join(matched_conditions[:3])} 조건이 충족되어 신청 가능성이 높습니다."
        return "주요 조건이 비교적 잘 맞아 신청 가능성이 높습니다."

    if matched_conditions and missing_conditions:
        return (
            f"{', '.join(matched_conditions[:3])} 조건은 매칭되지만, "
            f"{', '.join(missing_conditions[:3])} 조건은 추가 확인이 필요합니다."
        )

    if missing_conditions:
        return f"{', '.join(missing_conditions[:3])} 조건은 추가 확인이 필요합니다."

    return "검색 결과와 사용자 질문의 관련성은 있으나, 세부 신청 조건은 원문 확인이 필요합니다."

def _normalize_condition_labels(value: Any) -> list[str]:
    items = _safe_list(value)
    labels = []

    for item in items:
        text = str(item).strip()
        lower = text.lower()

        if any(k in lower for k in ("age", "나이", "연령", "만 ")):
            labels.append("나이")
        elif any(k in lower for k in ("region", "지역", "거주", "서울", "부산", "경기")):
            labels.append("지역")
        elif any(k in lower for k in ("domain", "interest", "관심", "분야", "주거", "취업", "교육", "창업", "금융", "복지")):
            labels.append("관심분야")
        elif any(k in lower for k in ("income", "소득", "재산")):
            labels.append("소득")
        elif any(k in lower for k in ("employment", "job", "고용", "취업", "미취업")):
            labels.append("고용 상태")
        elif any(k in lower for k in ("housing", "주거", "무주택", "임차", "월세")):
            labels.append("주거 상태")
        elif any(k in lower for k in ("deadline", "마감", "신청기간", "접수기간")):
            labels.append("신청 상태")
        else:
            labels.append(text[:20])

    return _unique_keep_order(labels)


def _build_benefit_info(
    summary: Any,
    support_content: Any,
    text: Any,
) -> dict[str, str]:
    corpus = "\n".join(
        [
            _safe_str(summary),
            _safe_str(support_content),
            _safe_str(text),
        ]
    )

    benefit_line = _find_benefit_line(corpus)
    amount_text = _extract_benefit_amount(benefit_line)
    period_text = _extract_benefit_period(benefit_line)

    benefit_summary = _build_benefit_summary(
        benefit_line=benefit_line,
        amount_text=amount_text,
        period_text=period_text,
        corpus=corpus,
    )

    estimated_text = _build_estimated_benefit_text(
        amount_text=amount_text,
        period_text=period_text,
        benefit_summary=benefit_summary,
    )
    
    calculation_info = _build_benefit_calculation_info(
        amount_text=amount_text,
        period_text=period_text,
        benefit_summary=benefit_summary,
    )

    return {
        "benefit_summary": benefit_summary,
        "benefit_amount_text": amount_text or "원문 확인 필요",
        "benefit_period_text": period_text or "원문 확인 필요",
        "estimated_benefit_text": estimated_text,
        "benefit_estimate_available": calculation_info["benefit_estimate_available"],
        "benefit_type": calculation_info["benefit_type"],
        "benefit_amount_number": calculation_info["benefit_amount_number"],
        "benefit_amount_unit": calculation_info["benefit_amount_unit"],
        "benefit_period_months": calculation_info["benefit_period_months"],
        "max_total_benefit_text": calculation_info["max_total_benefit_text"],
        "benefit_calculation_text": calculation_info["benefit_calculation_text"],
        "benefit_calculation_notice": calculation_info["benefit_calculation_notice"],
    }

def _find_benefit_line(text: str) -> str:
    if not text:
        return ""

    import re

    candidates = re.split(r"[\n\r]+|(?<=다\.)\s+|(?<=요\.)\s+", text)

    benefit_keywords = (
        "지원",
        "지급",
        "보조",
        "월세",
        "임대료",
        "보증금",
        "무이자",
        "지원금",
        "혜택",
    )

    exclude_keywords = (
        "신청서",
        "제출",
        "서류",
        "가족관계증명서",
        "통장",
        "사업 기간",
        "신청기간",
        "접수기간",
    )

    amount_pattern = r"(?:월|매월)?\s*(?:최대\s*)?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?\s*(?:억원|만원|천원|원)"

    for candidate in candidates:
        line = " ".join(str(candidate).split())

        if not line:
            continue

        has_benefit_keyword = any(keyword in line for keyword in benefit_keywords)
        has_amount_or_free = bool(re.search(amount_pattern, line)) or "무이자" in line

        if not has_benefit_keyword or not has_amount_or_free:
            continue

        if any(keyword in line for keyword in exclude_keywords):
            continue

        return _clean_benefit_text(line)

    return ""


def _extract_benefit_amount(text: str) -> str:
    if not text:
        return ""

    import re

    patterns = [
        r"(?:월|매월)\s*(?:최대\s*)?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?\s*(?:억원|만원|천원|원)",
        r"최대\s*(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?\s*(?:억원|만원|천원|원)",
        r"(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?\s*(?:억원|만원|천원|원)",
    ]

    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return " ".join(match.group(0).split())

    if "무이자" in text:
        return "무이자 지원"

    return ""


def _extract_benefit_period(text: str) -> str:
    if not text:
        return ""

    import re

    match = re.search(r"(?:최대\s*)?\d+\s*(?:개월|년|회)", text)

    if not match:
        return ""

    return " ".join(match.group(0).split())


def _build_benefit_summary(
    benefit_line: str,
    amount_text: str,
    period_text: str,
    corpus: str,
) -> str:
    if benefit_line:
        return _truncate_for_card(benefit_line, BENEFIT_TEXT_MAX_CHARS)

    if "월세" in corpus or "임대료" in corpus:
        return "월세·임대료 부담 완화 관련 지원입니다."

    if "보증금" in corpus or "임차" in corpus:
        return "임차보증금 또는 주거비 부담 완화 관련 지원입니다."

    if "교육" in corpus or "훈련" in corpus:
        return "교육·훈련 참여를 지원하는 항목입니다."

    if "창업" in corpus or "사업화" in corpus:
        return "창업 또는 사업화를 지원하는 항목입니다."

    if amount_text or period_text:
        parts = [part for part in [amount_text, period_text] if part]
        return f"{', '.join(parts)} 관련 지원입니다."

    return "혜택 세부 내용은 원문 확인 필요"

def _clean_benefit_text(value: Any) -> str:
    text = _safe_str(value)

    if not text:
        return ""

    text = " ".join(text.split())
    text = text.lstrip("-•·ㅇ ").strip()

    return text

def _build_estimated_benefit_text(
    amount_text: str,
    period_text: str,
    benefit_summary: str,
) -> str:
    if amount_text == "무이자 지원":
        return "임차보증금 무이자 지원 가능성이 있습니다."

    if amount_text and period_text:
        if amount_text.endswith("지원"):
            return f"{amount_text}, {period_text} 가능성이 있습니다."
        return f"{amount_text}, {period_text} 지원 가능성이 있습니다."

    if amount_text:
        if amount_text.endswith("지원"):
            return f"{amount_text} 가능성이 있습니다."
        return f"{amount_text} 지원 가능성이 있습니다."

    if "무이자" in benefit_summary:
        return "임차보증금 무이자 지원 가능성이 있습니다."

    return "정확한 지원금은 원문 확인 필요"

def _build_benefit_calculation_info(
    amount_text: str,
    period_text: str,
    benefit_summary: str,
) -> dict[str, Any]:
    benefit_type = _infer_benefit_type(
        amount_text=amount_text,
        benefit_summary=benefit_summary,
    )

    if benefit_type == "interest_free_deposit":
        return {
            "benefit_estimate_available": False,
            "benefit_type": benefit_type,
            "benefit_amount_number": None,
            "benefit_amount_unit": None,
            "benefit_period_months": None,
            "max_total_benefit_text": "무이자 지원",
            "benefit_calculation_text": "보증금 무이자 지원은 개인별 보증금 규모에 따라 혜택이 달라져 자동 합산하지 않았습니다.",
            "benefit_calculation_notice": "정확한 혜택 규모는 보증금, 계약 조건, 원문 기준에 따라 달라질 수 있습니다.",
        }

    amount_value, amount_unit, payment_cycle = _parse_amount_value(amount_text)
    period_months = _parse_period_months(period_text)

    if amount_value is None or period_months is None:
        return {
            "benefit_estimate_available": False,
            "benefit_type": benefit_type,
            "benefit_amount_number": amount_value,
            "benefit_amount_unit": amount_unit,
            "benefit_period_months": period_months,
            "max_total_benefit_text": "원문 확인 필요",
            "benefit_calculation_text": "지원 금액 또는 지원 기간이 명확하지 않아 자동 계산하지 않았습니다.",
            "benefit_calculation_notice": "원문에서 실제 지원 금액, 지원 기간, 본인 부담 조건을 확인해야 합니다.",
        }

    if payment_cycle != "월":
        return {
            "benefit_estimate_available": False,
            "benefit_type": benefit_type,
            "benefit_amount_number": amount_value,
            "benefit_amount_unit": amount_unit,
            "benefit_period_months": period_months,
            "max_total_benefit_text": "원문 확인 필요",
            "benefit_calculation_text": "월 단위 지원금이 아니어서 총액을 자동 계산하지 않았습니다.",
            "benefit_calculation_notice": "지원 주기와 지급 방식은 원문 기준으로 확인해야 합니다.",
        }

    total_value = amount_value * period_months
    total_text = _format_money_text(total_value, amount_unit)

    return {
        "benefit_estimate_available": True,
        "benefit_type": benefit_type,
        "benefit_amount_number": amount_value,
        "benefit_amount_unit": amount_unit,
        "benefit_period_months": period_months,
        "max_total_benefit_text": f"최대 {total_text}",
        "benefit_calculation_text": (
            f"{amount_text} × {period_text} = 최대 {total_text}"
        ),
        "benefit_calculation_notice": "실제 지원액은 소득, 월세액, 거주요건, 중복 수급 여부에 따라 달라질 수 있습니다.",
    }


def _infer_benefit_type(amount_text: str, benefit_summary: str) -> str:
    corpus = f"{amount_text} {benefit_summary}"

    if "무이자" in corpus or "보증금" in corpus:
        return "interest_free_deposit"

    if "월세" in corpus or "임대료" in corpus or "월 최대" in corpus or "매월" in corpus:
        return "monthly_cash"

    if amount_text:
        return "cash"

    return "unknown"


def _parse_amount_value(amount_text: str) -> tuple[float | None, str | None, str | None]:
    if not amount_text:
        return None, None, None

    import re

    text = _safe_str(amount_text)
    payment_cycle = "월" if ("월" in text or "매월" in text) else None

    match = re.search(
        r"(\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?\s*(억원|만원|천원|원)",
        text,
    )

    if not match:
        return None, None, payment_cycle

    number_text = match.group(1).replace(",", "")
    unit = match.group(2)

    try:
        value = float(number_text)
    except Exception:
        return None, unit, payment_cycle

    if value.is_integer():
        value = int(value)

    return value, unit, payment_cycle


def _parse_period_months(period_text: str) -> int | None:
    if not period_text:
        return None

    import re

    text = _safe_str(period_text)

    match = re.search(r"(\d+)\s*개월", text)
    if match:
        return int(match.group(1))

    match = re.search(r"(\d+)\s*년", text)
    if match:
        return int(match.group(1)) * 12

    return None


def _format_money_text(value: float | int, unit: str | None) -> str:
    if unit == "만원":
        if float(value).is_integer():
            value = int(value)
        return f"{value:,}만원"

    if unit == "원":
        if float(value).is_integer():
            value = int(value)
        return f"{value:,}원"

    if unit == "천원":
        if float(value).is_integer():
            value = int(value)
        return f"{value:,}천원"

    if unit == "억원":
        if float(value).is_integer():
            value = int(value)
        return f"{value:,}억원"

    if float(value).is_integer():
        value = int(value)

    return f"{value:,}"

def _unique_keep_order(items: list[str]) -> list[str]:
    result = []

    for item in items:
        text = _safe_str(item)
        if text and text not in result:
            result.append(text)

    return result

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