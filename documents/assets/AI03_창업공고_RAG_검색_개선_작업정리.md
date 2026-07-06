# 창업공고 RAG 검색 개선 작업 정리

## 1. 작업 목적

`/api/ai/chat/`에서 **“2026년에 신청 가능한 창업지원 공고 추천해줘”** 질의 시, Django DB에는 진행중 창업공고가 존재하지만 AI/RAG 응답에서는 추천 결과가 0건으로 반환되는 문제를 해결했다.

---

## 2. 초기 문제 상황

### 증상

- `/api/policies/`에서는 `source_category=startup_notice`, `deadline_status=ongoing` 조건으로 진행중 창업공고가 조회됨
- 그러나 `/api/ai/chat/`에서는 내부 Vector DB 검색 결과가 0건으로 반환됨
- 결과적으로 외부 공식 출처 확인 안내로 fallback 처리됨

### 기존 AI/RAG 응답 trace

```text
route = 창업
source_category = startup_notice
filters = {"domain": "창업", "source_category": "startup_notice"}
internal_retriever total = 0
external_used = false
```

---

## 3. 원인 분석

### 원인 1. domain 필터 불일치

Chroma Vector DB의 `startup_notice` metadata는 다음과 같았다.

```text
source_category = startup_notice
domain = startup
```

하지만 RAG router에서는 다음 조건으로 검색하고 있었다.

```json
{
  "domain": "창업",
  "source_category": "startup_notice"
}
```

직접 조회 결과:

```text
source_category=startup_notice AND domain=창업 → 0건
```

따라서 `domain="창업"` 필터가 실제 metadata의 `domain="startup"`과 불일치하여 검색 결과가 사라졌다.

### 원인 2. 현재성 질문에서 semantic search 한계

`domain` 필터를 제거한 뒤에도 다음 질의는 0건이었다.

```text
2026년에 신청가능한 창업지원 공고 추천해줘
검색 키워드: 창업 지원 공고
```

반면 단순 질의는 결과가 반환되었다.

```text
창업 지원 공고 → 5건 반환
```

즉, `startup_notice` 데이터는 존재하지만 현재성 질의에서는 semantic search 상위 후보에 실제 진행중 공고가 포함되지 않았다.

Chroma metadata에는 실제로 2026-07-06 이후 신청 가능한 창업공고가 존재했다.

```text
future_startup_count = 10
```

---

## 4. 수정 내용

### 수정 1. startup_notice 검색 시 domain 필터 제거

창업공고는 `source_category=startup_notice` 자체가 충분히 강한 필터이므로, `domain="창업"` 필터를 제거했다.

```python
if route in {"전체", "기타"}:
    filters.pop("domain", None)
elif source_category == "startup_notice":
    filters.pop("domain", None)
else:
    filters["domain"] = route

if source_category:
    filters["source_category"] = source_category
```

### 수정 2. startup_notice + 현재성 질문에서 fetch_k 확대

현재성 질문에서 후보를 더 넓게 가져오도록 `fetch_k`를 확대했다.

```python
if source_category == "startup_notice" and strict_freshness:
    fetch_k = max(DEFAULT_FETCH_K, top_k * 80, 300)
else:
    fetch_k = max(DEFAULT_FETCH_K, top_k * 15)
```

### 수정 3. 현재성 질문에서 open 후보 보존

`startup_notice + 현재성 질문`에서는 score가 낮더라도 마감 전 또는 마감일 확인 가능 후보를 우선 보존하도록 최종 필터를 추가했다.

```python
def _apply_final_filter(reranked, source_category, strict_freshness):
    if source_category == "startup_notice" and strict_freshness:
        alive_candidates = [
            item for item in reranked
            if _get_deadline_rank(item) in {2, 3}
        ]
        if alive_candidates:
            return alive_candidates

    return _filter_low_score(reranked)
```

### 수정 4. metadata fallback 추가

Semantic search 상위 후보에서 진행중 공고를 찾지 못하는 경우, Chroma metadata의 `application_end_date`를 기준으로 신청 가능한 창업공고를 직접 조회하는 fallback을 추가했다.

```python
if not filtered and source_category == "startup_notice" and strict_freshness:
    filtered = _metadata_fallback_startup_open_notices(
        top_k=top_k,
        vector_store=vector_store,
    )
```

---

## 5. 검증 결과

### 1차 검증: retrieve_policies 직접 호출

```cmd
python -c "from dotenv import load_dotenv; load_dotenv('.env'); from rag_engine.services.rag_service import retrieve_policies; q='2026년에 신청가능한 창업지원 공고 추천해줘\n검색 키워드: 창업 지원 공고'; rows=retrieve_policies(query=q,filters={'source_category':'startup_notice'}, top_k=5); print('count=',len(rows)); [print(i+1, r.get('title') or r.get('policy_name'), '| deadline=', r.get('deadline_status'), '| end=', r.get('application_end_date'), '| score=', r.get('score')) for i,r in enumerate(rows)]"
```

결과:

```text
count=5
1 [국비전액무료] 생성형 AI를 활용한 콘텐츠 크리에티브 디자이너 모집 | deadline=open | end=2026-07-13 | score=1.0
2 2026년 제 4회 경기광주시 창업누림 로컬 창업 아이디어 공모전 | deadline=open | end=2026-07-20 | score=1.0
3 파이썬 기반 데이터 분석 실무 프로젝트 과정 | deadline=open | end=2026-07-21 | score=1.0
4 2026 신개념 세대융합 청년창업 지원 멘티 상시 모집 | deadline=open | end=2026-11-30 | score=1.0
5 2026년 용산구 청년기업 융자지원사업 | deadline=open | end=2026-11-30 | score=1.0
```

### 2차 검증: `/api/ai/chat/` 호출

```cmd
curl -X POST http://127.0.0.1:8000/api/ai/chat/ ^
  -H "Content-Type: application/json" ^
  -d "{\"message\":\"2026년에 신청 가능한 창업지원 공고 추천해줘\",\"top_k\":5}"
```

결과 요약:

```text
success = true
recommendations = 5개
warnings = []
error = null
external_used = false
internal_search_sufficient = true
```

내부 trace:

```text
filters = {"source_category": "startup_notice"}
internal_retriever total = 5
expired_count = 0
source_count = 5
open_count = 5
keyword hit_ratio = 0.8
next_action = answer_generation
```

---

## 6. 최종 판정

창업공고 현재성 RAG 검색 문제는 해결되었다.

- 내부 Vector DB에서 `startup_notice` 진행중 공고 검색 성공
- 마감 공고 제외 성공
- 외부 검색 fallback 없이 내부 RAG 답변 생성 성공
- `/api/ai/chat/`에서 추천 카드 5개 반환 확인

---

## 7. 남은 개선 사항

일부 `startup_notice` 데이터에 교육/훈련 성격의 항목이 포함되어 있었다.

예:

```text
[국비전액무료] 생성형 AI를 활용한 콘텐츠 크리에티브 디자이너 모집
파이썬 기반 데이터 분석 실무 프로젝트 과정
```

이는 RAG 로직 오류라기보다는 원본 데이터의 `source_category` 분류 품질 문제에 가깝다. 향후 데이터 전처리 단계에서 제목/기관/내용 기반 재분류 기준을 보강할 필요가 있다.
