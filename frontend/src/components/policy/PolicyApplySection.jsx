import Card from '../common/Card.jsx';

export default function PolicyApplySection({ policy }) {
  return (
    <Card className="policy-detail-section">
      <h2>신청 방법</h2>
      <ol className="policy-detail-list policy-detail-steps">
        {policy.applyMethod.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>

      <h3>필요 서류</h3>
      <ul className="policy-document-list">
        {policy.documents.map((document) => (
          <li key={document}>{document}</li>
        ))}
      </ul>
    </Card>
  );
}
