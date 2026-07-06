import EmptyState from '../components/common/EmptyState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import Spinner from '../components/common/Spinner.jsx';
import MyPageSummary from '../components/mypage/MyPageSummary.jsx';
import MyPolicyTabs from '../components/mypage/MyPolicyTabs.jsx';
import NotificationPreviewList from '../components/mypage/NotificationPreviewList.jsx';
import ProfileCard from '../components/mypage/ProfileCard.jsx';
import { useMyPage } from '../hooks/useMyPage.js';

export default function MyPage() {
  const {
    user,
    summary,
    scrappedPolicies,
    viewedPolicies,
    searchHistory,
    notifications,
    isLoading,
    error,
    refetch
  } = useMyPage();

  return (
    <div className="mypage">
      <PageHeader
        kicker="My Page"
        title="마이페이지"
        description="스크랩 정책, 최근 본 정책, 검색 기록, 알림을 실제 마이페이지 API 기준으로 확인합니다."
      />

      {isLoading ? (
        <Spinner label="마이페이지 정보를 불러오는 중..." />
      ) : error ? (
        <ErrorState title="마이페이지 정보를 불러오지 못했습니다" description={error} onRetry={refetch} />
      ) : user && summary ? (
        <>
          <div className="mypage-overview">
            <ProfileCard user={user} />
            <MyPageSummary summary={summary} />
          </div>

          <div className="mypage-content-grid">
            <MyPolicyTabs
              scrappedPolicies={scrappedPolicies}
              viewedPolicies={viewedPolicies}
              searchHistory={searchHistory}
            />
            <NotificationPreviewList notifications={notifications} />
          </div>
        </>
      ) : (
        <EmptyState title="표시할 마이페이지 정보가 없습니다" />
      )}
    </div>
  );
}
