import { Link } from 'react-router-dom';
import Badge from '../common/Badge.jsx';
import Card from '../common/Card.jsx';
import EmptyState from '../common/EmptyState.jsx';

export default function ViewedPolicies({ policies = [] }) {
  if (policies.length === 0) {
    return <EmptyState title="최근 본 정책이 없습니다" description="정책 상세를 확인하면 기록이 표시됩니다." />;
  }

  return (
    <div className="mypage-list">
      {policies.map((policy) => (
        <Link key={policy.itemId || policy.id} to={`/policies/${policy.itemId || policy.id}`} className="mypage-list-link">
          <Card interactive className="mypage-policy-item">
            <div>
              <Badge>{policy.category}</Badge>
              <h3>{policy.title}</h3>
              <p>{policy.viewedAt}</p>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
