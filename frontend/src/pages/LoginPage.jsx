import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthCard from '../components/auth/AuthCard.jsx';
import AuthForm from '../components/auth/AuthForm.jsx';
import Button from '../components/common/Button.jsx';
import Input from '../components/common/Input.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { login as loginRequest } from '../services/authApi.js';

const initialValues = {
  email: '',
  password: ''
};

function validate(values) {
  const errors = {};

  if (!values.email.trim()) {
    errors.email = '이메일을 입력해 주세요.';
  }

  if (!values.password) {
    errors.password = '비밀번호를 입력해 주세요.';
  }

  return errors;
}

function getErrorMessage(error) {
  const apiMessage = error?.responseData?.message;
  const apiReason = error?.responseData?.error?.reason;

  return apiReason || apiMessage || '로그인 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
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
      const tokens = await loginRequest({
        email: values.email,
        password: values.password
      });

      login(tokens);
      setMessage('로그인되었습니다.');
      navigate('/mypage');
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      kicker="Welcome back"
      title="로그인"
      description="이메일과 비밀번호로 서비스를 이어서 이용하세요."
      footer={
        <p>
          계정이 없나요? <Link to="/signup">회원가입</Link>
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
        <Input
          label="비밀번호"
          type="password"
          value={values.password}
          onChange={(event) => updateValue('password', event.target.value)}
          placeholder="비밀번호"
          error={errors.password}
          autoComplete="current-password"
          required
        />
        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? '로그인 중...' : '로그인'}
        </Button>
      </AuthForm>
    </AuthCard>
  );
}
