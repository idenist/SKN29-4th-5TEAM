# Legacy branch marker.
#
# This migration previously created CommunityPostLike, which duplicated the
# later Like model and reused the same unique constraint name. Keeping it as a
# no-op preserves the merge dependency without creating a second like table.

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('community', '0004_rename_community_c_post_id_9f1a3b_idx_community_c_post_id_bea033_idx_and_more'),
    ]

    operations = []
