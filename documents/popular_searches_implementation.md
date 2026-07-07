# 인기 검색어 랭킹 기능 구현 기록

## 작업 개요
정책 검색 API 호출 시 사용자가 입력한 검색어를 익명 집계하여 인기 검색어 TOP 10을 제공하는 기능을 구현했다.

## 구현 내용
- PopularSearchKeyword 모델 추가
- 정책 검색 API 호출 시 검색어 count 증가
- 인기 검색어 TOP 10 조회 API 추가
- 개인정보성 검색어 제외 처리
- keyword, search, q 검색 파라미터 지원

## 추가 API
GET /api/policies/popular-searches/

## 변경 파일
- backend/apps/policies/models.py
- backend/apps/policies/serializers.py
- backend/apps/policies/views.py
- backend/apps/policies/urls.py
- backend/apps/policies/migrations/0004_popularsearchkeyword.py

## 개인정보 제외 기준
아래 형태의 검색어는 인기 검색어에 저장하지 않는다.

- 1글자 이하 검색어
- 50글자 초과 검색어
- 이메일 형식
- 전화번호 형식
- 주민등록번호 형태
- 긴 숫자 문자열

## 로컬 검증 결과
- python manage.py makemigrations policies 성공
- python manage.py check 성공
- python manage.py migrate 성공
- 청년 검색 2회 후 count 2 확인
- 취업 검색 1회 후 count 1 확인
- 전화번호, 이메일, 주민등록번호 형태 검색어는 저장되지 않음 확인
- DB 직접 조회로 PopularSearchKeyword 저장 확인

## 배포 시 주의사항
운영 서버 반영 시 python manage.py migrate 명령으로 popular_search_keywords 테이블을 생성해야 한다.

## 비고
기존 SearchHistory는 로그인 사용자별 검색 기록 용도이고, 이번 PopularSearchKeyword는 비로그인 검색까지 포함하는 익명 집계용 기능이다.
