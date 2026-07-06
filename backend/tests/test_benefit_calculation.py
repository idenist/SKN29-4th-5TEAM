# scripts/test_benefit_calculation.py
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from apps.chat_rag.services import _build_benefit_info

def check(name, result, expected):
    print(f"\n[{name}]")
    print("benefit_estimate_available =", result["benefit_estimate_available"])
    print("benefit_amount_text =", result["benefit_amount_text"])
    print("benefit_period_text =", result["benefit_period_text"])
    print("max_total_benefit_text =", result["max_total_benefit_text"])
    print("benefit_calculation_text =", result["benefit_calculation_text"])

    for key, value in expected.items():
        actual = result.get(key)
        assert actual == value, f"{key}: expected={value}, actual={actual}"


def main():
    # TC-BENEFIT-01: 월 단위 금액 + 개월 수가 명확한 경우
    result = _build_benefit_info(
        summary="청년 월세를 월 최대 20만원씩 최대 12개월 지원합니다.",
        support_content="월 최대 20만원, 최대 12개월 지원",
        text="지원 내용: 청년 월세를 월 최대 20만원씩 최대 12개월 지원합니다.",
    )

    check(
        "TC-BENEFIT-01 월 20만원 x 12개월",
        result,
        {
            "benefit_estimate_available": True,
            "benefit_amount_text": "월 최대 20만원",
            "benefit_period_text": "최대 12개월",
            "benefit_amount_number": 20,
            "benefit_amount_unit": "만원",
            "benefit_period_months": 12,
            "max_total_benefit_text": "최대 240만원",
            "benefit_calculation_text": "월 최대 20만원 × 최대 12개월 = 최대 240만원",
        },
    )

    # TC-BENEFIT-02: 연 단위 기간도 월 수로 변환되는지 확인
    result = _build_benefit_info(
        summary="매월 10만원씩 최대 1년 지원합니다.",
        support_content="매월 10만원, 최대 1년 지원",
        text="지원 내용: 매월 10만원씩 최대 1년 지원합니다.",
    )

    check(
        "TC-BENEFIT-02 매월 10만원 x 1년",
        result,
        {
            "benefit_estimate_available": True,
            "benefit_amount_text": "매월 10만원",
            "benefit_period_text": "최대 1년",
            "benefit_amount_number": 10,
            "benefit_amount_unit": "만원",
            "benefit_period_months": 12,
            "max_total_benefit_text": "최대 120만원",
            "benefit_calculation_text": "매월 10만원 × 최대 1년 = 최대 120만원",
        },
    )

    # TC-BENEFIT-03: 금액은 있지만 기간이 불명확한 경우 계산하지 않음
    result = _build_benefit_info(
        summary="청년에게 최대 50만원을 지원합니다.",
        support_content="최대 50만원 지원",
        text="지원 내용: 청년에게 최대 50만원을 지원합니다.",
    )

    check(
        "TC-BENEFIT-03 기간 불명확",
        result,
        {
            "benefit_estimate_available": False,
            "benefit_amount_text": "최대 50만원",
            "benefit_period_text": "원문 확인 필요",
            "benefit_amount_number": 50,
            "benefit_amount_unit": "만원",
            "benefit_period_months": None,
            "max_total_benefit_text": "원문 확인 필요",
            "benefit_calculation_text": "지원 금액 또는 지원 기간이 명확하지 않아 자동 계산하지 않았습니다.",
        },
    )

    # TC-BENEFIT-04: 무이자 보증금 지원은 개인별 조건 차이로 자동 합산하지 않음
    result = _build_benefit_info(
        summary="임차보증금 무이자 지원",
        support_content="청년 임차보증금 무이자 지원",
        text="지원 내용: 임차보증금 무이자 지원",
    )

    check(
        "TC-BENEFIT-04 무이자 지원",
        result,
        {
            "benefit_estimate_available": False,
            "benefit_type": "interest_free_deposit",
            "max_total_benefit_text": "무이자 지원",
            "benefit_calculation_text": "보증금 무이자 지원은 개인별 보증금 규모에 따라 혜택이 달라져 자동 합산하지 않았습니다.",
        },
    )

    print("\n모든 지원금 계산 테스트 통과")


if __name__ == "__main__":
    main()