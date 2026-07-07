# 인기 검색어 랭킹 기능 구현 및 연동 가이드

작성일: 2026-07-07  
작업 브랜치: `feature/popular-searches`  
main 반영 여부: 반영 완료  
관련 WBS: 인기 검색어 랭킹 구현 / 민감정보 검색어 제외 처리

---

## 1. 작업 목적

정책 검색 화면에서 사용자가 자주 검색하는 키워드를 익명으로 집계하고, 프론트 화면에서 인기 검색어 TOP 10을 보여줄 수 있도록 백엔드 API를 추가했다.

기존에는 로그인 사용자 기준 검색 기록을 저장하는 `SearchHistory` 모델이 있었지만, 이 모델은 사용자별 개인 검색 기록 용도이다.

이번 기능은 비로그인 사용자 검색까지 포함해야 하고, 인기 검색어 랭킹은 특정 사용자와 연결되면 안 되므로 별도 모델인 `PopularSearchKeyword`를 추가했다.

---

## 2. 구현 결과 요약

### 추가된 기능

- 인기 검색어 저장용 모델 추가
- 정책 검색 API 호출 시 검색어 자동 집계
- 인기 검색어 TOP 10 조회 API 추가
- 개인정보성 검색어 저장 제외
- `keyword`, `search`, `q` 검색 파라미터 지원
- 구현 및 검증 문서 추가

### 추가된 API

```http
GET /api/policies/popular-searches/
```

### 프론트에서 사용할 방식

프론트는 위 API를 호출해서 `data` 배열을 인기 검색어 목록으로 보여주면 된다.

인기 검색어 클릭 시 기존 정책 검색 API에 `keyword` 파라미터로 넘기면 된다.

```http
GET /api/policies/?keyword=청년
```

---

## 3. 변경 파일 목록

```text
backend/apps/policies/models.py
backend/apps/policies/serializers.py
backend/apps/policies/views.py
backend/apps/policies/urls.py
backend/apps/policies/migrations/0004_popularsearchkeyword.py
documents/popular_searches_implementation.md
```

---

## 4. 추가 모델

### 모델명

```python
PopularSearchKeyword
```

### 역할

검색어별 누적 검색 횟수를 저장한다.

사용자 ID, 이메일, 닉네임 등 개인 식별 정보는 저장하지 않는다.

### 주요 필드

```text
keyword
count
last_searched_at
created_at
updated_at
```

### DB 테이블명

```text
popular_search_keywords
```

---

## 5. 검색어 저장 흐름

사용자가 정책 목록 API에서 검색을 수행하면 검색어가 인기 검색어 테이블에 집계된다.

예시:

```http
GET /api/policies/?keyword=청년
```

처리 흐름:

```text
1. 사용자가 검색어 입력
2. PolicyListView에서 keyword/search/q 파라미터 확인
3. 검색어 정규화
4. 개인정보성 검색어 여부 검사
5. 정상 검색어면 PopularSearchKeyword count 증가
6. 정책 검색 결과 반환
```

---

## 6. 검색 파라미터 지원

이번 작업에서 아래 3개 검색 파라미터를 모두 지원하도록 처리했다.

```text
keyword
search
q
```

따라서 아래 요청은 모두 검색어 집계 대상이다.

```http
GET /api/policies/?keyword=청년
GET /api/policies/?search=청년
GET /api/policies/?q=청년
```

---

## 7. 개인정보성 검색어 제외 기준

아래 형태의 검색어는 인기 검색어에 저장하지 않는다.

```text
1글자 이하 검색어
50글자 초과 검색어
이메일 형식
전화번호 형식
주민등록번호 형태
긴 숫자 문자열
```

저장 제외 예시:

```text
01012345678
test@gmail.com
990101-1234567
12345678901234567890
```

이 기능은 인기 검색어 랭킹이 개인 식별 정보나 민감정보를 노출하지 않도록 하기 위한 처리이다.

---

## 8. 추가 API 상세

### 인기 검색어 TOP 10 조회

```http
GET /api/policies/popular-searches/
```

### 응답 예시

```json
{
  "success": true,
  "data": [
    {
      "keyword": "청년",
      "count": 2,
      "last_searched_at": "2026-07-07T10:29:30.307349+09:00"
    },
    {
      "keyword": "취업",
      "count": 1,
      "last_searched_at": "2026-07-07T10:29:31.183122+09:00"
    }
  ],
  "message": "",
  "error": null
}
```

### 프론트 처리 기준

프론트에서는 아래 값만 우선 사용하면 된다.

```text
data[].keyword
data[].count
```

`last_searched_at`은 필요하면 최근 검색 시각 표시용으로 사용할 수 있다.

---

## 9. 프론트 연동 방법

### 1단계: 인기 검색어 API 호출

```js
const response = await fetch("/api/policies/popular-searches/");
const result = await response.json();

const popularSearches = result.data;
```

### 2단계: 화면 표시

예시:

```js
popularSearches.map((item) => (
  <button key={item.keyword}>
    {item.keyword}
  </button>
));
```

### 3단계: 인기 검색어 클릭 시 기존 검색 API 호출

```http
GET /api/policies/?keyword=청년
```

프론트에서는 사용자가 인기 검색어를 클릭하면 검색창 값에 해당 키워드를 넣고 기존 정책 검색 로직을 재사용하면 된다.

---

## 10. 로컬 개발자가 확인하는 방법

### 1단계: 프로젝트 루트 이동

```cmd
cd /d C:\Users\Playdata\Downloads\SKN29-4th-5TEAM
```

### 2단계: 가상환경 활성화

```cmd
call .venv\Scripts\activate
```

프롬프트에 아래처럼 표시되면 정상이다.

```text
(.venv) (base)
```

### 3단계: 백엔드 폴더 이동

```cmd
cd backend
```

### 4단계: 마이그레이션 적용

```cmd
python manage.py migrate
```

정상 결과 예시:

```text
Applying policies.0004_popularsearchkeyword... OK
```

### 5단계: 서버 실행

```cmd
python manage.py runserver
```

정상 실행 예시:

```text
Starting development server at http://127.0.0.1:8000/
```

### 6단계: 새 CMD 창에서 검색어 테스트

```cmd
curl.exe -sG "http://127.0.0.1:8000/api/policies/" --data-urlencode "keyword=청년"

curl.exe -sG "http://127.0.0.1:8000/api/policies/" --data-urlencode "keyword=청년"

curl.exe -sG "http://127.0.0.1:8000/api/policies/" --data-urlencode "keyword=취업"

curl.exe -s "http://127.0.0.1:8000/api/policies/popular-searches/"
```

정상 결과:

```text
청년 count 2
취업 count 1
```

---

## 11. 개인정보 필터 검증 방법

아래 명령으로 개인정보성 검색어가 저장되지 않는지 확인한다.

```cmd
curl.exe -sG "http://127.0.0.1:8000/api/policies/" --data-urlencode "keyword=01012345678"

curl.exe -sG "http://127.0.0.1:8000/api/policies/" --data-urlencode "keyword=test@gmail.com"

curl.exe -sG "http://127.0.0.1:8000/api/policies/" --data-urlencode "keyword=990101-1234567"

curl.exe -s "http://127.0.0.1:8000/api/policies/popular-searches/"
```

정상 결과:

```text
01012345678 저장 안 됨
test@gmail.com 저장 안 됨
990101-1234567 저장 안 됨
기존 인기 검색어 count 유지
```

---

## 12. DB 직접 확인 방법

```cmd
cd /d C:\Users\Playdata\Downloads\SKN29-4th-5TEAM\backend

python manage.py shell -c "from apps.policies.models import PopularSearchKeyword; print(list(PopularSearchKeyword.objects.values('keyword','count','last_searched_at').order_by('-count','keyword')[:10]))"
```

정상 결과 예시:

```text
[{'keyword': '청년', 'count': 2}, {'keyword': '취업', 'count': 1}]
```

---

## 13. 배포 시 주의사항

이번 작업에는 DB 마이그레이션이 포함되어 있다.

운영 서버에서 최신 main을 반영한 뒤 반드시 아래 명령을 실행해야 한다.

```cmd
python manage.py migrate
```

운영 DB에 아래 테이블이 생성되어야 한다.

```text
popular_search_keywords
```

이 마이그레이션이 적용되지 않으면 `/api/policies/popular-searches/` API 또는 검색어 집계에서 DB 오류가 발생할 수 있다.

---

## 14. EC2 배포 반영 순서 예시

EC2에서 main을 반영하는 경우 예시 흐름은 아래와 같다.

```bash
cd ~/SKN29-4th-5TEAM

git fetch origin

git reset --hard origin/main

cd backend

source .venv/bin/activate

python manage.py migrate

python manage.py check
```

서버 재시작 방식은 현재 배포 방식에 맞춰 진행한다.

현재 임시 실행 방식이면 `runserver`, 정식 Docker 배포 방식이면 `docker compose` 기준으로 재시작한다.

---

## 15. 팀원별 확인 포인트

### 프론트 담당

확인할 API:

```http
GET /api/policies/popular-searches/
```

연동 방식:

```text
1. API 호출
2. data 배열을 인기 검색어 리스트로 표시
3. 키워드 클릭 시 기존 정책 검색 API에 keyword로 전달
```

### 백엔드/배포 담당

확인할 것:

```text
1. main 최신 반영 여부
2. python manage.py migrate 실행 여부
3. popular_search_keywords 테이블 생성 여부
4. /api/policies/popular-searches/ 응답 여부
```

### PM/문서 담당

WBS 상태 업데이트 문구:

```text
인기 검색어 랭킹(민감정보 제외) 기능 구현 완료
- 검색어 익명 집계 모델 추가
- 인기 검색어 TOP 10 API 구현
- 전화번호/이메일/주민등록번호 형태 검색어 저장 제외
- 로컬 API 테스트 및 DB 직접 조회 검증 완료
- main 반영 완료
```

---

## 16. 구현 완료 상태

### 로컬 검증 완료

```text
makemigrations 성공
Django check 성공
migrate 성공
검색어 count 증가 확인
개인정보성 검색어 미집계 확인
DB 직접 조회 확인
```

### Git 반영 완료

```text
feature/popular-searches 브랜치 작업 완료
main 병합 완료
origin/main push 완료
```

---

## 17. 주의사항

아래 값은 절대 GitHub에 올리면 안 된다.

```text
.env
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
DB 비밀번호
EC2 PEM 키
```

이번 인기 검색어 기능은 개인정보를 저장하지 않지만, 검색어 자체가 민감정보일 수 있으므로 필터링 기준은 계속 유지해야 한다.

---

## 18. 한 줄 요약

정책 검색 API를 사용할 때 검색어를 익명으로 집계하고, `/api/policies/popular-searches/` API로 인기 검색어 TOP 10을 제공하는 기능을 구현했다.
