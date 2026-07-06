# 팀원 공유용: AI 챗봇 API 연동 및 확인 필요 사항

## 1. 현재 상태

AI Backend / LLM Integration 파트는 6-1~6-9까지 1차 작업이 완료된 상태입니다.

현재 `/api/ai/chat/` API는 사용자 질문과 프로필 조건을 받아 RAG 기반 정책 추천 결과와 AI 답변을 반환합니다.

```http
POST /api/ai/chat/
```

요청 예시:

```json
{
  "message": "서울에 사는 25세 청년이 받을 수 있는 월세 지원 정책 알려줘",
  "user_profile": {
    "age": 25,
    "region": "서울",
    "interests": ["주거"]
  },
  "top_k": 5
}
```

---

## 2. 프론트엔드에서 주로 사용할 필드

`data.recommendations` 배열을 추천 카드로 렌더링하면 됩니다.

우선 사용 가능 필드:

```text
title
domain
display_summary
display_period
display_action_text
badges
action_url
has_detail_url
personalized_reason
eligibility_badge_text
eligibility_badge_type
eligibility_check_items
max_total_benefit_text
benefit_calculation_text
benefit_calculation_notice
```

### 추천 카드 표시 예시

```text
정책명: 청년월세 한시 특별지원
신청 가능성: 확인 필요
예상 혜택: 최대 480만원
계산 근거: 월 최대 20만원 × 최대 24개월 = 최대 480만원
추천 이유: 나이, 지역, 관심분야 조건이 사용자 입력과 매칭됩니다.
추가 확인: 소득, 고용 상태
```

---

## 3. 신청 가능성 표시 규칙

신청 가능성은 다음 필드를 사용하면 됩니다.

```text
eligibility_label
eligibility_status
eligibility_badge_text
eligibility_badge_type
eligibility_reason
eligibility_check_items
```

색상 분기는 `eligibility_badge_type` 기준으로 하면 됩니다.

| 값 | 의미 | UI 예시 |
| --- | --- | --- |
| `success` | 가능성 높음 | 초록 |
| `warning` | 확인 필요 | 노랑/주황 |
| `danger` | 신청 어려움 | 빨강 |

---

## 4. 예상 혜택 표시 규칙

혜택 정보는 다음 필드를 사용하면 됩니다.

```text
benefit_summary
benefit_amount_text
benefit_period_text
estimated_benefit_text
benefit_estimate_available
max_total_benefit_text
benefit_calculation_text
benefit_calculation_notice
```

`benefit_estimate_available`이 `true`이면 자동 계산된 최대 예상 지원금이 있는 경우입니다.

`false`이면 금액 또는 기간이 불명확하거나, 무이자 지원처럼 개인 조건에 따라 혜택이 달라져 자동 합산하지 않은 경우입니다.

---

## 5. 백엔드 공통 API 쪽 확인 필요

다음 항목은 백엔드 공통 작업과 맞춰야 합니다.

- `/api/ai/chat/` URL을 그대로 유지할지
- 응답 구조를 `success / data / message / error`로 통일할지
- AI 챗봇 API에 로그인이 필요한지
- 로그인 사용자 프로필을 자동으로 AI 요청에 반영할지
- CORS/CSRF 설정이 프론트 배포 주소와 맞는지
- Nginx에서 `/api/ai/chat/` 요청이 backend로 정상 프록시되는지

---

## 6. 데이터 / AWS 쪽 확인 필요

AI 챗봇은 아래 항목에 의존합니다.

```text
CHROMA_PERSIST_DIR
OPENAI_API_KEY
외부 검색 API Key
```

배포 환경에서 확인해야 할 사항:

- Chroma Vector DB 경로를 `/app/data/vector_db`로 유지할지
- Vector DB 파일을 서버에 어떻게 올릴지
- 정책 데이터 갱신 후 Vector DB 재생성 흐름을 어떻게 가져갈지
- OpenAI API Key를 어디에서 주입할지
- 운영 DB를 Compose PostgreSQL로 둘지, AWS RDS로 둘지
- EC2 보안 그룹에서 8000/5432 포트를 외부에 직접 공개하지 않는지

---

## 7. 프론트와 꼭 맞춰야 하는 질문

```text
1. 카드 버튼 링크는 action_url / application_url / source_url 중 무엇을 우선할까요?
2. eligibility_check_items는 카드에 모두 보여줄까요, 접었다 펼치는 방식으로 둘까요?
3. max_total_benefit_text는 카드 상단에 강조할까요, 상세 영역에 둘까요?
4. AI 챗봇은 비로그인 사용자도 사용할 수 있게 할까요?
5. 로그인 사용자 프로필이 있으면 user_profile을 프론트에서 보내나요, 백엔드에서 자동 병합하나요?
6. AI 응답 실패 시 프론트는 error.code 기준으로 메시지를 분기할까요?
```

---

## 8. 한 줄 요약

AI 챗봇 API는 1차 연동 가능한 상태이며, 이제 프론트 카드 필드명, 로그인 사용자 프로필 반영 방식, Vector DB/환경변수/배포 경로만 팀 내에서 맞추면 됩니다.
