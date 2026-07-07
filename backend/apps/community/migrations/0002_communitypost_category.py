# Generated manually for community categories.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("community", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="communitypost",
            name="category",
            field=models.CharField(
                choices=[
                    ("general", "일반"),
                    ("housing", "주거"),
                    ("finance", "금융"),
                    ("employment", "취업"),
                    ("education", "교육"),
                    ("startup", "창업"),
                    ("etc", "기타"),
                ],
                db_index=True,
                default="general",
                max_length=20,
            ),
        ),
    ]
