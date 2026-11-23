import api from './api';

export async function getNotifications() {
  const response = await api.get('/notifications');
  const payload = response.data?.data?.data || response.data?.data;
  return payload;
}

export async function markAsRead(id) {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data?.data;
}

export async function markAllAsRead() {
  const response = await api.patch('/notifications/read-all');
  const payload = response.data?.data?.data || response.data?.data;
  return payload;
}

export const notificationService = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};

export default notificationService;
