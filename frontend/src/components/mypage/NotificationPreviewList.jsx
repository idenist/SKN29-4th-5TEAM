import Badge from '../common/Badge.jsx';
import Card from '../common/Card.jsx';
import EmptyState from '../common/EmptyState.jsx';

export default function NotificationPreviewList({ notifications = [] }) {
  return (
    <Card className="mypage-notifications">
      <header className="mypage-panel-header">
        <div>
          <p className="eyebrow">Notifications</p>
          <h2>알림 미리보기</h2>
        </div>
      </header>

      {notifications.length === 0 ? (
        <EmptyState title="알림이 없습니다" />
      ) : (
        <div className="mypage-notification-list">
          {notifications.slice(0, 3).map((notification) => (
            <div key={notification.id} className="mypage-notification-link">
              <div className="mypage-notification-item">
                <div>
                  <h3>{notification.title}</h3>
                  <p>{notification.content || notification.message}</p>
                  <span>{notification.createdAt}</span>
                </div>
                {!notification.isRead ? <Badge variant="danger">new</Badge> : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
