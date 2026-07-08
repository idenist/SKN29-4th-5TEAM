import { formatDate } from '../../utils/dateFormat.js';

const asArray = (value) => (Array.isArray(value) ? value : []);

const typeMap = {
  deadline_soon: 'deadline',
  policy_updated: 'policy',
  policy_closed: 'deadline',
  system: 'system'
};

export const adaptNotification = (notification = {}) => ({
  id: notification.id,
  type: typeMap[notification.notification_type] || notification.type || 'system',
  notificationType: notification.notification_type || notification.type || 'system',
  title: notification.title || '알림',
  message: notification.message || '',
  isRead: Boolean(notification.is_read ?? notification.isRead),
  createdAt: formatDate(notification.created_at || notification.createdAt, ''),
  policyId: notification.policy || null,
  policyTitle: notification.policy_title || '',
  link: notification.policy ? `/policies/${notification.policy}` : '',
  raw: notification
});

export const adaptNotificationList = (payload = {}) => {
  const notifications = asArray(payload.notifications || payload).map(adaptNotification);

  return {
    notifications,
    unreadCount: payload.unread_count ?? notifications.filter((item) => !item.isRead).length,
    raw: payload
  };
};
