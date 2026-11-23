import api from './api';

export async function getMilestones() {
  const response = await api.get('/milestones');
  const payload = response.data?.data?.data || response.data?.data;
  return payload?.milestones || [];
}

export async function createMilestone({ title, description, due_date }) {
  const response = await api.post('/milestones', { title, description, due_date });
  const payload = response.data?.data?.data || response.data?.data;
  return payload?.milestone;
}

export async function updateMilestone(id, { title, description, due_date }) {
  const response = await api.put(`/milestones/${id}`, { title, description, due_date });
  const payload = response.data?.data?.data || response.data?.data;
  return payload?.milestone;
}

export async function deleteMilestone(id) {
  const response = await api.delete(`/milestones/${id}`);
  return response.data?.data;
}

export const milestoneService = {
  getMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
};

export default milestoneService;
