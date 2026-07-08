import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import Input from '../components/common/Input.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { changePassword } from '../services/authApi.js';

const initialValues = {
  currentPassword: '',
  newPassword: '',
  newPasswordConfirm: ''
};

function validate(values) {
  const errors = {};

  if (!values.currentPassword) errors.currentPassword = '현재 비밀번호를 입력해 주세요.';
  if (!values.newPassword) errors.newPassword = '새 비밀번호를 입력해 주세요.';
  if (values.newPassword && values.newPassword.length < 8) errors.newPassword = '비밀번호는 8자 이상이어야 합니다.';
  if (!values.newPasswordConfirm) errors.newPasswordConfirm = '새 비밀번호 확인을 입력해 주세요.';
  if (
    values.newPassword &&
    values.newPasswordConfirm &&
    values.newPassword !== values.newPasswordConfirm
  ) {
    errors.newPasswordConfirm = '비밀번호가 일치하지 않습니다.';
  }

  return errors;
}

function getErrorMessage(error) {
  const apiMessage = error?.responseData?.message;
  const apiReason = error?.responseData?.error?.reason;

  return apiReason || apiMessage || '비밀번호 변경 중 문제가 발생했습니다.';
}

export default function PasswordChangePage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');

  const updateValue = (key, value) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
    setMessage('');
    setFormError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    setMessage('');
    setFormError('');

    try {
      await changePassword(values);
      setMessage('비밀번호가 변경되었습니다. 새 비밀번호로 다시 로그인해 주세요.');
      window.setTimeout(() => {
        logout();
        navigate('/login');
      }, 900);
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="profile-edit-page">
      <Link to="/mypage" className="ui-button ui-button-ghost ui-button-sm mypage-back-link">
        <ArrowLeft size={16} aria-hidden="true" />
        마이페이지로
      </Link>
      <PageHeader
        kicker="Security"
        title="비밀번호 변경"
        description="현재 비밀번호를 확인한 뒤 새 비밀번호로 변경합니다."
      />

      <Card className="profile-edit-card">
        <form className="profile-edit-form" onSubmit={handleSubmit}>
          {formError ? (
            <p className="ui-error" role="alert">
              {formError}
            </p>
          ) : null}
          <Input
            label="현재 비밀번호"
            type="password"
            value={values.currentPassword}
            onChange={(event) => updateValue('currentPassword', event.target.value)}
            error={errors.currentPassword}
            autoComplete="current-password"
            required
          />
          <Input
            label="새 비밀번호"
            type="password"
            value={values.newPassword}
            onChange={(event) => updateValue('newPassword', event.target.value)}
            error={errors.newPassword}
            autoComplete="new-password"
            required
          />
          <Input
            label="새 비밀번호 확인"
            type="password"
            value={values.newPasswordConfirm}
            onChange={(event) => updateValue('newPasswordConfirm', event.target.value)}
            error={errors.newPasswordConfirm}
            autoComplete="new-password"
            required
          />
          {message ? <p className="mypage-success" role="status">{message}</p> : null}
          <div className="profile-edit-actions">
            <Link to="/mypage" className="ui-button ui-button-ghost ui-button-md">
              취소
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '변경 중...' : '비밀번호 변경'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
