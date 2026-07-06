from __future__ import annotations

import re
from collections import Counter
from datetime import date, datetime

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.models import Count, QuerySet
from django.utils import timezone

from apps.policies.models import Policy


VALID_SOURCES = ("policy", "startup_notice", "training")
STATUS_ORDER = ("upcoming", "ongoing", "closing_soon", "closed", "unknown")
AS_OF_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def parse_as_of_date(value: str | None) -> date:
    if value is None:
        return timezone.localdate()

    if not AS_OF_PATTERN.fullmatch(value):
        raise CommandError("--as-of는 YYYY-MM-DD 형식이어야 합니다.")

    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError as exc:
        raise CommandError(
            f"유효하지 않은 --as-of 날짜입니다: {value} (YYYY-MM-DD 형식 필요)"
        ) from exc


def calculate_deadline_status(
    start_date: date | None,
    end_date: date | None,
    today: date,
    closing_days: int = 7,
) -> str:
    """신청 시작일과 종료일만으로 canonical 마감 상태를 계산한다."""
    if start_date is not None and end_date is not None and end_date < start_date:
        return "unknown"

    if end_date is not None and end_date < today:
        return "closed"

    if start_date is not None and start_date > today:
        return "upcoming"

    if end_date is not None and 0 <= (end_date - today).days <= closing_days:
        return "closing_soon"

    if start_date is not None or end_date is not None:
        return "ongoing"

    return "unknown"


def count_database_statuses(queryset: QuerySet[Policy]) -> Counter[str]:
    return Counter(
        dict(
            queryset.order_by()
            .values("deadline_status")
            .annotate(total=Count("item_id"))
            .values_list("deadline_status", "total")
        )
    )


class Command(BaseCommand):
    help = (
        "Policy의 신청 시작일/종료일을 기준으로 deadline_status를 일괄 계산하고 "
        "변경된 행만 갱신합니다."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="상태를 계산하고 통계만 출력하며 DB에는 저장하지 않습니다.",
        )
        parser.add_argument(
            "--closing-days",
            type=int,
            default=7,
            help="마감 임박으로 판단할 남은 일수입니다. 기본값: 7",
        )
        parser.add_argument(
            "--source",
            choices=VALID_SOURCES,
            help="특정 source_category만 처리합니다.",
        )
        parser.add_argument(
            "--batch-size",
            type=int,
            default=500,
            help="bulk_update 배치 크기입니다. 기본값: 500",
        )
        parser.add_argument(
            "--as-of",
            dest="as_of",
            help="계산 기준 날짜입니다. 형식: YYYY-MM-DD",
        )

    def handle(self, *args, **options):
        dry_run: bool = options["dry_run"]
        closing_days: int = options["closing_days"]
        source: str | None = options["source"]
        batch_size: int = options["batch_size"]
        today = parse_as_of_date(options["as_of"])

        if closing_days < 0:
            raise CommandError("--closing-days는 0 이상이어야 합니다.")
        if batch_size < 1:
            raise CommandError("--batch-size는 1 이상이어야 합니다.")

        queryset = Policy.objects.all().order_by("item_id")
        if source:
            queryset = queryset.filter(source_category=source)

        self.stdout.write("[마감 상태 갱신 설정]")
        self.stdout.write(f"- 기준 날짜: {today.isoformat()}")
        self.stdout.write(f"- closing_days: {closing_days}")
        self.stdout.write(f"- 처리 대상 source: {source or '전체'}")
        self.stdout.write(f"- batch_size: {batch_size}")
        self.stdout.write(f"- dry-run 여부: {'예' if dry_run else '아니오'}")

        total_count = 0
        invalid_count = 0
        invalid_ranges: list[tuple[str, date, date]] = []
        changed_policies: list[Policy] = []
        transition_counts: Counter[tuple[str, str]] = Counter()
        expected_status_counts: Counter[str] = Counter()

        for policy in queryset.iterator(chunk_size=batch_size):
            total_count += 1
            if policy.source_category == "training":
                start_date = policy.program_start_date
                end_date = policy.program_end_date
            else:
                start_date = policy.application_start_date
                end_date = policy.application_end_date

            if (
                start_date is not None
                and end_date is not None
                and end_date < start_date
            ):
                invalid_count += 1
                if len(invalid_ranges) < 10:
                    invalid_ranges.append((policy.item_id, start_date, end_date))

            new_status = calculate_deadline_status(
                start_date,
                end_date,
                today,
                closing_days,
            )
            expected_status_counts[new_status] += 1

            if policy.deadline_status == new_status:
                continue

            transition_counts[(policy.deadline_status, new_status)] += 1
            policy.deadline_status = new_status
            changed_policies.append(policy)

        unchanged_count = total_count - len(changed_policies)
        normal_count = total_count - invalid_count

        self.stdout.write("")
        self.stdout.write("[조회 및 계산 결과]")
        self.stdout.write(f"- 전체 조회 건수: {total_count:,}건")
        self.stdout.write(f"- 정상 날짜 데이터 건수: {normal_count:,}건")
        self.stdout.write(f"- 비정상 날짜 범위 건수: {invalid_count:,}건")
        change_label = "변경 예정" if dry_run else "상태 변경 대상"
        self.stdout.write(f"- {change_label} 건수: {len(changed_policies):,}건")
        self.stdout.write(f"- 상태 유지 건수: {unchanged_count:,}건")

        self.stdout.write("")
        self.stdout.write(
            "[최종 상태별 예상 건수]" if dry_run else "[계산된 최종 상태별 건수]"
        )
        for status in STATUS_ORDER:
            self.stdout.write(f"- {status}: {expected_status_counts[status]:,}건")

        self.stdout.write("")
        self.stdout.write("[상태 전환별 건수]")
        if transition_counts:
            for (old_status, new_status), count in sorted(
                transition_counts.items(), key=lambda item: (item[0][0], item[0][1])
            ):
                self.stdout.write(
                    f"- {old_status} → {new_status}: {count:,}건"
                )
        else:
            self.stdout.write("- 없음")

        if invalid_count:
            self.stdout.write("")
            self.stdout.write(
                self.style.WARNING(
                    f"[경고] 종료일이 시작일보다 빠른 비정상 날짜 범위: "
                    f"총 {invalid_count:,}건"
                )
            )
            for item_id, start_date, end_date in invalid_ranges:
                self.stdout.write(
                    self.style.WARNING(
                        f"- {item_id}: 시작일 {start_date.isoformat()}, "
                        f"종료일 {end_date.isoformat()}"
                    )
                )
            if invalid_count > len(invalid_ranges):
                self.stdout.write(
                    self.style.WARNING(
                        f"- 나머지 {invalid_count - len(invalid_ranges):,}건은 생략했습니다."
                    )
                )

        if dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    "\nDRY-RUN 완료: DB에는 아무것도 저장하지 않았습니다."
                )
            )
            return

        if changed_policies:
            update_time = timezone.now()
            for policy in changed_policies:
                policy.updated_at = update_time

            with transaction.atomic():
                Policy.objects.bulk_update(
                    changed_policies,
                    ["deadline_status", "updated_at"],
                    batch_size=batch_size,
                )

        database_status_counts = count_database_statuses(queryset)

        self.stdout.write("")
        self.stdout.write("[갱신 후 DB 상태별 건수]")
        for status in STATUS_ORDER:
            self.stdout.write(f"- {status}: {database_status_counts[status]:,}건")

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("deadline_status 갱신 완료"))
        self.stdout.write(f"- 실제 갱신 건수: {len(changed_policies):,}건")
        self.stdout.write(f"- 변경되지 않은 건수: {unchanged_count:,}건")
