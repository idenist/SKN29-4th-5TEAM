# RDS 정책 데이터 적재 기록

## 목적

기존 3차 프로젝트에서 정제한 청년 지원 데이터를 Django 운영 RDS의 `policies` 테이블에 적재했다.

## 사용 파일

- `data/processed/opportunities.json`
- `data/processed/policies.json`

## 서버 업로드 위치

- `~/SKN29-4th-5TEAM/data/processed/opportunities.json`
- `~/SKN29-4th-5TEAM/data/processed/policies.json`

## 적재 방식

로컬 PC에 있던 정제 데이터 파일을 EC2 서버로 업로드한 뒤, Django management command인 `import_policies`를 사용해 운영 RDS에 적재했다.

사용한 명령어는 다음과 같다.

```bash
cd ~/SKN29-4th-5TEAM/backend
source .venv/bin/activate

python manage.py import_policies --input ../data/processed/opportunities.json --dry-run
python manage.py import_policies --input ../data/processed/opportunities.json
