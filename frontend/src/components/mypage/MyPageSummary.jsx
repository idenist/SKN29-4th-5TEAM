import Card from '../common/Card.jsx';

const summaryItems = [
  { key: 'scrapsCount', label: '스크랩' },
  { key: 'viewedCount', label: '최근 본 정책' },
  { key: 'searchCount', label: '검색 기록' },
  { key: 'unreadNotifications', label: '읽지 않은 알림' }
];

export default function MyPageSummary({ summary }) {
  return (
    <div className="mypage-summary-grid">
      {summaryItems.map((item) => (
        <Card key={item.key} className="mypage-summary-card">
          <span>{item.label}</span>
          <strong>{summary[item.key]}</strong>
        </Card>
      ))}
    </div>
  );
}
