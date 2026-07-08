import { Link, useLocation } from 'react-router-dom';
import { BookOpen, ExternalLink } from 'lucide-react';
import Badge from '../common/Badge.jsx';
import Card from '../common/Card.jsx';
import PolicyStatusBadge from './PolicyStatusBadge.jsx';

const compactText = (...values) => values.find((value) => typeof value === 'string' && value.trim())?.trim() || '';

export default function PolicyCard({ policy, index = 0 }) {
  const location = useLocation();
  const detailPath = {
    pathname: `/policies/${policy.id}`,
    search: location.search
  };
  const applyUrl = compactText(policy.applyUrl, policy.raw?.application_url);
  const sourceUrl = compactText(policy.sourceUrl, policy.sourceUrl2, policy.raw?.source_url, policy.raw?.source_url_2, applyUrl);
  const metaText = [
    policy.organization,
    policy.region,
    policy.period,
    policy.income
  ].filter((value) => value && value !== '정보 없음').join(' / ');
  const summaryText = compactText(policy.description, policy.support, metaText, '상세 내용을 확인해 주세요.');

  return (
    <Card className="policy-card policy-card-list-item">
      <div className="policy-card-rank" aria-label={`${index + 1}번째 정책`}>
        {index + 1}
      </div>

      <Link to={detailPath} className="policy-card-icon-link" aria-label={`${policy.title} 상세 보기`}>
        <div className="policy-card-icon-box">
          <BookOpen size={34} aria-hidden="true" />
        </div>
        <Badge>{policy.category}</Badge>
      </Link>

      <Link to={detailPath} className="policy-card-content-link">
        <div className="policy-card-content-top">
          <h2>{policy.title}</h2>
          <div className="policy-card-badges">
            <PolicyStatusBadge status={policy.status} />
            <Badge>{policy.category}</Badge>
          </div>
        </div>

        <p className="policy-card-summary">{summaryText}</p>

        <dl className="policy-card-compact-info">
          <div>
            <dt>신청기간</dt>
            <dd>{policy.period}</dd>
          </div>
          <div>
            <dt>대상연령</dt>
            <dd>{policy.age}</dd>
          </div>
          <div>
            <dt>지원내용</dt>
            <dd>{policy.support}</dd>
          </div>
        </dl>
      </Link>

      <div className="policy-card-actions">
        {applyUrl ? (
          <a className="policy-card-apply-button" href={applyUrl} target="_blank" rel="noreferrer">
            신청 가능
          </a>
        ) : (
          <span className="policy-card-apply-button policy-card-apply-button-disabled">
            신청 링크 없음
          </span>
        )}
        {sourceUrl ? (
          <a className="policy-card-source-button" href={sourceUrl} target="_blank" rel="noreferrer">
            출처 보기 <ExternalLink size={14} aria-hidden="true" />
          </a>
        ) : (
          <Link className="policy-card-source-button" to={detailPath}>
            상세 보기
          </Link>
        )}
      </div>
    </Card>
  );
}
