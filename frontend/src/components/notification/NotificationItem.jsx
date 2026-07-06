import { Link } from 'react-router-dom';
import { Bell, CalendarClock, MessageCircle, Settings } from 'lucide-react';
import Badge from '../common/Badge.jsx';
import Button from '../common/Button.jsx';
import Card from '../common/Card.jsx';

const typeMeta = {
  policy: { label: '정책', variant: 'primary', icon: Bell },
  community: { label: '커뮤니티', variant: 'success', icon: MessageCircle },
  system: { label: '시스템', variant: 'neutral', icon: Settings },
  deadline: { label: '마감', variant: 'warning', icon: CalendarClock }
};

function NotificationContent({ notification, onRead, onDelete }) {
  const meta = typeMeta[notification.type] || typeMeta.system;
  const Icon = meta.icon;

  const handleRead = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onRead?.(notification.id);
  };

  const handleDelete = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onDelete?.(notification.id);
  };

  return (
    <Card className={notification.isRead ? 'notification-item is-read' : 'notification-item is-unread'}>
      <div className="notification-icon" aria-hidden="true">
        <Icon size={20} />
      </div>
      <div className="notification-body">
        <div className="notification-meta">
          <Badge variant={meta.variant}>{meta.label}</Badge>
          {!notification.isRead ? <Badge variant="danger">new</Badge> : null}
          <time dateTime={notification.createdAt}>{notification.createdAt}</time>
        </div>
        <h2>{notification.title}</h2>
        <p>{notification.message}</p>
      </div>
      <div className="notification-actions">
        {!notification.isRead ? (
          <Button type="button" variant="secondary" size="sm" onClick={handleRead}>
            읽음
          </Button>
        ) : null}
        <Button type="button" variant="ghost" size="sm" onClick={handleDelete}>
          삭제
        </Button>
      </div>
    </Card>
  );
}

export default function NotificationItem({ notification, onRead, onDelete }) {
  if (notification.link) {
    return (
      <Link to={notification.link} className="notification-link">
        <NotificationContent notification={notification} onRead={onRead} onDelete={onDelete} />
      </Link>
    );
  }

  return <NotificationContent notification={notification} onRead={onRead} onDelete={onDelete} />;
}
