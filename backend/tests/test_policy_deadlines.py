from datetime import date, datetime, timedelta, timezone as datetime_timezone
from io import StringIO
from unittest.mock import patch

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import SimpleTestCase, TestCase
from django.utils import timezone

from apps.policies.management.commands.update_deadlines import (
    calculate_deadline_status,
)
from apps.policies.models import Policy


TODAY = date(2026, 7, 6)


def create_policy(**overrides):
    defaults = {
        "item_id": "DEADLINE-TEST-001",
        "title": "마감 상태 테스트 정책",
        "source_category": "policy",
        "deadline_status": "unknown",
        "application_start_date": None,
        "application_end_date": None,
    }
    defaults.update(overrides)
    return Policy.objects.create(**defaults)


class CalculateDeadlineStatusTests(SimpleTestCase):
    def test_end_date_yesterday_is_closed(self):
        self.assertEqual(
            calculate_deadline_status(None, TODAY - timedelta(days=1), TODAY),
            "closed",
        )

    def test_end_date_today_is_closing_soon(self):
        self.assertEqual(calculate_deadline_status(None, TODAY, TODAY), "closing_soon")

    def test_end_date_one_day_later_is_closing_soon(self):
        self.assertEqual(
            calculate_deadline_status(None, TODAY + timedelta(days=1), TODAY),
            "closing_soon",
        )

    def test_end_date_seven_days_later_is_closing_soon(self):
        self.assertEqual(
            calculate_deadline_status(None, TODAY + timedelta(days=7), TODAY),
            "closing_soon",
        )

    def test_end_date_eight_days_later_is_ongoing(self):
        self.assertEqual(
            calculate_deadline_status(None, TODAY + timedelta(days=8), TODAY),
            "ongoing",
        )

    def test_start_date_tomorrow_is_upcoming(self):
        self.assertEqual(
            calculate_deadline_status(TODAY + timedelta(days=1), None, TODAY),
            "upcoming",
        )

    def test_start_date_today_without_end_date_is_ongoing(self):
        self.assertEqual(calculate_deadline_status(TODAY, None, TODAY), "ongoing")

    def test_start_today_and_end_within_seven_days_is_closing_soon(self):
        self.assertEqual(
            calculate_deadline_status(TODAY, TODAY + timedelta(days=7), TODAY),
            "closing_soon",
        )

    def test_start_today_and_end_eight_days_later_is_ongoing(self):
        self.assertEqual(
            calculate_deadline_status(TODAY, TODAY + timedelta(days=8), TODAY),
            "ongoing",
        )

    def test_missing_start_and_end_within_seven_days_is_closing_soon(self):
        self.assertEqual(
            calculate_deadline_status(None, TODAY + timedelta(days=7), TODAY),
            "closing_soon",
        )

    def test_missing_start_and_end_eight_days_later_is_ongoing(self):
        self.assertEqual(
            calculate_deadline_status(None, TODAY + timedelta(days=8), TODAY),
            "ongoing",
        )

    def test_past_start_without_end_date_is_ongoing(self):
        self.assertEqual(
            calculate_deadline_status(TODAY - timedelta(days=30), None, TODAY),
            "ongoing",
        )

    def test_missing_both_dates_is_unknown(self):
        self.assertEqual(calculate_deadline_status(None, None, TODAY), "unknown")

    def test_past_end_date_has_closed_priority_for_normal_range(self):
        self.assertEqual(
            calculate_deadline_status(
                TODAY - timedelta(days=30), TODAY - timedelta(days=1), TODAY
            ),
            "closed",
        )

    def test_end_before_start_is_unknown(self):
        self.assertEqual(
            calculate_deadline_status(
                TODAY + timedelta(days=2), TODAY + timedelta(days=1), TODAY
            ),
            "unknown",
        )

    def test_closing_days_zero_marks_today_as_closing_soon(self):
        self.assertEqual(
            calculate_deadline_status(None, TODAY, TODAY, closing_days=0),
            "closing_soon",
        )

    def test_closing_days_zero_marks_tomorrow_as_ongoing(self):
        self.assertEqual(
            calculate_deadline_status(
                None, TODAY + timedelta(days=1), TODAY, closing_days=0
            ),
            "ongoing",
        )


class UpdateDeadlinesCommandTests(TestCase):
    def run_command(self, **options):
        stdout = StringIO()
        call_command("update_deadlines", stdout=stdout, **options)
        return stdout.getvalue()

    def test_dry_run_does_not_change_deadline_status(self):
        policy = create_policy(
            deadline_status="unknown",
            application_end_date=TODAY - timedelta(days=1),
        )
        old_updated_at = policy.updated_at

        output = self.run_command(dry_run=True, as_of=TODAY.isoformat())

        policy.refresh_from_db()
        self.assertEqual(policy.deadline_status, "unknown")
        self.assertEqual(policy.updated_at, old_updated_at)
        self.assertIn("변경 예정 건수: 1건", output)

    def test_actual_run_updates_deadline_status(self):
        policy = create_policy(
            deadline_status="unknown",
            application_end_date=TODAY - timedelta(days=1),
        )

        output = self.run_command(as_of=TODAY.isoformat())

        policy.refresh_from_db()
        self.assertEqual(policy.deadline_status, "closed")
        self.assertIn("실제 갱신 건수: 1건", output)

    def test_second_run_with_same_options_changes_zero_rows(self):
        create_policy(
            deadline_status="unknown",
            application_end_date=TODAY - timedelta(days=1),
        )
        self.run_command(as_of=TODAY.isoformat())

        output = self.run_command(as_of=TODAY.isoformat())

        self.assertIn("실제 갱신 건수: 0건", output)
        self.assertIn("상태 유지 건수: 1건", output)

    def test_source_policy_processes_only_policy(self):
        target = create_policy(
            item_id="SOURCE-POLICY",
            source_category="policy",
            application_end_date=TODAY - timedelta(days=1),
        )
        other = create_policy(
            item_id="SOURCE-STARTUP",
            source_category="startup_notice",
            application_end_date=TODAY - timedelta(days=1),
        )

        self.run_command(source="policy", as_of=TODAY.isoformat())

        target.refresh_from_db()
        other.refresh_from_db()
        self.assertEqual(target.deadline_status, "closed")
        self.assertEqual(other.deadline_status, "unknown")

    def test_source_startup_notice_processes_only_startup_notice(self):
        target = create_policy(
            item_id="SOURCE-STARTUP",
            source_category="startup_notice",
            application_end_date=TODAY - timedelta(days=1),
        )
        other = create_policy(
            item_id="SOURCE-TRAINING",
            source_category="training",
            program_end_date=TODAY - timedelta(days=1),
        )

        self.run_command(source="startup_notice", as_of=TODAY.isoformat())

        target.refresh_from_db()
        other.refresh_from_db()
        self.assertEqual(target.deadline_status, "closed")
        self.assertEqual(other.deadline_status, "unknown")

    def test_source_training_processes_only_training(self):
        target = create_policy(
            item_id="SOURCE-TRAINING",
            source_category="training",
            program_start_date=TODAY - timedelta(days=10),
            program_end_date=TODAY - timedelta(days=1),
        )
        other = create_policy(
            item_id="SOURCE-POLICY",
            source_category="policy",
            application_end_date=TODAY - timedelta(days=1),
        )

        self.run_command(source="training", as_of=TODAY.isoformat())

        target.refresh_from_db()
        other.refresh_from_db()
        self.assertEqual(target.deadline_status, "closed")
        self.assertEqual(other.deadline_status, "unknown")

    def test_closing_days_option_is_applied(self):
        policy = create_policy(application_end_date=TODAY + timedelta(days=3))

        self.run_command(
            as_of=TODAY.isoformat(),
            closing_days=2,
        )

        policy.refresh_from_db()
        self.assertEqual(policy.deadline_status, "ongoing")

    def test_as_of_option_is_applied(self):
        policy = create_policy(application_start_date=date(2026, 7, 7))

        self.run_command(as_of="2026-07-06")

        policy.refresh_from_db()
        self.assertEqual(policy.deadline_status, "upcoming")

    def test_negative_closing_days_is_rejected(self):
        with self.assertRaisesMessage(
            CommandError, "--closing-days는 0 이상이어야 합니다."
        ):
            self.run_command(closing_days=-1, as_of=TODAY.isoformat())

    def test_zero_batch_size_is_rejected(self):
        with self.assertRaisesMessage(
            CommandError, "--batch-size는 1 이상이어야 합니다."
        ):
            self.run_command(batch_size=0, as_of=TODAY.isoformat())

    def test_invalid_as_of_date_is_rejected(self):
        invalid_values = ("2026-13-01", "2026-02-30", "20260706", "hello")
        for value in invalid_values:
            with self.subTest(value=value):
                with self.assertRaises(CommandError):
                    self.run_command(as_of=value)

    def test_unchanged_object_is_excluded_from_update(self):
        policy = create_policy(
            deadline_status="ongoing",
            application_end_date=TODAY + timedelta(days=8),
        )
        old_time = timezone.now() - timedelta(days=3)
        Policy.objects.filter(pk=policy.pk).update(updated_at=old_time)

        output = self.run_command(as_of=TODAY.isoformat())

        policy.refresh_from_db()
        self.assertEqual(policy.updated_at, old_time)
        self.assertIn("실제 갱신 건수: 0건", output)

    def test_invalid_date_range_becomes_unknown_and_warns(self):
        policy = create_policy(
            deadline_status="ongoing",
            application_start_date=TODAY + timedelta(days=2),
            application_end_date=TODAY + timedelta(days=1),
        )

        output = self.run_command(as_of=TODAY.isoformat())

        policy.refresh_from_db()
        self.assertEqual(policy.deadline_status, "unknown")
        self.assertIn("비정상 날짜 범위 건수: 1건", output)
        self.assertIn(policy.item_id, output)
        self.assertIn("시작일 2026-07-08, 종료일 2026-07-07", output)

    def test_dry_run_output_contains_no_database_change_message(self):
        output = self.run_command(dry_run=True, as_of=TODAY.isoformat())

        self.assertIn(
            "DRY-RUN 완료: DB에는 아무것도 저장하지 않았습니다.", output
        )

    def test_actual_run_outputs_database_status_counts(self):
        create_policy(
            item_id="COUNT-CLOSED",
            application_end_date=TODAY - timedelta(days=1),
        )
        create_policy(
            item_id="COUNT-UPCOMING",
            application_start_date=TODAY + timedelta(days=1),
        )

        output = self.run_command(as_of=TODAY.isoformat())

        self.assertIn("[갱신 후 DB 상태별 건수]", output)
        self.assertIn("- upcoming: 1건", output)
        self.assertIn("- closed: 1건", output)

    def test_database_status_counts_aggregate_duplicate_statuses(self):
        create_policy(
            item_id="COUNT-CLOSED-1",
            application_end_date=TODAY - timedelta(days=1),
        )
        create_policy(
            item_id="COUNT-CLOSED-2",
            application_end_date=TODAY - timedelta(days=2),
        )

        output = self.run_command(as_of=TODAY.isoformat())

        self.assertIn("- closed: 2건", output)

    def test_updated_at_is_set_for_changed_object(self):
        policy = create_policy(application_end_date=TODAY - timedelta(days=1))
        old_time = datetime(2026, 7, 1, 0, 0, tzinfo=datetime_timezone.utc)
        update_time = datetime(2026, 7, 6, 3, 0, tzinfo=datetime_timezone.utc)
        Policy.objects.filter(pk=policy.pk).update(updated_at=old_time)

        with patch(
            "apps.policies.management.commands.update_deadlines.timezone.now",
            return_value=update_time,
        ):
            self.run_command(as_of=TODAY.isoformat())

        policy.refresh_from_db()
        self.assertEqual(policy.updated_at, update_time)

    def test_created_at_is_not_changed(self):
        policy = create_policy(application_end_date=TODAY - timedelta(days=1))
        original_created_at = policy.created_at

        self.run_command(as_of=TODAY.isoformat())

        policy.refresh_from_db()
        self.assertEqual(policy.created_at, original_created_at)
