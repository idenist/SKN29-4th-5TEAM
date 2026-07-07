import { Link } from 'react-router-dom';
import { CalendarDays, MapPin } from 'lucide-react';
import Badge from '../common/Badge.jsx';
import Card from '../common/Card.jsx';
import Section from '../layout/Section.jsx';

function getStatusVariant(status) {
  if (status === '모집중') return 'success';
  if (status === '접수예정') return 'warning';
  return 'neutral';
}

export default function PolicyPreviewList({ policies = [] }) {
  return (
    <Section
      title="추천 정책 미리보기"
      description="받을 수 있는 주요 청년 정책을 먼저 확인해보세요."
      actions={
        <Link to="/policies" className="ui-button ui-button-secondary ui-button-sm">
          전체 정책 보기
        </Link>
      }
    >
      <div className="home-policy-grid">
        {policies.map((policy) => (
          <Card key={policy.id} interactive className="home-policy-card">
            <div className="home-policy-meta">
              <Badge variant={getStatusVariant(policy.status)}>{policy.status}</Badge>
              <Badge>{policy.category}</Badge>
            </div>
            <h3>{policy.title}</h3>
            <p>{policy.summary}</p>
            <div className="home-policy-info">
              <span>
                <MapPin size={16} aria-hidden="true" />
                {policy.region}
              </span>
              <span>
                <CalendarDays size={16} aria-hidden="true" />
                {policy.deadline}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
}
