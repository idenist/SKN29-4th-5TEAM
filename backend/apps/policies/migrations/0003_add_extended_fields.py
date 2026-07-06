from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("policies", "0002_policy_age_max_policy_age_min"),
    ]

    operations = [
        migrations.AddField(
            model_name="policy",
            name="original_id",
            field=models.CharField(
                max_length=100, blank=True, default="", db_index=True,
                help_text="통합 전 출처(온통청년/K-Startup/고용24)의 원본 ID (중복/변경 감지 추적용)",
            ),
        ),
        migrations.AddField(
            model_name="policy",
            name="source_name",
            field=models.CharField(
                max_length=100, blank=True, default="",
                help_text="세부 출처/운영 플랫폼명 (예: 온통청년, K-Startup, 고용24)",
            ),
        ),
        migrations.AddField(
            model_name="policy",
            name="benefit_text",
            field=models.TextField(
                blank=True, default="", help_text="실제 지원금/교육비/혜택 내용"
            ),
        ),
        migrations.AddField(
            model_name="policy",
            name="location",
            field=models.TextField(
                blank=True, default="", help_text="원문 장소/주소 (region_codes와 별도, 상세화면용)"
            ),
        ),
        migrations.AddField(
            model_name="policy",
            name="application_method",
            field=models.CharField(
                max_length=100, blank=True, default="", help_text="온라인/방문/이메일 등 신청 방법"
            ),
        ),
        migrations.AddField(
            model_name="policy",
            name="program_start_date",
            field=models.DateField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name="policy",
            name="program_end_date",
            field=models.DateField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name="policy",
            name="program_period_text",
            field=models.TextField(blank=True, default="", help_text="운영기간 원문 텍스트"),
        ),
        migrations.AddField(
            model_name="policy",
            name="organization",
            field=models.CharField(max_length=200, blank=True, default=""),
        ),
        migrations.AddField(
            model_name="policy",
            name="contact",
            field=models.CharField(
                max_length=200, blank=True, default="", help_text="문의처 (담당자/전화/이메일 등)"
            ),
        ),
        migrations.AddField(
            model_name="policy",
            name="raw_data",
            field=models.JSONField(
                default=dict, blank=True, help_text="출처별 나머지 원본 필드 전체 보존용"
            ),
        ),
        migrations.AlterField(
            model_name="policy",
            name="participation_target",
            field=models.TextField(blank=True),
        ),
        migrations.AlterField(
            model_name="policy",
            name="application_period_text",
            field=models.TextField(blank=True),
        ),
    ]