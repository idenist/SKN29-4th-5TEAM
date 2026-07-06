import Card from '../common/Card.jsx';

export default function PolicyInfoSection({ policy }) {
  const items = [
    { label: '지원 내용', value: policy.support },
    { label: '대상 연령', value: policy.age },
    { label: '지역 조건', value: policy.region },
    { label: '소득 조건', value: policy.income },
    { label: '신청 기간', value: policy.period },
    { label: '마감일', value: policy.deadline }
  ];

  return (
    <Card className="policy-detail-section">
      <h2>정책 기본 정보</h2>
      <dl className="policy-detail-info-grid">
        {items.map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
      <div className="policy-detail-tags" aria-label="관련 태그">
        {policy.tags.map((tag) => (
          <span key={tag}>#{tag}</span>
        ))}
      </div>
    </Card>
  );
}
