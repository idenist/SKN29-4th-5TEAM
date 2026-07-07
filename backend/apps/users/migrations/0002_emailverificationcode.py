# Generated manually for email verification.

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="EmailVerificationCode",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("email", models.EmailField(db_index=True, max_length=254)),
                ("code", models.CharField(max_length=6, validators=[django.core.validators.MinLengthValidator(6)])),
                (
                    "purpose",
                    models.CharField(
                        choices=[
                            ("signup", "회원가입"),
                            ("password_reset", "비밀번호 재설정"),
                        ],
                        max_length=20,
                    ),
                ),
                ("is_verified", models.BooleanField(default=False)),
                ("is_used", models.BooleanField(default=False)),
                ("expires_at", models.DateTimeField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("verified_at", models.DateTimeField(blank=True, null=True)),
            ],
            options={
                "ordering": ["-created_at"],
                "indexes": [
                    models.Index(fields=["email", "purpose", "-created_at"], name="users_email_verify_lookup"),
                ],
            },
        ),
    ]
