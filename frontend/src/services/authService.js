import api from './api';

export async function login({ email, password }) {
  const response = await api.post('/auth/login', { email, password });
  const payload = response.data?.data?.data || response.data?.data;
  return payload;
}

export async function register({ name, email, password }) {
  const response = await api.post('/auth/register', { name, email, password });
  const payload = response.data?.data?.data || response.data?.data;
  return payload;
}

export async function getProfile() {
  const response = await api.get('/auth/me');
  const payload = response.data?.data?.data || response.data?.data;
  return payload;
}

export async function updateProfile(data) {
  const response = await api.put('/auth/me', data);
  const payload = response.data?.data?.data || response.data?.data;
  return payload;
}

export const authService = {
  login,
  register,
  getProfile,
  updateProfile,
};

export default authService;
