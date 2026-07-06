import { Link } from 'react-router-dom';
import Badge from '../common/Badge.jsx';
import Card from '../common/Card.jsx';
import EmptyState from '../common/EmptyState.jsx';

export default function ScrappedPolicies({ policies = [] }) {
  if (policies.length === 0) {
    return <EmptyState title="스크랩한 정책이 없습니다" description="관심 정책을 스크랩하면 이곳에서 볼 수 있습니다." />;
  }

  return (
    <div className="mypage-list">
      {policies.map((policy) => (
        <Link key={policy.itemId || policy.id} to={`/policies/${policy.itemId || policy.id}`} className="mypage-list-link">
          <Card interactive className="mypage-policy-item">
            <div>
              <Badge>{policy.category}</Badge>
              <h3>{policy.title}</h3>
              <p>마감 {policy.deadline}</p>
            </div>
            <strong>{policy.status}</strong>
          </Card>
        </Link>
      ))}
    </div>
  );
}
