import uuid
import boto3
from django.conf import settings


def _get_s3_client():
    return boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_S3_REGION_NAME,
    )


def _build_key(user_id, filename):
    ext = filename.rsplit(".", 1)[-1].lower()
    return f"profile/user_{user_id}_{uuid.uuid4().hex}.{ext}"


def upload_profile_image(user, file_obj):
    """
    S3에 프로필 이미지를 업로드하고 공개 URL을 반환한다.
    실패 시 boto3 예외(ClientError 등)를 그대로 올린다 — 호출부(view)에서 처리.
    """
    key = _build_key(user.id, file_obj.name)
    client = _get_s3_client()

    client.upload_fileobj(
        file_obj,
        settings.AWS_STORAGE_BUCKET_NAME,
        key,
        ExtraArgs={"ContentType": file_obj.content_type},
    )

    url = (
        f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3."
        f"{settings.AWS_S3_REGION_NAME}.amazonaws.com/{key}"
    )
    return url


def delete_profile_image(image_url):
    """
    기존 profile_image_url을 기반으로 S3 객체를 삭제한다.
    URL이 없거나 파싱 실패 시 조용히 무시한다 (삭제 실패가 API 실패로 이어지지 않도록).
    """
    if not image_url:
        return

    try:
        key = image_url.split(".amazonaws.com/", 1)[1]
    except IndexError:
        return

    client = _get_s3_client()
    client.delete_object(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=key)