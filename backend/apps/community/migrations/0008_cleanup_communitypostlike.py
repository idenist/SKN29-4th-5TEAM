# CommunityPostLike was never actually created (0005_communitypostlike is a
# no-op legacy branch marker), so there is nothing to clean up here.
from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('community', '0007_merge_0005_communitypostlike_0006_like'),
    ]

    operations = []