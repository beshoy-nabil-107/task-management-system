import api from './api';

export async function getTasks(filters = {}) {
  const params = {};
  if (filters.status) params.status = filters.status;
  if (filters.priority) params.priority = filters.priority;
  if (filters.team_id) params.team_id = filters.team_id;
  if (filters.assigned_to) params.assigned_to = filters.assigned_to;
  if (filters.milestone_id) params.milestone_id = filters.milestone_id;

  const response = await api.get('/tasks', { params });
  const payload = response.data?.data?.data || response.data?.data;
  return payload?.tasks || [];
}

export async function getTaskById(id) {
  const response = await api.get(`/tasks/${id}`);
  const payload = response.data?.data?.data || response.data?.data;
  return payload; // { task, attachments, extensions }
}

export async function createTask(taskData) {
  const response = await api.post('/tasks', taskData);
  const payload = response.data?.data?.data || response.data?.data;
  return payload?.task;
}

export async function updateTask(id, taskData) {
  const response = await api.put(`/tasks/${id}`, taskData);
  const payload = response.data?.data?.data || response.data?.data;
  return payload?.task;
}

export async function deleteTask(id) {
  const response = await api.delete(`/tasks/${id}`);
  return response.data?.data;
}

export async function updateTaskStatus(id, status) {
  const response = await api.patch(`/tasks/${id}/status`, { status });
  const payload = response.data?.data?.data || response.data?.data;
  return payload?.task;
}

export async function reviewTask(id, { decision, quality_rating, review_feedback }) {
  const response = await api.post(`/tasks/${id}/review`, {
    decision,
    quality_rating,
    review_feedback,
  });
  const payload = response.data?.data?.data || response.data?.data;
  return payload?.task;
}

export async function addAttachment(taskId, formData) {
  const response = await api.post(`/tasks/${taskId}/attachments`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  const payload = response.data?.data?.data || response.data?.data;
  return payload?.attachment;
}

export async function downloadAttachment(taskId, attachmentId, fileName = 'attachment') {
  const response = await api.get(`/tasks/${taskId}/attachments/${attachmentId}/download`, {
    responseType: 'blob',
  });

  const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = blobUrl;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
}

export const taskService = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  reviewTask,
  addAttachment,
  downloadAttachment,
};

export default taskService;
