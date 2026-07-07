from django.core.management.base import BaseCommand

from apps.notifications.services import generate_deadline_soon_notifications


class Command(BaseCommand):
    help = "Generate deadline_soon notifications for scraped policies."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Check target count without saving notifications.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]

        result = generate_deadline_soon_notifications(dry_run=dry_run)

        self.stdout.write(
            self.style.SUCCESS(
                "[deadline notification generation completed]\n"
                f"- dry_run: {result['dry_run']}\n"
                f"- target_scraps: {result['target_count']}\n"
                f"- created_or_expected: {result['created_count']}\n"
                f"- skipped_duplicates: {result['skipped_count']}"
            )
        )