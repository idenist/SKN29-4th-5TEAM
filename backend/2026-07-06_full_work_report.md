# 2026-07-06 작업 기록 - DB 적재 확인, deadline_status 수정, DB 반영 및 main 배포 준비

## 1. 작업 개요

오늘 작업은 크게 네 가지로 정리된다.

1. Django DB에 적재된 데이터 현황 확인
2. 교육훈련(`training`) 데이터의 날짜 컬럼 구조 확인
3. `deadline_status` 계산 로직 수정 및 실제 DB 반영
4. Git main 브랜치 반영 및 AWS EC2 배포 세션 인수인계 준비

이번 작업의 핵심은 **교육훈련 데이터의 날짜가 누락된 것이 아니라, 다른 컬럼에 정상 저장되어 있었고, 이를 기준으로 마감 상태 계산 로직을 수정한 것**이다.

---

## 2. Django DB 적재 현황 확인

Django `Policy` 테이블 기준으로 전체 적재 건수를 확인했다.

| 구분 | 건수 |
|---|---:|
| 전체 Policy 데이터 | 26,803 |
| 청년정책 `policy` | 2,611 |
| 창업공고 `startup_notice` | 3,789 |
| 교육훈련 `training` | 20,403 |

교육훈련 데이터가 가장 많은 비중을 차지하고 있었고, 이후 `deadline_status` 검증 과정에서 이 `training` 데이터 20,403건이 주요 확인 대상이 되었다.

---

## 3. 교육훈련 데이터 날짜 컬럼 확인

처음에는 교육훈련 데이터의 마감 상태가 `unknown`으로 빠질 가능성이 있어 날짜가 누락된 것으로 의심했다.

하지만 DB를 확인한 결과, 날짜가 누락된 것이 아니었다.

확인 결과:

```text
training 전체 = 20,403
application_start 있음 = 0
application_end 있음 = 0
program_start 있음 = 20,403
program_end 있음 = 20,403
```

즉, 교육훈련 데이터는 아래처럼 저장되어 있었다.

| 컬럼 | 상태 |
|---|---|
| `application_start_date` | 비어 있음 |
| `application_end_date` | 비어 있음 |
| `program_start_date` | 정상 저장 |
| `program_end_date` | 정상 저장 |

교육훈련 데이터 특성상 신청 기간이 아니라 **훈련 시작일 / 훈련 종료일** 기준으로 날짜가 들어가 있는 구조였다.

---

## 4. 문제 원인

기존 `update_deadlines` 명령어는 모든 데이터 source에 대해 아래 컬럼 기준으로만 `deadline_status`를 계산하고 있었다.

```python
application_start_date
application_end_date
```

하지만 `training` 데이터는 해당 컬럼이 비어 있고, 실제 날짜는 아래 컬럼에 있었다.

```python
program_start_date
program_end_date
```

따라서 `training` 데이터는 실제 날짜가 있음에도 불구하고 기존 로직에서는 `unknown`으로 계산될 수 있는 문제가 있었다.

---

## 5. 수정 내용

수정 파일:

```text
backend/apps/policies/management/commands/update_deadlines.py
backend/tests/test_policy_deadlines.py
```

### 수정 방향

`source_category`에 따라 날짜 기준을 분리했다.

```python
if policy.source_category == "training":
    start_date = policy.program_start_date
    end_date = policy.program_end_date
else:
    start_date = policy.application_start_date
    end_date = policy.application_end_date
```

### source별 기준

| source_category | deadline_status 계산 기준 |
|---|---|
| `policy` | `application_start_date` / `application_end_date` |
| `startup_notice` | `application_start_date` / `application_end_date` |
| `training` | `program_start_date` / `program_end_date` |

---

## 6. 테스트 수정

기존 테스트는 `training` 데이터에도 `application_end_date`를 넣고 있었다.

새 로직에 맞게 `training` 테스트 데이터를 아래처럼 수정했다.

```python
target = create_policy(
    item_id="SOURCE-TRAINING",
    source_category="training",
    program_start_date=TODAY - timedelta(days=10),
    program_end_date=TODAY - timedelta(days=1),
)
```

이후 deadline 관련 테스트 전체를 다시 실행했다.

---

## 7. 검증 결과

아래 검증을 수행했다.

```bash
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test tests.test_policy_deadlines
```

결과:

```text
System check identified no issues
No changes detected
Ran 35 tests
OK
```

즉, Django 시스템 체크, 마이그레이션 변경 여부, deadline 관련 테스트가 모두 정상 통과했다.

---

## 8. 실제 DB deadline_status 반영

테스트 통과 후, 실제 DB의 `training` 데이터에 대해 `deadline_status`를 반영했다.

실행 명령:

```bash
python manage.py update_deadlines --source training --as-of 2026-07-06 --batch-size 500
```

반영 결과:

| 항목 | 건수 |
|---|---:|
| training 전체 | 20,403 |
| 정상 날짜 데이터 | 20,403 |
| 비정상 날짜 범위 | 0 |
| 실제 갱신 | 9,563 |
| 상태 유지 | 10,840 |
| upcoming | 7,489 |
| ongoing | 10,840 |
| closing_soon | 1,917 |
| closed | 157 |
| unknown | 0 |

---

## 9. DB 반영 후 재검증

DB 반영 후 다시 dry-run으로 확인했다.

```bash
python manage.py update_deadlines --source training --dry-run --as-of 2026-07-06
```

결과:

```text
변경 예정 건수: 0건
상태 유지 건수: 20,403건
unknown: 0건
상태 전환별 건수: 없음
```

즉, 실제 DB 반영이 정상적으로 끝났고 추가로 변경될 데이터가 없는 상태임을 확인했다.

추가 shell 확인 결과:

```text
training 전체 = 20,403
upcoming = 7,489
ongoing = 10,840
closing_soon = 1,917
closed = 157
unknown = 0
```

---

## 10. Git 작업 및 main 반영

작업 브랜치:

```text
feat/update-deadline-training-program-dates
```

커밋 메시지:

```text
fix: 교육훈련 마감 상태를 훈련기간 기준으로 계산
```

이후 `main` 브랜치에 머지하고 원격 main에 push 완료했다.

최종 main 커밋:

```text
e256427 merge: 교육훈련 마감 상태 계산 수정
```

확인 로그:

```text
e256427 (HEAD -> main, origin/main, origin/HEAD) merge: 교육훈련 마감 상태 계산 수정
53834c1 (origin/feat/update-deadline-training-program-dates, feat/update-deadline-training-program-dates) fix: 교육훈련 마감 상태를 훈련기간 기준으로 계산
8d84fe4 0706_AI_version2.2
```

따라서 팀원들은 최신 `main`을 pull 받아서 사용할 수 있다.

---

## 11. AWS EC2 배포 준비 인수인계

배포 담당 세션으로 넘기기 위해 AWS EC2 배포 방향도 정리했다.

배포 시 확인할 항목:

1. EC2 접속 정보
   - 퍼블릭 IP
   - SSH pem 키 경로
   - OS 종류 Ubuntu / Amazon Linux
   - 보안그룹 포트 22, 80, 443, 백엔드 포트 확인

2. 서버 구성
   - Django backend
   - React frontend
   - Nginx
   - Gunicorn
   - systemd 서비스 구성

3. DB 구성
   - EC2 내부 DB 사용 여부
   - RDS 사용 여부
   - 기존 DB 이전 여부
   - 서버에서 데이터 재적재 여부

4. 환경변수
   - `.env`는 서버에 직접 생성
   - DB 비밀번호, API 키는 GitHub에 올리지 않음

5. 서버에서 데이터 재적재 시 주의
   - EC2 또는 RDS에 데이터를 새로 적재하면 아래 명령을 다시 실행해야 한다.

```bash
python manage.py update_deadlines --source training --batch-size 500
```

---

## 12. 팀 공유용 요약

교육훈련 `deadline_status` 계산 로직 수정 및 main 반영 완료했습니다.

오늘 확인한 내용은 다음과 같습니다.

1. Django DB 적재 현황 확인
   - 전체 Policy 데이터 26,803건
   - 청년정책 2,611건
   - 창업공고 3,789건
   - 교육훈련 20,403건

2. 교육훈련 날짜 컬럼 확인
   - 교육훈련 데이터의 날짜는 누락된 것이 아니었습니다.
   - `application_start_date` / `application_end_date`는 비어 있었지만,
   - `program_start_date` / `program_end_date`에 훈련 시작일과 종료일이 정상 저장되어 있었습니다.

3. 로직 수정
   - `training` 데이터만 `program_start_date` / `program_end_date` 기준으로 `deadline_status` 계산
   - `policy`, `startup_notice`는 기존처럼 `application_start_date` / `application_end_date` 기준 유지

4. DB 반영 결과
   - training 전체: 20,403건
   - 실제 갱신: 9,563건
   - 상태 유지: 10,840건
   - upcoming: 7,489건
   - ongoing: 10,840건
   - closing_soon: 1,917건
   - closed: 157건
   - unknown: 0건

5. 검증 결과
   - `manage.py check` 통과
   - `makemigrations --check --dry-run`: No changes detected
   - deadline 테스트 35개 OK
   - DB 반영 후 dry-run 결과 변경 예정 0건
   - main 브랜치 push 완료

최신 main pull 받아서 사용하면 됩니다.

---

## 13. 다음 작업 메모

다음 작업은 AWS EC2 배포다.

배포 시 우선순위:

1. EC2 접속 확인
2. GitHub main clone 또는 pull
3. backend `.env` 생성
4. Python venv 생성 및 requirements 설치
5. migrate 실행
6. 필요 시 데이터 적재
7. `update_deadlines` 실행
8. Gunicorn + systemd 설정
9. Nginx reverse proxy 설정
10. React frontend build 및 정적 파일 서빙
11. 최종 접속 테스트
