import Select from '../common/Select.jsx';

const regionOptions = [
  '서울',
  '경기',
  '인천',
  '부산',
  '대구',
  '광주',
  '대전',
  '울산',
  '세종',
  '강원',
  '충북',
  '충남',
  '전북',
  '전남',
  '경북',
  '경남',
  '제주'
].map((region) => ({ value: region, label: region }));

export default function RegionSelect({ value, error, onChange }) {
  return (
    <Select
      label="지역"
      value={value}
      options={regionOptions}
      placeholder="지역 선택"
      error={error}
      onChange={(event) => onChange(event.target.value)}
      required
    />
  );
}
