# 6. AI Backend / LLM Integration 종합 작업 보고서

## 1. 문서 목적

이 문서는 4차 프로젝트에서 AI Backend / LLM Integration 담당 파트의 6-1~6-9 작업 내용을 종합 정리한 문서다.

작업 범위는 기존 RAG/LLM 기반 청년 지원 정보 추천 로직을 4차 프로젝트의 React + Django 구조에 맞게 이식하고, 프론트엔드·백엔드·데이터·배포 작업과 연결 가능한 형태로 안정화하는 것이었다.

또한 팀원들이 알아야 하는 API 응답 구조, 프론트 카드 연동 필드, 배포 환경 영향 지점, 추후 확인이 필요한 사항을 함께 정리한다.

---

## 2. 전체 진행 요약

| 구분 | 작업명 | 상태 |
| --- | --- | --- |
| 6-1 | 기존 RAG/LLM 기능 Django 구조 이식 | 1차 완료 |
| 6-2 | AI 챗봇 API 입력 처리 및 내부 검색 안정화 | 1차 완료 |
| 6-3 | AI 응답 품질 및 프론트 카드 응답 구조 개선 | 1차 완료 |
| 6-4 | 예외 처리 및 실패 응답 안정화 | 1차 완료 |
| 6-5 | 개인화 추천 근거 및 혜택 요약 필드 추가 | 1차 완료 |
| 6-6 | 신청 가능성 표시 구조 안정화 | 1차 완료 |
| 6-7 | 예상 지원금 계산 필드 추가 | 1차 완료 |
| 6-8 | 시스템 구성도 및 AI 챗봇 처리 흐름 문서화 | 1차 완료 |
| 6-9 | AWS / 보안 그룹 / 배포 정보 반영 초안 | 1차 완료 |

현재 기준으로 기능 자체는 한 번씩 모두 구현 또는 문서화가 끝난 상태다. 이후 작업은 팀원 작업물과 맞물리는 부분을 조율하고, 실제 프론트/배포 환경에서 깨지는 부분을 맞추는 단계다.

---

## 3. 6-1~6-4 핵심 작업 정리

### 3-1. Django 구조 이식

기존 RAG/LLM 로직을 4차 프로젝트 Django 구조에 맞게 분리했다.

```text
apps/chat_rag/  : AI 챗봇 API 요청/응답 처리
rag_engine/     : 검색, 라우팅, 답변 생성, fallback 등 RAG 핵심 로직
```

`/api/ai/chat/` 엔드포인트를 통해 프론트엔드가 AI 챗봇 기능을 호출할 수 있도록 연결했다.

View는 요청 검증과 응답 반환을 담당하고, 실제 AI 처리 로직은 Service 계층으로 위임하는 방식으로 정리했다.

---

### 3-2. API 입력 처리 및 내부 검색 안정화

AI 챗봇 API는 다음 입력을 받는다.

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

사용자 프로필의 `age`, `region`, `interests`는 내부적으로 정규화되어 `meta.user_conditions`에 반영된다.

예를 들어 `region=서울`은 `region_code=11000`으로 변환되어 검색 조건에 활용된다.

정책 질문에서 데이터 유형이 섞이는 문제를 줄이기 위해 `source_category` 기반 검색 흐름을 개선했다.

---

### 3-3. AI 응답 품질 및 카드 구조 개선

월세/주거 질문에서 주거 관련 정책 중심으로 추천 결과가 정리되도록 검색 후보 정렬과 필터링을 개선했다.

또한 LLM 답변이 과도하게 길어지거나 중간에 끊기지 않도록 프롬프트 입력 데이터와 답변 형식을 조정했다.

프론트 카드에서 바로 사용할 수 있도록 다음 필드를 추가했다.

```text
display_summary
display_period
display_action_text
badges
action_url
has_detail_url
```

---

### 3-4. 예외 처리 및 실패 응답 안정화

요청 검증 단계에서 빈 질문, 잘못된 `top_k` 값 등을 일관된 에러 응답으로 반환하도록 정리했다.

대표 에러 코드는 다음과 같다.

```text
EMPTY_MESSAGE
INVALID_TOP_K
INVALID_USER_PROFILE
WORKFLOW_PARSE_ERROR
AI_CONNECTION_ERROR
LLM_RATE_LIMIT
LLM_TIMEOUT
LLM_AUTH_ERROR
VECTOR_DB_ERROR
AI_SERVICE_ERROR
```

실패 응답에서도 다음 공통 구조를 유지한다.

```json
{
  "success": false,
  "data": {
    "answer": "",
    "warnings": [],
    "error": {
      "code": "EMPTY_MESSAGE",
      "message": "질문 내용을 입력해 주세요."
    },
    "meta": {
      "error_code": "EMPTY_MESSAGE",
      "fallback_used": true
    }
  },
  "message": "질문 내용을 입력해 주세요.",
  "error": {
    "code": "EMPTY_MESSAGE",
    "message": "질문 내용을 입력해 주세요."
  }
}
```

---

## 4. 6-5~6-7 핵심 작업 정리

### 4-1. 개인화 추천 근거

추천 카드에서 “왜 이 정책이 사용자에게 맞는지” 보여줄 수 있도록 개인화 추천 근거 필드를 추가했다.

```text
personalized_reason
matched_user_conditions
missing_user_conditions
```

예시:

```json
{
  "personalized_reason": "나이, 지역, 관심분야 조건이 사용자 입력과 매칭됩니다. 다만 고용 상태, 소득 조건은 추가 확인이 필요합니다.",
  "matched_user_conditions": ["나이", "지역", "관심분야"],
  "missing_user_conditions": ["고용 상태", "소득"]
}
```

---

### 4-2. 신청 가능성 표시 구조

기존 `eligibility` 값을 프론트에서 바로 표시할 수 있도록 상태값과 뱃지 정보를 추가했다.

```text
eligibility_label
eligibility_status
eligibility_badge_text
eligibility_badge_type
eligibility_reason
eligibility_check_items
```

예시:

```json
{
  "eligibility_label": "추가 확인 필요",
  "eligibility_status": "needs_check",
  "eligibility_badge_text": "확인 필요",
  "eligibility_badge_type": "warning",
  "eligibility_reason": "나이, 지역, 관심분야 조건은 매칭되지만, 고용 상태, 소득 조건은 추가 확인이 필요합니다.",
  "eligibility_check_items": [
    {
      "label": "나이",
      "status": "matched",
      "display_status": "충족 가능"
    },
    {
      "label": "소득",
      "status": "needs_check",
      "display_status": "확인 필요"
    }
  ]
}
```

프론트에서는 이 값을 이용해 신청 가능성 뱃지와 조건 체크리스트를 구성할 수 있다.

---

### 4-3. 예상 혜택 및 지원금 계산

혜택 금액과 지원 기간이 명확한 경우 최대 예상 지원 총액을 계산하도록 했다.

```text
benefit_summary
benefit_amount_text
benefit_period_text
estimated_benefit_text
benefit_estimate_available
benefit_type
benefit_amount_number
benefit_amount_unit
benefit_period_months
max_total_benefit_text
benefit_calculation_text
benefit_calculation_notice
```

예시:

```json
{
  "benefit_summary": "월 최대 20만원 임대료 지원(최대 24개월)",
  "benefit_amount_text": "월 최대 20만원",
  "benefit_period_text": "최대 24개월",
  "benefit_estimate_available": true,
  "benefit_type": "monthly_cash",
  "benefit_amount_number": 20,
  "benefit_amount_unit": "만원",
  "benefit_period_months": 24,
  "max_total_benefit_text": "최대 480만원",
  "benefit_calculation_text": "월 최대 20만원 × 최대 24개월 = 최대 480만원",
  "benefit_calculation_notice": "실제 지원액은 소득, 월세액, 거주요건, 중복 수급 여부에 따라 달라질 수 있습니다."
}
```

무이자 지원처럼 개인별 조건에 따라 혜택 규모가 달라지는 항목은 자동 합산하지 않는다.

---

## 5. 6-8 시스템 구성 요약

현재 시스템은 다음 흐름으로 설명할 수 있다.

```text
사용자 브라우저
→ React Frontend
→ Nginx Reverse Proxy
→ Gunicorn
→ Django Backend API
→ AI Chat API
→ RAG Engine
→ Chroma Vector DB / OpenAI API / 공식 외부 출처 검색
```

AI 챗봇 내부 흐름은 다음과 같다.

```text
사용자 질문 + 프로필 조건
→ 요청 검증
→ Router: 분야/데이터 유형 판단
→ Internal Retriever: Vector DB 검색
→ 검색 결과 충분성 검사
→ 신청 가능성 판단
→ 추천 카드용 응답 구조 변환
→ 개인화 근거/예상 혜택 계산
→ LLM 답변 생성
→ API 응답 반환
```

프론트엔드는 `recommendations`에 포함된 카드용 필드를 사용해 정책명, 요약, 신청 가능성, 나에게 맞는 이유, 예상 혜택, 상세보기 버튼을 표시할 수 있다.

---

## 6. 6-9 배포 정보 요약

현재 Docker Compose 기준 배포 구조는 다음과 같다.

```text
docker-compose.yml
├── db        # PostgreSQL
├── backend   # Django + Gunicorn
└── nginx     # Nginx Reverse Proxy
```

주요 연결은 다음과 같다.

```text
Nginx : 외부 80 포트 수신
Backend : 내부 8000 포트
PostgreSQL : 5432 포트
Chroma Vector DB : ./data/vector_db → /app/data/vector_db
```

운영 배포 시 권장 방향은 다음과 같다.

```text
외부 공개: 80, 443
관리자 접근: 22, 관리자 IP만 허용
외부 직접 공개 비권장: 8000, 5432
```

RDS, S3, HTTPS, 도메인, React 배포 방식은 실제 배포 담당자 정보가 확정되면 문서에 추가 반영해야 한다.

---

## 7. 현재 API 계약

### 7-1. 요청

```http
POST /api/ai/chat/
Content-Type: application/json
```

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

### 7-2. 정상 응답

```json
{
  "success": true,
  "data": {
    "answer": "...",
    "recommendations": [],
    "sources": [],
    "warnings": [],
    "error": null,
    "meta": {
      "user_conditions": {},
      "route": "주거",
      "internal_search_sufficient": true,
      "external_used": false
    }
  },
  "message": "AI 응답 생성 성공",
  "error": null
}
```

### 7-3. 추천 카드 주요 필드

| 필드 | 의미 | 프론트 사용처 |
| --- | --- | --- |
| `title` | 정책명 | 카드 제목 |
| `domain` | 정책 분야 | 카드 카테고리 |
| `display_summary` | 카드용 요약 | 카드 본문 |
| `display_period` | 신청/접수 기간 | 기간 표시 |
| `display_action_text` | 버튼 문구 | CTA 버튼 |
| `action_url` | 신청/상세 URL | 버튼 링크 |
| `has_detail_url` | 상세 URL 존재 여부 | 버튼 노출 조건 |
| `badges` | 카드 뱃지 목록 | 카테고리/상태 뱃지 |
| `personalized_reason` | 개인화 추천 이유 | 추천 이유 영역 |
| `matched_user_conditions` | 사용자 조건 중 매칭된 항목 | 조건 체크 |
| `missing_user_conditions` | 추가 확인 필요한 항목 | 조건 체크 |
| `eligibility_label` | 신청 가능성 라벨 | 신청 가능성 표시 |
| `eligibility_status` | 신청 가능성 상태 코드 | UI 색상 분기 |
| `eligibility_badge_text` | 신청 가능성 뱃지 문구 | 뱃지 표시 |
| `eligibility_badge_type` | 뱃지 타입 | 색상 분기 |
| `eligibility_reason` | 신청 가능성 판단 근거 | 상세 설명 |
| `eligibility_check_items` | 조건별 체크리스트 | 조건 체크 UI |
| `benefit_summary` | 혜택 요약 | 혜택 영역 |
| `benefit_amount_text` | 지원 금액 | 혜택 영역 |
| `benefit_period_text` | 지원 기간 | 혜택 영역 |
| `max_total_benefit_text` | 최대 예상 총액 | 강조 표시 |
| `benefit_calculation_text` | 계산식 | 상세 설명 |
| `benefit_calculation_notice` | 계산 유의사항 | 안내 문구 |

---

## 8. 팀원 작업에 영향을 미치는 부분

### 8-1. Frontend 담당자 확인 필요

프론트엔드는 `/api/ai/chat/` 응답의 `recommendations` 필드를 기준으로 추천 카드 UI를 만들 수 있다.

특히 다음 필드를 우선 사용하면 된다.

```text
title
display_summary
display_period
badges
action_url
has_detail_url
personalized_reason
eligibility_badge_text
eligibility_badge_type
eligibility_check_items
max_total_benefit_text
benefit_calculation_text
```

프론트에서 확인해야 할 사항은 다음과 같다.

- 버튼 링크로 `action_url`, `application_url`, `source_url` 중 어떤 필드를 우선 사용할지
- `eligibility_badge_type` 값에 따른 색상 규칙
  - `success`
  - `warning`
  - `danger`
- `eligibility_check_items`를 카드에 모두 표시할지, 일부만 표시할지
- `max_total_benefit_text`를 카드 상단에 강조할지, 상세 영역에 표시할지
- 로딩 중 상태와 AI 응답 실패 상태를 어떻게 표시할지
- 비로그인 사용자도 AI 챗봇을 사용할 수 있는지

---

### 8-2. Backend Core 담당자 확인 필요

백엔드 공통 구조와 맞춰야 하는 항목은 다음과 같다.

- `/api/ai/chat/` URL prefix 유지 여부
- 공통 응답 구조 `success / data / message / error` 유지 여부
- AI 챗봇 API에 JWT 인증이 필요한지 여부
- 로그인 사용자 프로필을 자동으로 `user_profile`에 주입할지 여부
- CORS/CSRF 설정이 프론트 배포 주소와 맞는지 여부
- Nginx에서 `/api/ai/chat/` 요청이 정상적으로 backend로 프록시되는지 여부

현재 AI 챗봇 API는 비로그인 요청에서도 `user_profile`을 직접 받아 처리할 수 있는 구조다. 로그인 기반 개인화까지 연결하려면 사용자 DB의 프로필 정보를 AI 요청에 병합하는 작업이 추가로 필요하다.

---

### 8-3. Data / AWS 담당자 확인 필요

데이터와 배포 환경에서 확인해야 할 항목은 다음과 같다.

- 실제 배포 서버에서도 Chroma Vector DB 경로를 `/app/data/vector_db`로 유지할지
- Vector DB 파일을 GitHub에 포함할지, 서버에 별도로 업로드할지
- 정책 데이터 갱신 후 Vector DB를 어떻게 재생성할지
- OpenAI API Key와 외부 검색 API Key를 어떤 방식으로 주입할지
- 운영 DB를 Compose PostgreSQL로 둘지, AWS RDS로 분리할지
- EC2 보안 그룹에서 8000, 5432 포트를 외부에 열지 않을지
- S3를 실제로 사용하는지, 사용한다면 어떤 파일을 저장할지

AI 챗봇은 Chroma Vector DB 경로와 OpenAI API Key에 직접 의존하므로, 배포 환경에서 이 두 항목이 맞지 않으면 `/api/ai/chat/`이 정상 동작하지 않을 수 있다.

---

### 8-4. PM / QA 담당자 확인 필요

QA와 발표 흐름에서는 다음 항목을 확인하면 된다.

- 대표 사용자 시나리오에서 AI 챗봇 답변이 자연스러운지
- 추천 카드에 표시되는 신청 가능성 표현이 과도하게 단정적이지 않은지
- 예상 지원금이 “확정 금액”처럼 보이지 않는지
- 출처 URL이 없는 정책은 원문 확인 필요로 안내되는지
- 내부 검색 부족 시 fallback이 설명 가능한지
- 발표 자료에서 “정책 추천”과 “신청 가능성 판단”을 분리해서 설명하는지

특히 `추가 확인 필요`, `원문 확인 필요`, `가능성이 있습니다` 같은 표현은 정책 서비스에서 과도한 확정 표현을 피하기 위한 안전장치다.

---

## 9. 팀원 공유용 핵심 메시지

팀원들에게는 아래 내용만 공유해도 된다.

```text
AI 챗봇 API는 /api/ai/chat/ 기준으로 1차 안정화 완료했습니다.

프론트에서는 recommendations 배열을 카드로 렌더링하면 되고,
title, display_summary, display_period, badges, action_url,
personalized_reason, eligibility_* 필드, benefit_* 필드를 사용할 수 있습니다.

신청 가능성은 eligibility_status / eligibility_badge_type 기준으로 분기하면 됩니다.
예상 지원금은 max_total_benefit_text와 benefit_calculation_text를 사용하면 됩니다.

다만 action_url/application_url/source_url 우선순위,
로그인 사용자 프로필 자동 반영 여부,
배포 환경의 CHROMA_PERSIST_DIR와 OPENAI_API_KEY 주입 방식은 팀 내 확인이 필요합니다.
```

---

## 10. 남은 조율 사항

| 구분 | 확인 내용 | 담당 |
| --- | --- | --- |
| 프론트 카드 필드 | 어떤 필드를 실제 화면에 노출할지 | Frontend |
| 버튼 링크 우선순위 | `action_url`, `application_url`, `source_url` 중 우선순위 | Frontend / AI Backend |
| 인증 여부 | AI 챗봇을 비로그인 허용할지 | Backend Core / PM |
| 사용자 프로필 연동 | 로그인 사용자 정보를 자동 반영할지 | Backend Core / AI Backend |
| Vector DB 경로 | 운영 서버 경로 확정 | Data / AWS |
| API Key 관리 | OpenAI, 외부 검색 API Key 주입 방식 | Data / AWS / Backend |
| React 배포 방식 | Nginx 정적 파일, S3, 별도 배포 중 선택 | Frontend / AWS |
| RDS 사용 여부 | Compose DB 또는 AWS RDS | AWS / Backend |
| 보안 그룹 | 80/443 공개, 8000/5432 비공개 여부 | AWS |

---

## 11. 최종 정리

AI Backend / LLM Integration 파트는 현재 6-1~6-9까지 1차 작업이 완료된 상태다.

현재 AI 챗봇 API는 사용자 프로필을 반영해 내부 Vector DB 검색을 수행하고, 검색 결과가 충분한 경우 내부 데이터 기반 답변과 추천 정책 카드를 반환한다. 검색 결과가 부족한 경우 공식 외부 출처 검색으로 fallback될 수 있으며, 응답은 프론트엔드에서 바로 사용할 수 있는 카드 구조를 포함한다.

앞으로는 새로운 기능을 추가하기보다 프론트엔드, 백엔드 공통 API, 데이터/AWS 배포 작업과 맞물리는 지점을 확인하고, 실제 화면 및 배포 환경 기준으로 필요한 부분만 조정하면 된다.
