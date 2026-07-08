import { Link, useLocation } from 'react-router-dom';
import { CalendarDays, MapPin, UserRound, WalletCards } from 'lucide-react';
import Badge from '../common/Badge.jsx';
import Card from '../common/Card.jsx';
import PolicyStatusBadge from './PolicyStatusBadge.jsx';

export default function PolicyCard({ policy }) {
  const location = useLocation();
  const detailPath = {
    pathname: `/policies/${policy.id}`,
    search: location.search
  };
  const infoItems = [
    {
      label: '지원 내용',
      value: policy.support,
      icon: WalletCards,
      wide: true
    },
    {
      label: '대상 연령',
      value: policy.age,
      icon: UserRound
    },
    {
      label: '지역 조건',
      value: policy.region,
      icon: MapPin
    },
    {
      label: '소득 조건',
      value: policy.income,
      icon: WalletCards
    },
    {
      label: '신청 기간',
      value: policy.period,
      icon: CalendarDays
    },
    {
      label: '마감일',
      value: policy.deadline,
      icon: CalendarDays
    }
  ];

  return (
    <Link to={detailPath} className="policy-card-link">
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
          {infoItems.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.label} className={item.wide ? 'policy-card-info-wide' : undefined}>
                <dt>
                  <Icon size={15} aria-hidden="true" />
                  {item.label}
                </dt>
                <dd>{item.value}</dd>
              </div>
            );
          })}
        </dl>

        <div className="policy-card-tags">
          {policy.tags.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>
      </Card>
    </Link>
  );
}
