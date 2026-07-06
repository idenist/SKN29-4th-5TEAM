import EmptyState from '../common/EmptyState.jsx';
import Card from '../common/Card.jsx';

export default function SearchHistoryList({ items = [] }) {
  if (items.length === 0) {
    return <EmptyState title="검색 기록이 없습니다" description="정책 검색을 이용하면 최근 검색어가 표시됩니다." />;
  }

  return (
    <div className="mypage-list">
      {items.map((item) => (
        <Card key={item.id} className="mypage-history-item">
          <strong>{item.keyword}</strong>
          <span>{item.searchedAt}</span>
        </Card>
      ))}
    </div>
  );
}
