import NotificationItem from './NotificationItem.jsx';

export default function NotificationList({ notifications = [], onRead, onDelete }) {
  return (
    <div className="notification-list">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRead={onRead}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
