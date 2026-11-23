import api from './api';

export async function getExtensions() {
  const response = await api.get('/extensions');
  const payload = response.data?.data?.data || response.data?.data;
  return payload?.extensions || [];
}

export async function createExtension({ task_id, requested_deadline, reason }) {
  const response = await api.post('/extensions', {
    task_id,
    requested_deadline,
    reason,
  });
  const payload = response.data?.data?.data || response.data?.data;
  return payload?.extension;
}

export async function reviewExtension(id, status) {
  const response = await api.patch(`/extensions/${id}`, { status });
  const payload = response.data?.data?.data || response.data?.data;
  return payload?.extension;
}

export const extensionService = {
  getExtensions,
  createExtension,
  reviewExtension,
};

export default extensionService;
