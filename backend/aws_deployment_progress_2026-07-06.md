# AWS 배포 작업 진행 보고서

작성일: 2026-07-06  
작성자: 정승  
프로젝트: SKN29-4th-5TEAM 청년 지원 통합 탐색 / 백수 구조대

---

## 1. 작업 목적

4차 프로젝트 평가 기준에 포함된 AWS 기반 배포 환경 구성을 위해 EC2, RDS, Django 백엔드 연결을 우선 진행했다.

이번 작업의 목표는 다음과 같다.

- AWS EC2 서버 생성
- AWS RDS PostgreSQL 생성
- EC2에서 RDS 접속 확인
- GitHub main 브랜치 코드를 EC2 서버에 반영
- Django 백엔드를 EC2에서 실행
- Django와 RDS 연결 확인
- Django DB 마이그레이션 수행
- 브라우저에서 백엔드 관리자 페이지 접속 확인

---

## 2. 오늘 완료한 작업

## 2.1 VPC 생성

서울 리전에 기존 VPC가 없어 EC2 생성 시 VPC/서브넷 선택이 불가능한 상태였다.  
따라서 프로젝트용 VPC를 새로 생성했다.

- VPC 이름: `skn29-vpc`
- 퍼블릭 서브넷: EC2 배치용
- 프라이빗 서브넷: RDS 배치용
- NAT Gateway: 생성하지 않음

NAT Gateway는 비용 발생 가능성이 있어 이번 평가용 배포 환경에서는 생성하지 않았다.

---

## 2.2 EC2 인스턴스 생성

Django 백엔드 서버 실행을 위한 EC2 인스턴스를 생성했다.

- 인스턴스 이름: `skn29-youth-search-ec2`
- OS: Ubuntu 24.04 LTS
- 인스턴스 타입: `t3.micro`
- 퍼블릭 IP: `52.78.46.170`
- SSH 사용자: `ubuntu`
- 키페어: `skn29-youth-search-key.pem`
- 보안그룹: `skn29-ec2-sg`

EC2 보안그룹 인바운드 규칙은 다음과 같이 설정했다.

| 포트 | 용도 | 허용 범위 |
|---|---|---|
| 22 | SSH 접속 | 내 IP |
| 80 | HTTP | 전체 허용 |
| 443 | HTTPS | 전체 허용 |
| 8000 | Django 임시 테스트 서버 | 내 IP |

초기 SSH 접속 시 pem 파일 권한 문제로 접속이 실패했으나, Windows에서 `.ssh` 폴더로 키를 복사하고 권한을 수정해 해결했다.

접속 명령어는 다음과 같다.

```bash
ssh -i "%USERPROFILE%\.ssh\skn29-youth-search-key.pem" ubuntu@52.78.46.170
```

---

## 2.3 EC2 서버 기본 세팅

EC2 접속 후 배포 및 Django 실행에 필요한 기본 패키지를 설치했다.

설치한 주요 패키지는 다음과 같다.

- git
- curl
- unzip
- python3-venv
- python3-pip
- python3-dev
- build-essential
- libpq-dev
- postgresql-client
- nginx

`t3.micro` 인스턴스는 메모리가 작기 때문에 Python 패키지 설치 및 빌드 중 메모리 부족을 방지하기 위해 2GB swap을 생성했다.

확인 결과:

```text
Swap: 2.0Gi
```

---

## 2.4 GitHub main 코드 반영

EC2 서버에 GitHub main 브랜치 코드를 clone했다.

- 저장소: `https://github.com/idenist/SKN29-4th-5TEAM.git`
- 서버 경로: `~/SKN29-4th-5TEAM`
- 확인된 최신 커밋: `8f4e8ff docs: 요구사항 정의서 최종본 반영 및 추적성 매트릭스 추가`

실행한 주요 명령어:

```bash
cd ~
git clone https://github.com/idenist/SKN29-4th-5TEAM.git
cd SKN29-4th-5TEAM
git checkout main
git pull origin main
git log -1 --oneline
```

---

## 2.5 RDS PostgreSQL 생성

Django 운영 DB로 사용할 AWS RDS PostgreSQL을 생성했다.

- DB 식별자: `skn29-youth-search-db`
- 엔진: PostgreSQL
- 버전: PostgreSQL 16.14-R2
- DB 이름: `youth_search`
- 사용자명: `skn29admin`
- 포트: `5432`
- 엔드포인트: `skn29-youth-search-db.cz46igeuk7s4.ap-northeast-2.rds.amazonaws.com`
- 퍼블릭 액세스: 아니요

RDS는 외부 인터넷에 직접 공개하지 않고, EC2에서만 접근 가능하도록 구성했다.

RDS 보안그룹은 PostgreSQL 5432 포트를 EC2 보안그룹에서만 접근 가능하도록 설정했다.

| 대상 | 포트 | Source |
|---|---|---|
| PostgreSQL | 5432 | EC2 보안그룹 `skn29-ec2-sg` |

---

## 2.6 EC2에서 RDS 접속 확인

EC2 서버에서 `psql` 명령어를 사용해 RDS 접속을 확인했다.

접속 명령어:

```bash
psql "host=skn29-youth-search-db.cz46igeuk7s4.ap-northeast-2.rds.amazonaws.com port=5432 dbname=youth_search user=skn29admin sslmode=require"
```

접속 결과:

```text
psql (16.14)
SSL connection
Type "help" for help.

youth_search=>
```

따라서 EC2에서 RDS PostgreSQL로 접속 가능한 상태임을 확인했다.

---

## 2.7 Django `.env` 생성

Django 설정 파일을 확인한 결과, `backend/.env`를 자동으로 읽는 구조였다.

확인된 주요 환경변수는 다음과 같다.

```env
DJANGO_SECRET_KEY=
DJANGO_DEBUG=
DJANGO_ALLOWED_HOSTS=

DB_NAME=
DB_USER=
DB_PASSWORD=
DB_HOST=
DB_PORT=

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_STORAGE_BUCKET_NAME=
AWS_S3_REGION_NAME=
```

EC2 서버에 `backend/.env` 파일을 생성하고 RDS 연결 정보를 입력했다.

주의사항:

- `.env` 파일은 GitHub에 올리지 않는다.
- RDS 비밀번호, Django Secret Key, AWS Secret Key는 문서나 단톡방에 공개하지 않는다.
- Django Secret Key는 작업 중 채팅에 한 번 노출되었기 때문에 최종 배포 전 새 값으로 교체하는 것이 좋다.

---

## 2.8 Django 백엔드 설치 및 마이그레이션

EC2 서버에서 Python 가상환경을 생성하고 backend 의존성을 설치했다.

```bash
cd ~/SKN29-4th-5TEAM/backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

Django 설정 검증 결과:

```bash
python manage.py check
```

결과:

```text
System check identified no issues (0 silenced).
```

RDS에 Django 마이그레이션을 적용했다.

```bash
python manage.py migrate
```

마이그레이션 적용 결과:

- admin
- auth
- community
- contenttypes
- notifications
- policies
- sessions
- users

위 앱들의 마이그레이션이 모두 정상 적용되었다.

---

## 2.9 Django 임시 서버 실행 및 접속 확인

EC2에서 Django 개발 서버를 실행해 외부 접속을 확인했다.

```bash
cd ~/SKN29-4th-5TEAM/backend
source .venv/bin/activate
python manage.py runserver 0.0.0.0:8000
```

실행 결과:

```text
System check identified no issues (0 silenced).
Starting development server at http://0.0.0.0:8000/
```

브라우저에서 다음 주소 접속을 확인했다.

```text
http://52.78.46.170:8000/admin/
```

Django admin 로그인 페이지가 정상 표시되었다.

현재 `/` 루트 경로는 별도 URL이 없어 404가 발생하지만, 이는 백엔드 API 중심 구조이므로 현재 단계에서는 정상에 가깝다.

확인된 API URL 구조는 다음과 같다.

- `/admin/`
- `/api/auth/`
- `/api/policies/`
- `/api/notifications/`
- `/api/community/`
- `/api/ai/`
- `/api/recommendations/`
- `/api/news/`
- `/api/mypage/`
- `/api/uploads/`

---

## 3. 현재 상태 요약

현재까지의 배포 상태는 다음과 같다.

| 항목 | 상태 |
|---|---|
| VPC 생성 | 완료 |
| EC2 생성 | 완료 |
| EC2 SSH 접속 | 완료 |
| EC2 기본 패키지 설치 | 완료 |
| Swap 2GB 설정 | 완료 |
| GitHub main clone | 완료 |
| RDS PostgreSQL 생성 | 완료 |
| RDS 보안그룹 설정 | 완료 |
| EC2에서 RDS 접속 | 완료 |
| Django `.env` 생성 | 완료 |
| requirements 설치 | 완료 |
| `manage.py check` | 통과 |
| `manage.py migrate` | 완료 |
| Django 임시 서버 실행 | 완료 |
| `/admin/` 접속 확인 | 완료 |
| S3 연동 | 미완료 |
| Gunicorn/Nginx 정식 배포 | 미완료 |
| Docker 기반 배포 검증 | 미완료 |
| 데이터 적재 | 미완료 |
| 프론트엔드 배포 | 미완료 |

---

## 4. 확인된 이슈

## 4.1 Django admin static 파일 미적용

`/admin/` 페이지는 접속되지만 CSS가 깨져 보이는 상태다.

원인:

- 아직 `collectstatic` 및 Nginx static serving 설정을 하지 않았기 때문
- 현재는 `runserver` 기반 임시 실행 상태

해결 예정:

- `STATIC_ROOT` 확인
- `python manage.py collectstatic`
- Nginx에서 static 경로 서빙 설정

---

## 4.2 프론트엔드 빌드 불가 가능성

현재 GitHub main 기준으로 다음 파일이 비어 있음이 확인되었다.

```text
frontend/package.json = 0 bytes
```

따라서 현재 상태로는 React 프론트엔드 빌드가 바로 안 될 가능성이 높다.

프론트 담당 쪽에서 `package.json` 복구 또는 재작성 확인이 필요하다.

---

## 4.3 운영 DB 데이터 미적재

RDS에는 Django 테이블 생성까지 완료되었지만, 실제 정책/창업/교육훈련 데이터 적재는 아직 진행하지 않았다.

추후 데이터 적재 후 다음 명령을 서버 기준으로 다시 실행해야 한다.

```bash
python manage.py update_deadlines --source training --batch-size 500
```

---

## 5. 남은 작업

다음 작업이 남아 있다.

1. S3 프로필 이미지 버킷 생성
2. EC2 IAM Role 또는 S3 접근 권한 설정
3. Django S3 업로드 연동 확인
4. 프로필 이미지 업로드 테스트
5. `collectstatic` 설정 및 admin static 깨짐 해결
6. Gunicorn 설정
7. Nginx reverse proxy 설정
8. EC2에서 Gunicorn/Nginx 기반 정식 배포
9. 서버 재부팅 후 서비스 자동 복구 확인
10. 운영 RDS에 데이터 적재
11. `update_deadlines` 운영 DB 기준 재실행
12. frontend `package.json` 복구 및 프론트 빌드
13. Docker 기반 배포 구성 및 재현성 검증
14. 배포 테스트 결과 보고서 작성

---

## 6. 팀 공유용 요약

오늘 AWS 배포 1차 연결 작업을 진행했다.

- EC2 Ubuntu 서버 생성 완료
- RDS PostgreSQL 생성 완료
- EC2에서 RDS 접속 성공
- Django backend `.env` 연결 완료
- `manage.py check` 통과
- `manage.py migrate` 완료
- EC2에서 Django 서버 실행 확인
- 브라우저에서 `/admin/` 접속 확인

현재는 백엔드와 RDS 연결이 성공한 1차 배포 검증 단계다.  
최종 운영 배포는 아직 아니며, S3 연동, Gunicorn/Nginx 정식 배포, 데이터 적재, 프론트엔드 빌드, Docker 검증이 남아 있다.

보안상 RDS 비밀번호, pem 키 파일, AWS Secret Key는 GitHub나 단톡방에 공유하지 않는다.
