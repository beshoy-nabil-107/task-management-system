import api from './api';

export async function getUsers() {
  const response = await api.get('/users');
  const payload = response.data?.data?.data || response.data?.data;
  return payload?.users || [];
}

export async function updateUserRole(id, { role, team_id }) {
  const response = await api.patch(`/users/${id}/role`, { role, team_id });
  const payload = response.data?.data?.data || response.data?.data;
  return payload?.user;
}

export async function deleteUser(id) {
  const response = await api.delete(`/users/${id}`);
  return response.data?.data;
}

export const userService = {
  getUsers,
  updateUserRole,
  deleteUser,
};

export default userService;
