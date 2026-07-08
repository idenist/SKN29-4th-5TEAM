import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../common/Button.jsx';
import Card from '../common/Card.jsx';
import Input from '../common/Input.jsx';
import RegionSelect from '../auth/RegionSelect.jsx';

const interestOptions = ['주거', '금융', '취업', '교육', '창업'];

export default function ProfileEditForm({
  user,
  onSave,
  onUploadImage,
  onDeleteImage,
  isSubmitting = false,
  message = '',
  error = ''
}) {
  const [values, setValues] = useState({
    username: '',
    email: '',
    age: '',
    region: '',
    interests: [],
    profileImageName: ''
  });

  useEffect(() => {
    setValues({
      username: user?.username || user?.nickname || '',
      email: user?.email || '',
      age: user?.age || user?.profile?.age || '',
      region: user?.region || user?.profile?.region || '',
      interests: user?.interests || user?.profile?.interests || [],
      profileImageName: ''
    });
  }, [user]);

  const updateValue = (key, value) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const toggleInterest = (interest) => {
    setValues((current) => {
      const hasInterest = current.interests.includes(interest);
      return {
        ...current,
        interests: hasInterest
          ? current.interests.filter((item) => item !== interest)
          : [...current.interests, interest]
      };
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    onSave?.({
      age: values.age === '' ? null : Number(values.age),
      region: values.region,
      interests: values.interests
    });
  };

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    updateValue('profileImageName', file?.name || '');

    if (file) {
      await onUploadImage?.(file);
    }
  };

  return (
    <Card className="profile-edit-card">
      <form className="profile-edit-form" onSubmit={handleSubmit}>
        <label className="profile-image-upload">
          <span>프로필 이미지</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleImageChange}
            disabled={isSubmitting}
          />
          <strong>{values.profileImageName || '선택한 파일 없음'}</strong>
        </label>
        <Button type="button" variant="ghost" onClick={onDeleteImage} disabled={isSubmitting}>
          이미지 삭제
        </Button>

        <div className="profile-edit-grid">
          <Input label="이름/닉네임" value={values.username} disabled />
          <Input label="이메일" value={values.email} disabled />
          <Input
            label="나이"
            type="number"
            min="1"
            max="119"
            value={values.age}
            onChange={(event) => updateValue('age', event.target.value)}
          />
          <RegionSelect value={values.region} onChange={(value) => updateValue('region', value)} />
        </div>

        <fieldset className="profile-interest-field">
          <legend>관심 분야</legend>
          <div className="profile-interest-list">
            {interestOptions.map((interest) => (
              <label
                key={interest}
                className={
                  values.interests.includes(interest)
                    ? 'profile-interest-option profile-interest-option-selected'
                    : 'profile-interest-option'
                }
              >
                <input
                  type="checkbox"
                  checked={values.interests.includes(interest)}
                  onChange={() => toggleInterest(interest)}
                />
                <span>{interest}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {message ? <p className="mypage-success" role="status">{message}</p> : null}
        {error ? <p className="ui-error" role="alert">{error}</p> : null}

        <div className="profile-edit-actions">
          <Link to="/mypage/password" className="ui-button ui-button-secondary ui-button-md">
            비밀번호 변경
          </Link>
          <div>
            <Link to="/mypage" className="ui-button ui-button-ghost ui-button-md">
              취소
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
