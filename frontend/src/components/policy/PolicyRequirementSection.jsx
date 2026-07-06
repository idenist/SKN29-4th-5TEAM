import Card from '../common/Card.jsx';

export default function PolicyRequirementSection({ policy }) {
  return (
    <Card className="policy-detail-section">
      <h2>신청 대상</h2>
      <ul className="policy-detail-list">
        {policy.requirements.map((requirement) => (
          <li key={requirement}>{requirement}</li>
        ))}
      </ul>
    </Card>
  );
}
