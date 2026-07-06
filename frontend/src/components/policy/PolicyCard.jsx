import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, UserRound, WalletCards } from 'lucide-react';
import Badge from '../common/Badge.jsx';
import Card from '../common/Card.jsx';
import PolicyStatusBadge from './PolicyStatusBadge.jsx';

export default function PolicyCard({ policy }) {
  return (
    <Link to={`/policies/${policy.id}`} className="policy-card-link">
      <Card interactive className="policy-card">
        <div className="policy-card-top">
          <div className="policy-card-badges">
            <PolicyStatusBadge status={policy.status} />
            <Badge>{policy.category}</Badge>
          </div>
          <span className="policy-card-deadline">마감 {policy.deadline}</span>
        </div>

        <div className="policy-card-main">
          <h2>{policy.title}</h2>
          <p>{policy.description}</p>
        </div>

        <dl className="policy-card-info">
          <div>
            <dt>
              <MapPin size={15} aria-hidden="true" />
              지역
            </dt>
            <dd>{policy.region}</dd>
          </div>
          <div>
            <dt>
              <UserRound size={15} aria-hidden="true" />
              연령
            </dt>
            <dd>{policy.age}</dd>
          </div>
          <div>
            <dt>
              <WalletCards size={15} aria-hidden="true" />
              소득
            </dt>
            <dd>{policy.income}</dd>
          </div>
          <div>
            <dt>
              <CalendarDays size={15} aria-hidden="true" />
              기간
            </dt>
            <dd>{policy.period}</dd>
          </div>
        </dl>

        <div className="policy-card-support">
          <strong>{policy.support}</strong>
          <div className="policy-card-tags">
            {policy.tags.map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
        </div>
      </Card>
    </Link>
  );
}
