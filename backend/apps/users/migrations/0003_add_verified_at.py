# Manually added: verified_at was included in 0002's CreateModel definition
# but the actual EC2 table was created before that field was added to the
# migration file, so the column never existed physically.
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('users', '0002_emailverificationcode'),
    ]

    operations = [
        migrations.AddField(
            model_name='emailverificationcode',
            name='verified_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]