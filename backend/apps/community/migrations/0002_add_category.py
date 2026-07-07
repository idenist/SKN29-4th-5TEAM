from django.db import migrations, models


class Migration(migrations.Migration):
    """
    NOTE: dependencies의 '0001_initial'은 실제 프로젝트의
    최신 community 마이그레이션 파일명으로 바꿔주세요.
    (예: python manage.py showmigrations community 로 확인)
    """

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
                default="general",
                max_length=20,
            ),
        ),
    ]