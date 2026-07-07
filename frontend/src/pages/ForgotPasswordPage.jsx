import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthCard from '../components/auth/AuthCard.jsx';
import AuthForm from '../components/auth/AuthForm.jsx';
import Button from '../components/common/Button.jsx';
import Input from '../components/common/Input.jsx';
import { resetPassword, sendPasswordResetEmail } from '../services/authApi.js';

function getInitialValues(email = '') {
  return {
    email,
    code: '',
    newPassword: '',
    newPasswordConfirm: ''
  };
}

function validate(values) {
  const errors = {};

  if (!values.email.trim()) errors.email = '이메일을 입력해 주세요.';
  if (!values.code.trim()) errors.code = '인증번호를 입력해 주세요.';
  if (!values.newPassword) errors.newPassword = '새 비밀번호를 입력해 주세요.';
  if (values.newPassword && values.newPassword.length < 8) {
    errors.newPassword = '비밀번호는 8자 이상이어야 합니다.';
  }
  if (!values.newPasswordConfirm) {
    errors.newPasswordConfirm = '새 비밀번호 확인을 입력해 주세요.';
  }
  if (
    values.newPassword &&
    values.newPasswordConfirm &&
    values.newPassword !== values.newPasswordConfirm
  ) {
    errors.newPasswordConfirm = '비밀번호가 일치하지 않습니다.';
  }

  return errors;
}

function getErrorMessage(error, fallback) {
  const apiReason = error?.responseData?.error?.reason;
  const apiMessage = error?.responseData?.message;
  const plainMessage = error?.response?.data?.detail || error?.message;

  return apiReason || apiMessage || plainMessage || fallback;
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState(() => getInitialValues(location.state?.email || ''));
  const [errors, setErrors] = useState({});
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');

  const updateValue = (key, value) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
    setMessage('');
    setFormError('');
  };

  const handleSendCode = async () => {
    if (!values.email.trim()) {
      setErrors((current) => ({ ...current, email: '이메일을 입력해 주세요.' }));
      return;
    }

    setIsSendingCode(true);
    setMessage('');
    setFormError('');

    try {
      await sendPasswordResetEmail({ email: values.email.trim() });
      setMessage('비밀번호 재설정 인증번호를 이메일로 보냈습니다.');
    } catch (error) {
      setFormError(getErrorMessage(error, '인증번호 발송 중 문제가 발생했습니다.'));
    } finally {
      setIsSendingCode(false);
    }
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
      await resetPassword({
        email: values.email.trim(),
        code: values.code.trim(),
        newPassword: values.newPassword,
        newPasswordConfirm: values.newPasswordConfirm
      });
      setMessage('비밀번호가 변경되었습니다. 로그인 화면으로 이동합니다.');
      window.setTimeout(() => navigate('/login'), 900);
    } catch (error) {
      setFormError(getErrorMessage(error, '비밀번호 변경 중 문제가 발생했습니다.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      kicker="Password reset"
      title="비밀번호 찾기"
      description="가입할 때 인증했던 이메일로 인증번호를 받아 새 비밀번호를 설정하세요."
      footer={
        <p>
          비밀번호가 기억났나요? <Link to="/login">로그인</Link>
        </p>
      }
    >
      <AuthForm onSubmit={handleSubmit} successMessage={message}>
        {formError ? (
          <p className="ui-error" role="alert">
            {formError}
          </p>
        ) : null}
        <Input
          label="이메일"
          type="email"
          value={values.email}
          onChange={(event) => updateValue('email', event.target.value)}
          placeholder="you@example.com"
          error={errors.email}
          autoComplete="email"
          required
        />
        <Button type="button" variant="secondary" fullWidth onClick={handleSendCode} disabled={isSendingCode}>
          {isSendingCode ? '발송 중...' : '인증번호 받기'}
        </Button>
        <Input
          label="인증번호"
          value={values.code}
          onChange={(event) => updateValue('code', event.target.value)}
          placeholder="6자리 인증번호"
          error={errors.code}
          inputMode="numeric"
          required
        />
        <Input
          label="새 비밀번호"
          type="password"
          value={values.newPassword}
          onChange={(event) => updateValue('newPassword', event.target.value)}
          placeholder="8자 이상"
          error={errors.newPassword}
          autoComplete="new-password"
          required
        />
        <Input
          label="새 비밀번호 확인"
          type="password"
          value={values.newPasswordConfirm}
          onChange={(event) => updateValue('newPasswordConfirm', event.target.value)}
          placeholder="새 비밀번호 재입력"
          error={errors.newPasswordConfirm}
          autoComplete="new-password"
          required
        />
        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? '변경 중...' : '비밀번호 변경'}
        </Button>
      </AuthForm>
    </AuthCard>
  );
}
