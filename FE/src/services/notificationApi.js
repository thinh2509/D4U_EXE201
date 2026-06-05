import { apiClient } from './apiClient';

export const notificationApi = {
  list: () => apiClient.get('/notifications'),
  getUnreadCount: () => apiClient.get('/notifications/unread-count'),
  markRead: (notificationId) => apiClient.post(`/notifications/${notificationId}/read`),
  markAllRead: () => apiClient.post('/notifications/read-all')
};
