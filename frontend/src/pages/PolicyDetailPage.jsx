import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ErrorState from '../components/common/ErrorState.jsx';
import Spinner from '../components/common/Spinner.jsx';
import PolicyApplySection from '../components/policy/PolicyApplySection.jsx';
import PolicyDetailHeader from '../components/policy/PolicyDetailHeader.jsx';
import PolicyInfoSection from '../components/policy/PolicyInfoSection.jsx';
import PolicyRequirementSection from '../components/policy/PolicyRequirementSection.jsx';
import RelatedPolicyList from '../components/policy/RelatedPolicyList.jsx';
import { usePolicyDetail } from '../hooks/usePolicies.js';

export default function PolicyDetailPage() {
  const { itemId } = useParams();
  const location = useLocation();
  const listPath = {
    pathname: '/policies',
    search: location.search
  };
  const {
    policy,
    isLoading,
    error,
    refetch,
    isScrapped,
    isScrapLoading,
    scrapMessage,
    toggleScrap
  } = usePolicyDetail(itemId);

  if (isLoading) {
    return (
      <div className="policy-detail-page">
        <Link to={listPath} className="ui-button ui-button-ghost ui-button-sm policy-back-link">
          <ArrowLeft size={16} aria-hidden="true" />
          정책 목록으로
        </Link>
        <Spinner label="정책 상세를 불러오는 중..." />
      </div>
    );
  }

  if (error || !policy) {
    return (
      <div className="policy-detail-page">
        <Link to={listPath} className="ui-button ui-button-ghost ui-button-sm policy-back-link">
          <ArrowLeft size={16} aria-hidden="true" />
          정책 목록으로
        </Link>
        <ErrorState
          title="정책을 찾을 수 없습니다"
          description={error || '요청한 정책이 없거나 상세 정보를 불러오지 못했습니다.'}
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="policy-detail-page">
      <Link to={listPath} className="ui-button ui-button-ghost ui-button-sm policy-back-link">
        <ArrowLeft size={16} aria-hidden="true" />
        정책 목록으로
      </Link>

      <PolicyDetailHeader
        policy={policy}
        isScrapped={isScrapped}
        isScrapLoading={isScrapLoading}
        scrapMessage={scrapMessage}
        onToggleScrap={toggleScrap}
      />

      <div className="policy-detail-layout">
        <main className="policy-detail-main">
          <PolicyInfoSection policy={policy} />
          <PolicyRequirementSection policy={policy} />
          <PolicyApplySection policy={policy} />
          <RelatedPolicyList policies={policy.relatedPolicies} />
        </main>
      </div>
    </div>
  );
}
