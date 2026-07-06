# AI/RAG 테스트 결과 정리

## 1. 목적

본 문서는 AI/RAG 담당 영역의 주요 테스트 결과를 정리하여 최종 테스트 보고서에 반영하기 위한 자료이다.

검증 대상은 다음과 같다.

- `/api/ai/chat/` 응답 구조
- 사용자 조건 기반 추천
- 검색 실패 시 임의 정책 생성 방지
- 마감 공고 제외
- 신청 가능한 창업공고 검색 개선
- 예상 지원금 계산
- LLM/API 실패 및 타임아웃 예외 처리

---

## 2. AI Chat API 정상 응답 검증

### 테스트 내용

- 요청 API: `POST /api/ai/chat/`
- 테스트 질문: `2026년에 신청 가능한 창업지원 공고 추천해줘`
- 기대 결과:
  - `answer`, `recommendations`, `sources`, `warnings`, `error`, `meta` 구조 반환
  - 신청 가능한 창업공고 추천
  - 마감 공고 제외
  - 외부 검색 fallback 없이 내부 RAG 결과로 답변 생성

### 결과

- `success=true`
- `recommendations=5개`
- `sources=5개`
- `warnings=[]`
- `error=null`
- `external_used=false`
- `internal_search_sufficient=true`

### 내부 trace 결과

| 항목 | 결과 |
| --- | --- |
| route | 창업 |
| source_category | startup_notice |
| filters | `{"source_category":"startup_notice"}` |
| internal_retriever total | 5 |
| expired_count | 0 |
| open_count | 5 |
| source_count | 5 |
| keyword hit_ratio | 0.8 |
| next_action | answer_generation |

### 판정

신청 가능한 창업지원 공고가 내부 Vector DB에서 정상 검색되었고, 마감 공고는 제외되었다.
검색 결과가 충분하다고 판단되어 외부 검색 fallback 없이 AI 답변 생성까지 정상 완료되었다.

---

## 3. 창업공고 RAG 검색 개선 검증

### 기존 문제

`/api/policies/` 목록 API에서는 신청 가능한 창업공고가 존재했지만, `/api/ai/chat/`에서는 창업공고 검색 결과가 0건으로 반환되었다.

### 원인

1. RAG 검색 필터에서 `domain=창업`을 사용했으나, Chroma metadata의 실제 값은 `domain=startup`이었다.
2. semantic search 상위 후보에 진행 중인 창업공고가 포함되지 않으면, 현재성 필터 적용 후 결과가 0건이 되었다.

### 조치

- `startup_notice` 검색 시 `domain` 필터 제거
- `source_category=startup_notice` 기준 검색으로 변경
- 현재성 질문에서 `fetch_k` 확대
- semantic search 결과가 부족한 경우 `application_end_date >= today` 기준 metadata fallback 추가

### 개선 결과

- `retrieve_policies()` 직접 호출 결과:
  - `count=5`
  - `deadline_status=open`
  - `application_end_date=2026-07-13 ~ 2026-11-30`
- `/api/ai/chat/` 호출 결과:
  - `recommendations=5개`
  - `expired_count=0`
  - `open_count=5`
  - `internal_search_sufficient=true`

### 판정

창업공고 현재성 검색 개선이 완료되었으며, 신청 가능한 창업공고를 내부 RAG 결과로 반환할 수 있음을 확인했다.

---

## 4. 예상 지원금 계산 테스트

### 테스트 파일

- `tests/test_benefit_calculation.py`

### 실행 명령

```cmd
python tests/test_benefit_calculation.py
```

### 테스트 결과

| TC | 입력 조건 | 기대 결과 | 결과 |
| --- | --- | --- | --- |
| TC-BENEFIT-01 | 월 최대 20만원, 최대 12개월 | 최대 240만원 계산 | 통과 |
| TC-BENEFIT-02 | 매월 10만원, 최대 1년 | 최대 120만원 계산 | 통과 |
| TC-BENEFIT-03 | 최대 50만원, 기간 불명확 | 자동 계산하지 않고 원문 확인 필요 반환 | 통과 |
| TC-BENEFIT-04 | 임차보증금 무이자 지원 | 개인별 조건 차이로 자동 합산하지 않음 | 통과 |

### 판정

명확한 월 단위 금액과 지원 기간이 함께 제공되는 경우 최대 예상 지원금 계산이 정상 동작한다.
금액 또는 기간이 불명확하거나 무이자 보증금처럼 개인별 조건 차이가 큰 경우에는 임의 계산을 하지 않고 원문 확인 필요 안내를 반환한다.

---

## 5. LLM/API 실패 및 타임아웃 예외 처리 테스트

### 테스트 파일

- `tests/test_llm_exception.py`

### 실행 명령

```cmd
python tests/test_llm_exception.py
```

### 테스트 결과

| TC | 예외 상황 | 기대 error code | 결과 |
| --- | --- | --- | --- |
| TC-LLM-01 | Rate limit / 429 | LLM_RATE_LIMIT | 통과 |
| TC-LLM-02 | Timeout | LLM_TIMEOUT | 통과 |
| TC-LLM-03 | 인증/API Key 오류 | LLM_AUTH_ERROR | 통과 |
| TC-LLM-04 | Vector DB/Chroma 오류 | VECTOR_DB_ERROR | 통과 |
| TC-LLM-05 | 알 수 없는 AI 처리 오류 | AI_SERVICE_ERROR | 통과 |

### 공통 확인 사항

모든 예외 케이스에서 다음 응답 구조가 유지되었다.

```json
{
  "recommendations": [],
  "sources": [],
  "warnings": ["사용자 안내 메시지"],
  "error": "에러 코드",
  "meta": {
    "error_code": "에러 코드",
    "fallback_used": true
  }
}
```

### 판정

LLM API 실패, 타임아웃, 인증 오류, Vector DB 오류, 알 수 없는 AI 처리 오류 상황에서 서버가 중단되지 않고 fallback 응답을 반환한다.
프론트엔드는 `error`, `warnings`, `meta.error_code`를 기준으로 오류 UX를 분기할 수 있다.

---

## 6. 종합 판정

AI/RAG 영역의 주요 기능과 예외 처리를 검증한 결과, 다음 항목이 정상 동작함을 확인했다.

- AI Chat API 공통 응답 구조 유지
- 사용자 질문 기반 도메인/소스 라우팅
- 내부 Vector DB 검색
- 검색 결과 충분성 판단
- 마감 공고 제외
- 신청 가능한 창업공고 추천
- 출처 URL 포함
- 예상 지원금 계산
- 금액 불명확 시 원문 확인 안내
- LLM/API 실패 및 타임아웃 fallback 처리

따라서 AI/RAG 영역은 테스트 보고서 기준으로 정상 검증 완료로 판단한다.

---

## 7. 전달용 요약

한예나에게 전달할 때는 아래 문장으로 요약할 수 있다.

> AI/RAG 쪽 테스트 결과 정리했습니다. 정상 응답, 창업공고 현재성 검색 개선, 예상 지원금 계산, LLM/API 예외 처리까지 포함했고, 테스트 보고서에 붙일 수 있게 TC별 결과와 판정 형태로 정리해두었습니다.
