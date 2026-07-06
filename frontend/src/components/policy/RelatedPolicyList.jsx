import { Link } from 'react-router-dom';
import Badge from '../common/Badge.jsx';
import Card from '../common/Card.jsx';
import PolicyStatusBadge from './PolicyStatusBadge.jsx';

export default function RelatedPolicyList({ policies = [] }) {
  if (policies.length === 0) return null;

  return (
    <section className="policy-related-section" aria-labelledby="related-policy-title">
      <h2 id="related-policy-title">관련 정책</h2>
      <div className="policy-related-list">
        {policies.map((policy) => (
          <Link key={policy.id} to={`/policies/${policy.id}`} className="policy-related-link">
            <Card interactive className="policy-related-card">
              <div className="policy-detail-badges">
                <PolicyStatusBadge status={policy.status} />
                <Badge>{policy.category}</Badge>
              </div>
              <h3>{policy.title}</h3>
              <p>{policy.support}</p>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
