import { Link } from 'react-router-dom';
import Badge from '../common/Badge.jsx';
import Card from '../common/Card.jsx';
import EmptyState from '../common/EmptyState.jsx';

export default function RecommendedPolicyList({ policies = [] }) {
  return (
    <div className="chat-recommended">
      <header>
        <p className="eyebrow">Recommended</p>
        <h2>추천 정책</h2>
      </header>
      {policies.length > 0 ? (
        <div className="chat-recommended-list">
          {policies.map((policy) => {
            const itemId = policy.itemId || policy.id;

            const content = (
              <Card interactive={Boolean(itemId)} className="chat-recommended-card">
                <Badge>{policy.category}</Badge>
                <h3>{policy.title}</h3>
                <strong>{policy.support}</strong>
                <p>{policy.reason}</p>
              </Card>
            );

            return itemId ? (
              <Link key={itemId} to={`/policies/${itemId}`} className="chat-recommended-link">
                {content}
              </Link>
            ) : (
              <div key={policy.title} className="chat-recommended-link">
                {content}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState title="추천 정책 대기 중" description="질문을 보내면 관련 정책이 이곳에 표시됩니다." />
      )}
    </div>
  );
}
