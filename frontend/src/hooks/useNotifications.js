import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  deleteNotification as deleteNotificationRequest,
  getNotifications,
  markNotificationRead
} from '../services/notificationApi.js';
import { useAuth } from './useAuth.js';

const LOGIN_REQUIRED_MESSAGE = '로그인이 필요한 기능입니다.';
const NOTIFICATIONS_CHANGED_EVENT = 'notifications:changed';

const emitNotificationsChanged = (unreadCount) => {
  window.dispatchEvent(
    new CustomEvent(NOTIFICATIONS_CHANGED_EVENT, {
      detail: { unreadCount }
    })
  );
};

const getErrorMessage = (error, fallback) => {
  const apiMessage = error?.responseData?.message;
  const apiReason = error?.responseData?.error?.reason || error?.responseData?.error;

  return apiReason || apiMessage || error?.message || fallback;
};

export function useNotifications() {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const recomputeUnreadCount = useCallback((items) => {
    const nextUnreadCount = items.filter((notification) => !notification.isRead).length;
    setUnreadCount(nextUnreadCount);
    emitNotificationsChanged(nextUnreadCount);
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      emitNotificationsChanged(0);
      setLoading(false);
      setError(LOGIN_REQUIRED_MESSAGE);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = await getNotifications();
      setNotifications(payload.notifications);
      setUnreadCount(payload.unreadCount);
      emitNotificationsChanged(payload.unreadCount);
    } catch (requestError) {
      setNotifications([]);
      setUnreadCount(0);
      emitNotificationsChanged(0);
      setError(getErrorMessage(requestError, '알림 목록을 불러오지 못했습니다.'));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback(
    async (notificationId) => {
      if (!isAuthenticated) {
        setError(LOGIN_REQUIRED_MESSAGE);
        return;
      }

      const previousNotifications = notifications;
      const nextNotifications = notifications.map((notification) =>
        notification.id === notificationId ? { ...notification, isRead: true } : notification
      );

      setNotifications(nextNotifications);
      recomputeUnreadCount(nextNotifications);
      setError('');

      try {
        await markNotificationRead(notificationId);
      } catch (requestError) {
        setNotifications(previousNotifications);
        recomputeUnreadCount(previousNotifications);
        setError(getErrorMessage(requestError, '알림 읽음 처리에 실패했습니다.'));
      }
    },
    [isAuthenticated, notifications, recomputeUnreadCount]
  );

  const deleteNotification = useCallback(
    async (notificationId) => {
      if (!isAuthenticated) {
        setError(LOGIN_REQUIRED_MESSAGE);
        return;
      }

      const previousNotifications = notifications;
      const nextNotifications = notifications.filter((notification) => notification.id !== notificationId);

      setNotifications(nextNotifications);
      recomputeUnreadCount(nextNotifications);
      setError('');

      try {
        await deleteNotificationRequest(notificationId);
      } catch (requestError) {
        setNotifications(previousNotifications);
        recomputeUnreadCount(previousNotifications);
        setError(getErrorMessage(requestError, '알림 삭제에 실패했습니다.'));
      }
    },
    [isAuthenticated, notifications, recomputeUnreadCount]
  );

  const markAllAsRead = useCallback(async () => {
    const unreadNotifications = notifications.filter((notification) => !notification.isRead);

    for (const notification of unreadNotifications) {
      await markAsRead(notification.id);
    }
  }, [markAsRead, notifications]);

  const readCount = useMemo(() => notifications.length - unreadCount, [notifications.length, unreadCount]);

  return {
    notifications,
    unreadCount,
    readCount,
    loading,
    error,
    fetchNotifications,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };
}
