import apiClient from './apiClient';
import { adaptNotification, adaptNotificationList } from './adapters/notificationAdapter';

export const getNotifications = async () => {
  const payload = await apiClient.get('/notifications/');
  return adaptNotificationList(payload);
};

export const markNotificationRead = async (notificationId) => {
  const notification = await apiClient.patch(`/notifications/${notificationId}/read/`);
  return adaptNotification(notification);
};

export const deleteNotification = (notificationId) => apiClient.delete(`/notifications/${notificationId}/`);

export default {
  getNotifications,
  markNotificationRead,
  deleteNotification
};
