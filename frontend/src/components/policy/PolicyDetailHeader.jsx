import Badge from '../common/Badge.jsx';
import PolicyStatusBadge from './PolicyStatusBadge.jsx';
import ScrapButton from './ScrapButton.jsx';

export default function PolicyDetailHeader({
  policy,
  isScrapped = false,
  isScrapLoading = false,
  scrapMessage = '',
  onToggleScrap
}) {
  return (
    <section className="policy-detail-header">
      <div className="policy-detail-title-area">
        <div className="policy-detail-badges">
          <PolicyStatusBadge status={policy.status} />
          <Badge>{policy.category}</Badge>
          <Badge variant="primary">{policy.region}</Badge>
        </div>
        <h1>{policy.title}</h1>
        <p>{policy.description}</p>
      </div>
      <div className="policy-detail-actions">
        <span>마감 {policy.deadline}</span>
        <ScrapButton isScrapped={isScrapped} isLoading={isScrapLoading} onToggle={onToggleScrap} />
        {scrapMessage ? (
          <p className="policy-scrap-message" role="status">
            {scrapMessage}
          </p>
        ) : null}
      </div>
    </section>
  );
}
