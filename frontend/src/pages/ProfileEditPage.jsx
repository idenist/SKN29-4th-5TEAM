import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ErrorState from '../components/common/ErrorState.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import Spinner from '../components/common/Spinner.jsx';
import ProfileEditForm from '../components/mypage/ProfileEditForm.jsx';
import { useProfile } from '../hooks/useProfile.js';

export default function ProfileEditPage() {
  const {
    profile,
    isLoading,
    isSubmitting,
    error,
    message,
    refetch,
    saveProfile,
    uploadImage,
    deleteImage
  } = useProfile();

  return (
    <div className="profile-edit-page">
      <Link to="/mypage" className="ui-button ui-button-ghost ui-button-sm mypage-back-link">
        <ArrowLeft size={16} aria-hidden="true" />
        마이페이지로
      </Link>
      <PageHeader
        kicker="Profile"
        title="프로필 수정"
        description="프로필 정보와 이미지를 실제 마이페이지 API 기준으로 수정합니다."
      />

      {isLoading ? (
        <Spinner label="프로필을 불러오는 중..." />
      ) : !profile && error ? (
        <ErrorState title="프로필을 불러오지 못했습니다" description={error} onRetry={refetch} />
      ) : (
        <ProfileEditForm
          user={profile}
          onSave={saveProfile}
          onUploadImage={uploadImage}
          onDeleteImage={deleteImage}
          isSubmitting={isSubmitting}
          message={message}
          error={error}
        />
      )}
    </div>
  );
}
