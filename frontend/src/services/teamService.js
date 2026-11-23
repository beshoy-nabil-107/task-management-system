import api from './api';

export async function getTeams() {
  const response = await api.get('/teams');
  const payload = response.data?.data?.data || response.data?.data;
  return payload?.teams || [];
}

export async function getTeamById(id) {
  const response = await api.get(`/teams/${id}`);
  const payload = response.data?.data?.data || response.data?.data;
  return payload?.team;
}

export async function createTeam({ name, description, leader_id }) {
  const response = await api.post('/teams', { name, description, leader_id });
  const payload = response.data?.data?.data || response.data?.data;
  return payload?.team;
}

export async function updateTeam(id, { name, description, leader_id }) {
  const response = await api.put(`/teams/${id}`, { name, description, leader_id });
  const payload = response.data?.data?.data || response.data?.data;
  return payload?.team;
}

export async function addTeamMember(teamId, userId) {
  const response = await api.post(`/teams/${teamId}/members`, { user_id: userId });
  const payload = response.data?.data?.data || response.data?.data;
  return payload?.team;
}

export async function removeTeamMember(teamId, userId) {
  const response = await api.delete(`/teams/${teamId}/members/${userId}`);
  const payload = response.data?.data?.data || response.data?.data;
  return payload?.team;
}

export async function deleteTeam(id) {
  const response = await api.delete(`/teams/${id}`);
  return response.data?.data;
}

export const teamService = {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  addTeamMember,
  removeTeamMember,
  deleteTeam,
};

export default teamService;
