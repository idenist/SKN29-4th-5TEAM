import Button from '../common/Button.jsx';

const filters = [
  { value: 'all', label: '전체' },
  { value: 'unread', label: '안읽음' },
  { value: 'read', label: '읽음' }
];

export default function NotificationFilter({ value, onChange, totalCount, unreadCount, readCount }) {
  const countMap = {
    all: totalCount,
    unread: unreadCount,
    read: readCount
  };

  return (
    <div className="notification-filter" role="group" aria-label="알림 필터">
      {filters.map((filter) => (
        <Button
          key={filter.value}
          type="button"
          variant={value === filter.value ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => onChange(filter.value)}
        >
          {filter.label} {countMap[filter.value]}
        </Button>
      ))}
    </div>
  );
}
