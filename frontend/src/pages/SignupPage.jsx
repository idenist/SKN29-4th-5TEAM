import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthCard from '../components/auth/AuthCard.jsx';
import AuthForm from '../components/auth/AuthForm.jsx';
import ProfileFields from '../components/auth/ProfileFields.jsx';
import RegionSelect from '../components/auth/RegionSelect.jsx';
import Button from '../components/common/Button.jsx';
import Input from '../components/common/Input.jsx';
import { signup } from '../services/authApi.js';

const interestOptions = ['주거', '금융', '취업', '교육', '창업'];

const initialValues = {
  email: '',
  password: '',
  passwordConfirm: '',
  name: '',
  nickname: '',
  birthDate: '',
  region: '',
  interests: []
};

function validate(values) {
  const errors = {};

  if (!values.email.trim()) errors.email = '이메일을 입력해 주세요.';
  if (!values.password) errors.password = '비밀번호를 입력해 주세요.';
  if (values.password && values.password.length < 8) errors.password = '비밀번호는 8자 이상이어야 합니다.';
  if (!values.passwordConfirm) errors.passwordConfirm = '비밀번호 확인을 입력해 주세요.';
  if (values.password && values.passwordConfirm && values.password !== values.passwordConfirm) {
    errors.passwordConfirm = '비밀번호가 일치하지 않습니다.';
  }
  if (!values.name.trim()) errors.name = '이름을 입력해 주세요.';
  if (!values.nickname.trim()) errors.nickname = '닉네임을 입력해 주세요.';
  if (!values.birthDate) errors.birthDate = '생년월일을 선택해 주세요.';
  if (!values.region) errors.region = '지역을 선택해 주세요.';
  if (values.interests.length === 0) errors.interests = '관심 분야를 1개 이상 선택해 주세요.';

  return errors;
}

function getUsername(values) {
  return values.nickname.trim() || values.email.split('@')[0] || values.email;
}

function getErrorMessage(error) {
  const apiMessage = error?.responseData?.message;
  const apiReason = error?.responseData?.error?.reason;

  return apiReason || apiMessage || '회원가입 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';
}

export default function SignupPage() {
  const navigate = useNavigate();
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
    setErrors((current) => ({ ...current, interests: '' }));
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
      await signup({
        email: values.email,
        username: getUsername(values),
        password: values.password,
        passwordConfirm: values.passwordConfirm
      });

      setMessage('회원가입이 완료되었습니다. 로그인 화면으로 이동합니다.');
      window.setTimeout(() => navigate('/login'), 700);
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      kicker="Create account"
      title="회원가입"
      description="맞춤 정책 추천을 위해 기본 프로필을 입력해 주세요."
      footer={
        <p>
          이미 계정이 있나요? <Link to="/login">로그인</Link>
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
          placeholder="8자 이상"
          error={errors.password}
          autoComplete="new-password"
          required
        />
        <Input
          label="비밀번호 확인"
          type="password"
          value={values.passwordConfirm}
          onChange={(event) => updateValue('passwordConfirm', event.target.value)}
          placeholder="비밀번호 재입력"
          error={errors.passwordConfirm}
          autoComplete="new-password"
          required
        />
        <ProfileFields values={values} errors={errors} onChange={updateValue} />
        <RegionSelect value={values.region} error={errors.region} onChange={(value) => updateValue('region', value)} />
        <fieldset className="auth-interest-field">
          <legend>관심 분야</legend>
          <div className="auth-interest-list">
            {interestOptions.map((interest) => (
              <label
                key={interest}
                className={
                  values.interests.includes(interest)
                    ? 'auth-interest-option auth-interest-option-selected'
                    : 'auth-interest-option'
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
          {errors.interests ? <p className="ui-error">{errors.interests}</p> : null}
        </fieldset>
        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? '가입 처리 중...' : '회원가입'}
        </Button>
      </AuthForm>
    </AuthCard>
  );
}
