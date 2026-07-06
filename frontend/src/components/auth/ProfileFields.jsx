import Input from '../common/Input.jsx';

export default function ProfileFields({ values, errors, onChange }) {
  return (
    <div className="auth-profile-grid">
      <Input
        label="이름"
        value={values.name}
        onChange={(event) => onChange('name', event.target.value)}
        placeholder="홍길동"
        error={errors.name}
        autoComplete="name"
        required
      />
      <Input
        label="닉네임"
        value={values.nickname}
        onChange={(event) => onChange('nickname', event.target.value)}
        placeholder="정책탐색러"
        error={errors.nickname}
        required
      />
      <Input
        label="생년월일"
        type="date"
        value={values.birthDate}
        onChange={(event) => onChange('birthDate', event.target.value)}
        error={errors.birthDate}
        required
      />
    </div>
  );
}
