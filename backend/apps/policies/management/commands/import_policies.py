from __future__ import annotations

import json
import re
from collections import Counter
from datetime import date, datetime
from pathlib import Path
from typing import Any, Iterable

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from apps.policies.models import Policy


VALID_SOURCES = {"policy", "startup_notice", "training"}
VALID_DEADLINE_STATUSES = {
    "upcoming",
    "ongoing",
    "closing_soon",
    "closed",
    "unknown",
}

UPDATE_FIELDS = [
    "original_id",
    "source_category",
    "source_name",
    "title",
    "domain",
    "policy_summary",
    "participation_target",
    "benefit_text",
    "region_codes",
    "location",
    "income_condition",
    "age_min",
    "age_max",
    "application_period_text",
    "application_start_date",
    "application_end_date",
    "application_method",
    "program_start_date",
    "program_end_date",
    "program_period_text",
    "application_url",
    "source_url",
    "source_url_2",
    "organization",
    "contact",
    "raw_data",
    "info_score",
    "needs_detail_check",
    "deadline_status",
]


def chunks(items: list[Any], size: int) -> Iterable[list[Any]]:
    for start in range(0, len(items), size):
        yield items[start : start + size]


def load_json_records(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        raise CommandError(f"JSON 파일을 찾을 수 없습니다: {path}")

    try:
        payload = json.loads(path.read_text(encoding="utf-8-sig"))
    except json.JSONDecodeError as exc:
        raise CommandError(f"JSON 파싱 실패: {path}\n{exc}") from exc

    if isinstance(payload, list):
        records = payload
    elif isinstance(payload, dict):
        records = (
            payload.get("items")
            or payload.get("data")
            or payload.get("results")
            or payload.get("opportunities")
        )
        if not isinstance(records, list):
            raise CommandError(
                "지원하지 않는 JSON 구조입니다. 최상위가 list이거나 "
                "items/data/results/opportunities 키가 필요합니다."
            )
    else:
        raise CommandError(
            f"지원하지 않는 JSON 최상위 타입입니다: {type(payload).__name__}"
        )

    invalid = [index for index, row in enumerate(records) if not isinstance(row, dict)]
    if invalid:
        raise CommandError(f"dict가 아닌 레코드가 있습니다. 첫 위치: {invalid[:10]}")

    return records


def text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value.strip()
    return str(value).strip()


def clipped(field_name: str, value: Any) -> str:
    result = text(value)
    field = Policy._meta.get_field(field_name)
    max_length = getattr(field, "max_length", None)
    if max_length and len(result) > max_length:
        return result[:max_length]
    return result


def safe_int(value: Any, default: int | None = None) -> int | None:
    if value is None or value == "":
        return default
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(value)

    value_text = text(value).replace(",", "")
    try:
        return int(float(value_text))
    except (TypeError, ValueError):
        match = re.search(r"-?\d+", value_text)
        return int(match.group()) if match else default


def safe_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    if isinstance(value, (int, float)):
        return value != 0

    normalized = text(value).lower()
    return normalized in {
        "1",
        "true",
        "t",
        "yes",
        "y",
        "on",
        "예",
        "네",
        "필요",
    }


def safe_date(value: Any) -> date | None:
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value

    value_text = text(value)
    if not value_text:
        return None

    # YYYY-MM-DD / YYYY.MM.DD / YYYY/MM/DD / YYYYMMDD 및
    # 뒤에 시간이 붙은 값까지 첫 날짜만 추출합니다.
    match = re.search(
        r"(?P<year>\d{4})[-./]?(?P<month>\d{1,2})[-./]?(?P<day>\d{1,2})",
        value_text,
    )
    if not match:
        return None

    try:
        return date(
            int(match.group("year")),
            int(match.group("month")),
            int(match.group("day")),
        )
    except ValueError:
        return None


def normalize_region_codes(value: Any) -> list[str]:
    if value is None or value == "":
        return []

    if isinstance(value, list):
        return [text(item) for item in value if text(item)]

    if isinstance(value, (tuple, set)):
        return [text(item) for item in value if text(item)]

    if isinstance(value, dict):
        return [text(item) for item in value.values() if text(item)]

    value_text = text(value)
    if not value_text:
        return []

    if value_text.startswith("[") and value_text.endswith("]"):
        try:
            parsed = json.loads(value_text)
            if isinstance(parsed, list):
                return [text(item) for item in parsed if text(item)]
        except json.JSONDecodeError:
            pass

    parts = re.split(r"[,;|]+", value_text)
    return [part.strip() for part in parts if part.strip()]


def normalize_deadline_status(
    raw_status: Any,
    start_date: date | None,
    end_date: date | None,
    is_open: Any,
) -> str:
    status_map = {
        "open": "ongoing",
        "opened": "ongoing",
        "active": "ongoing",
        "expired": "closed",
        "close": "closed",
        "closing": "closing_soon",
    }

    normalized = text(raw_status).lower()
    normalized = status_map.get(normalized, normalized)
    if normalized in VALID_DEADLINE_STATUSES:
        return normalized

    today = timezone.localdate()

    if end_date and end_date < today:
        return "closed"
    if start_date and start_date > today:
        return "upcoming"
    if end_date and 0 <= (end_date - today).days <= 7:
        return "closing_soon"
    if start_date or end_date:
        return "ongoing"

    if isinstance(is_open, bool):
        return "ongoing" if is_open else "closed"

    return "unknown"


def build_income_map(records: list[dict[str, Any]]) -> dict[str, str]:
    result: dict[str, str] = {}

    for row in records:
        income = text(row.get("income_condition"))
        if not income:
            continue

        candidate_ids = {
            text(row.get("item_id")),
            text(row.get("policy_id")),
            text(row.get("original_id")),
            text(row.get("id")),
        }

        for candidate in list(candidate_ids):
            if candidate:
                candidate_ids.add(f"policy_{candidate}")

        for candidate in candidate_ids:
            if candidate:
                result[candidate] = income

    return result


def get_existing_ids(item_ids: list[str], batch_size: int = 5000) -> set[str]:
    existing: set[str] = set()
    for id_batch in chunks(item_ids, batch_size):
        existing.update(
            Policy.objects.filter(item_id__in=id_batch).values_list(
                "item_id", flat=True
            )
        )
    return existing


class Command(BaseCommand):
    help = (
        "opportunities.json의 정책/창업공고/훈련과정을 Policy 테이블에 "
        "item_id 기준으로 일괄 등록 또는 갱신합니다."
    )

    def add_arguments(self, parser):
        project_root = Path(settings.BASE_DIR).parent

        parser.add_argument(
            "--input",
            default=str(
                project_root / "data" / "processed" / "opportunities.json"
            ),
            help="opportunities.json 경로",
        )
        parser.add_argument(
            "--policies-input",
            default=str(project_root / "data" / "processed" / "policies.json"),
            help="income_condition 보충용 policies.json 경로",
        )
        parser.add_argument(
            "--source",
            choices=sorted(VALID_SOURCES),
            help="특정 source_category만 적재",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=0,
            help="시험 적재 건수. 0이면 전체 적재",
        )
        parser.add_argument(
            "--batch-size",
            type=int,
            default=500,
            help="DB 일괄 처리 크기",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="DB에 저장하지 않고 검증과 매핑만 수행",
        )

    def handle(self, *args, **options):
        input_path = Path(options["input"]).expanduser().resolve()
        policies_path = Path(options["policies_input"]).expanduser().resolve()
        source_filter: str | None = options["source"]
        limit: int = options["limit"]
        batch_size: int = options["batch_size"]
        dry_run: bool = options["dry_run"]

        if batch_size < 1:
            raise CommandError("--batch-size는 1 이상이어야 합니다.")
        if limit < 0:
            raise CommandError("--limit는 0 이상이어야 합니다.")

        self.stdout.write(f"[입력 파일] {input_path}")
        records = load_json_records(input_path)

        if source_filter:
            records = [
                row
                for row in records
                if text(row.get("source_category")) == source_filter
            ]

        if limit:
            records = records[:limit]

        if not records:
            raise CommandError("적재 대상 데이터가 없습니다.")

        item_ids = [text(row.get("item_id")) for row in records]
        empty_ids = [index for index, item_id in enumerate(item_ids) if not item_id]
        duplicate_ids = [
            item_id
            for item_id, count in Counter(item_ids).items()
            if item_id and count > 1
        ]

        if empty_ids:
            raise CommandError(
                f"item_id가 빈 레코드가 있습니다. 첫 위치: {empty_ids[:20]}"
            )
        if duplicate_ids:
            raise CommandError(
                f"중복 item_id가 있습니다. 첫 값: {duplicate_ids[:20]}"
            )

        category_counts = Counter(
            text(row.get("source_category")) for row in records
        )
        invalid_categories = sorted(set(category_counts) - VALID_SOURCES)
        if invalid_categories:
            raise CommandError(
                f"지원하지 않는 source_category: {invalid_categories}"
            )

        missing_titles = [
            row["item_id"]
            for row in records
            if not text(row.get("title"))
        ]
        if missing_titles:
            raise CommandError(
                f"title이 빈 레코드가 있습니다. 첫 item_id: {missing_titles[:20]}"
            )

        income_map: dict[str, str] = {}
        if policies_path.exists():
            policy_records = load_json_records(policies_path)
            income_map = build_income_map(policy_records)
            self.stdout.write(
                f"[정책 보충 파일] {policies_path} "
                f"(income_condition 매핑 {len(income_map):,}개)"
            )
        else:
            self.stdout.write(
                self.style.WARNING(
                    f"[경고] policies.json이 없어 opportunities.json의 "
                    f"income_condition만 사용합니다: {policies_path}"
                )
            )

        mapped_rows: list[dict[str, Any]] = []
        invalid_date_counts: Counter[str] = Counter()
        income_joined = 0

        for original in records:
            item_id = text(original.get("item_id"))
            original_id = text(original.get("original_id"))

            application_start_date = safe_date(
                original.get("application_start_date")
            )
            application_end_date = safe_date(
                original.get("application_end_date")
            )
            program_start_date = safe_date(original.get("program_start_date"))
            program_end_date = safe_date(original.get("program_end_date"))

            for field_name, parsed_date in (
                ("application_start_date", application_start_date),
                ("application_end_date", application_end_date),
                ("program_start_date", program_start_date),
                ("program_end_date", program_end_date),
            ):
                if original.get(field_name) not in (None, "") and parsed_date is None:
                    invalid_date_counts[field_name] += 1

            income_condition = text(original.get("income_condition"))
            if not income_condition and original.get("source_category") == "policy":
                income_condition = (
                    income_map.get(item_id)
                    or income_map.get(original_id)
                    or income_map.get(f"policy_{original_id}")
                    or ""
                )
                if income_condition:
                    income_joined += 1

            deadline_status = normalize_deadline_status(
                original.get("deadline_status"),
                application_start_date,
                application_end_date,
                original.get("is_open"),
            )

            # raw_data에는 컬럼화된 값을 빼지 않고 원본 한 건 전체를 보존합니다.
            # 향후 재검증·재매핑 시 원본을 복원할 수 있도록 하기 위함입니다.
            raw_data = dict(original)

            mapped_rows.append(
                {
                    "item_id": clipped("item_id", item_id),
                    "original_id": clipped("original_id", original_id),
                    "source_category": clipped(
                        "source_category", original.get("source_category")
                    ),
                    "source_name": clipped(
                        "source_name", original.get("source_name")
                    ),
                    "title": clipped("title", original.get("title")),
                    "domain": clipped("domain", original.get("domain")),
                    "policy_summary": text(
                        original.get("summary")
                        or original.get("policy_summary")
                    ),
                    "participation_target": text(
                        original.get("target_text")
                        or original.get("participation_target")
                    ),
                    "benefit_text": text(original.get("benefit_text")),
                    "region_codes": normalize_region_codes(
                        original.get("region_codes")
                        if original.get("region_codes") not in (None, "")
                        else original.get("region")
                    ),
                    "location": text(original.get("location")),
                    "income_condition": income_condition,
                    "age_min": safe_int(original.get("age_min")),
                    "age_max": safe_int(original.get("age_max")),
                    "application_period_text": text(
                        original.get("application_period_text")
                    ),
                    "application_start_date": application_start_date,
                    "application_end_date": application_end_date,
                    "application_method": clipped(
                        "application_method",
                        original.get("application_method"),
                    ),
                    "program_start_date": program_start_date,
                    "program_end_date": program_end_date,
                    "program_period_text": text(
                        original.get("program_period_text")
                    ),
                    "application_url": clipped(
                        "application_url", original.get("application_url")
                    ),
                    "source_url": clipped(
                        "source_url", original.get("source_url")
                    ),
                    "source_url_2": clipped(
                        "source_url_2", original.get("source_url_2")
                    ),
                    "organization": clipped(
                        "organization", original.get("organization")
                    ),
                    "contact": clipped("contact", original.get("contact")),
                    "raw_data": raw_data,
                    "info_score": safe_int(original.get("info_score"), 0) or 0,
                    "needs_detail_check": safe_bool(
                        original.get("needs_detail_check")
                    ),
                    "deadline_status": deadline_status,
                }
            )

        self.stdout.write("")
        self.stdout.write("[사전 검증 결과]")
        self.stdout.write(f"- 적재 대상: {len(mapped_rows):,}건")
        self.stdout.write(f"- item_id 고유값: {len(set(item_ids)):,}개")
        self.stdout.write(f"- 카테고리: {dict(category_counts)}")
        self.stdout.write(f"- policies.json 소득조건 보충: {income_joined:,}건")

        if invalid_date_counts:
            self.stdout.write(
                self.style.WARNING(
                    f"- 날짜 파싱 실패: {dict(invalid_date_counts)} "
                    f"(해당 날짜는 NULL 저장)"
                )
            )
        else:
            self.stdout.write("- 날짜 파싱 실패: 0건")

        if dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    "\nDRY-RUN 완료: DB에는 아무것도 저장하지 않았습니다."
                )
            )
            return

        existing_ids = get_existing_ids(item_ids)
        create_estimate = len(item_ids) - len(existing_ids)
        update_estimate = len(existing_ids)

        processed = 0
        with transaction.atomic():
            for row_batch in chunks(mapped_rows, batch_size):
                objects = [Policy(**row) for row in row_batch]
                Policy.objects.bulk_create(
                    objects,
                    batch_size=batch_size,
                    update_conflicts=True,
                    unique_fields=["item_id"],
                    update_fields=UPDATE_FIELDS,
                )
                processed += len(row_batch)
                self.stdout.write(
                    f"[진행] {processed:,}/{len(mapped_rows):,}건",
                    ending="\r",
                )

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("\nDB 적재 완료"))
        self.stdout.write(f"- 신규 예상: {create_estimate:,}건")
        self.stdout.write(f"- 갱신 예상: {update_estimate:,}건")
        self.stdout.write(f"- 처리 합계: {len(mapped_rows):,}건")
        self.stdout.write(f"- 현재 Policy 전체: {Policy.objects.count():,}건")

        db_counts = Counter(
            Policy.objects.values_list("source_category", flat=True)
        )
        self.stdout.write(f"- DB 카테고리별 건수: {dict(db_counts)}")
