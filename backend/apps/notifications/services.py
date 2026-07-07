"""Service functions for notification generation."""

from apps.notifications.models import Notification
from apps.policies.models import Scrap


DEADLINE_SOON_STATUS = "closing_soon"

TITLE_DEADLINE_SOON = (
    "\uc2a4\ud06c\ub7a9\ud55c \uc815\ucc45\uc758 "
    "\ub9c8\uac10\uc774 \uc784\ubc15\ud588\uc2b5\ub2c8\ub2e4."
)

MESSAGE_DEADLINE_SOON_TEMPLATE = (
    '"{}" \uc815\ucc45\uc758 \ub9c8\uac10\uc774 '
    "\uc784\ubc15\ud588\uc2b5\ub2c8\ub2e4. "
    "\ub9c8\uc774\ud398\uc774\uc9c0 \uad00\uc2ec "
    "\uc815\ucc45\uc5d0\uc11c \ud655\uc778\ud574 \uc8fc\uc138\uc694."
)


def generate_deadline_soon_notifications(dry_run=False):
    """
    Create deadline_soon notifications for scraped policies.

    Target:
    - Scrap rows whose policy.deadline_status is closing_soon

    Duplicate prevention:
    - Same user
    - Same policy
    - Same notification_type
    """

    scraps = (
        Scrap.objects.select_related("user", "policy")
        .filter(policy__deadline_status=DEADLINE_SOON_STATUS)
        .order_by("user_id", "policy_id")
    )

    target_count = scraps.count()
    created_count = 0
    skipped_count = 0

    for scrap in scraps:
        lookup = {
            "user": scrap.user,
            "policy": scrap.policy,
            "notification_type": Notification.NotificationType.DEADLINE_SOON,
        }

        if Notification.objects.filter(**lookup).exists():
            skipped_count += 1
            continue

        if dry_run:
            created_count += 1
            continue

        _, created = Notification.objects.get_or_create(
            **lookup,
            defaults={
                "title": TITLE_DEADLINE_SOON,
                "message": MESSAGE_DEADLINE_SOON_TEMPLATE.format(
                    scrap.policy.title
                ),
            },
        )

        if created:
            created_count += 1
        else:
            skipped_count += 1

    return {
        "target_count": target_count,
        "created_count": created_count,
        "skipped_count": skipped_count,
        "dry_run": dry_run,
    }