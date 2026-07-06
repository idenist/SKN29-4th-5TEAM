import { useMemo, useState } from 'react';
import Button from '../components/common/Button.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import Spinner from '../components/common/Spinner.jsx';
import NotificationFilter from '../components/notification/NotificationFilter.jsx';
import NotificationList from '../components/notification/NotificationList.jsx';
import { useNotifications } from '../hooks/useNotifications.js';

function filterNotifications(notifications, filter) {
  if (filter === 'unread') return notifications.filter((notification) => !notification.isRead);
  if (filter === 'read') return notifications.filter((notification) => notification.isRead);
  return notifications;
}

export default function NotificationPage() {
  const [filter, setFilter] = useState('all');
  const {
    notifications,
    unreadCount,
    readCount,
    loading,
    error,
    refetch,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();

  const filteredNotifications = useMemo(
    () => filterNotifications(notifications, filter),
    [notifications, filter]
  );

  return (
    <div className="notification-page">
      <PageHeader
        kicker="Notifications"
        title="알림"
        description="정책 마감, 정책 변경, 시스템 안내 알림을 확인합니다."
        actions={
          <Button type="button" variant="secondary" onClick={markAllAsRead} disabled={unreadCount === 0 || loading}>
            모두 읽음 처리
          </Button>
        }
      />

      <NotificationFilter
        value={filter}
        onChange={setFilter}
        totalCount={notifications.length}
        unreadCount={unreadCount}
        readCount={readCount}
      />

      {loading ? (
        <Spinner label="알림을 불러오는 중..." />
      ) : error ? (
        <ErrorState title="알림을 불러오지 못했습니다" description={error} onRetry={refetch} />
      ) : filteredNotifications.length > 0 ? (
        <NotificationList
          notifications={filteredNotifications}
          onRead={markAsRead}
          onDelete={deleteNotification}
        />
      ) : (
        <EmptyState title="표시할 알림이 없습니다" description="필터를 변경하거나 새 알림을 기다려 주세요." />
      )}
    </div>
  );
}
