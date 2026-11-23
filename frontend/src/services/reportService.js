import api from './api';

export async function getOverview(teamId = null) {
  const params = teamId ? { team_id: teamId } : {};
  const response = await api.get('/reports/overview', { params });
  const payload = response.data?.data?.data || response.data?.data;
  return payload?.overview;
}

export async function getPerformanceReport() {
  const response = await api.get('/reports/performance');
  const payload = response.data?.data?.data || response.data?.data;
  return payload; // { teams, averageProductivity, mostProductiveTeam, teamReports }
}

export async function getTeamFeedback(teamId = null) {
  const params = teamId ? { team_id: teamId } : {};
  const response = await api.get('/reports/team-feedback', { params });
  const payload = response.data?.data?.data || response.data?.data;
  return payload?.reports || [];
}

export async function submitTeamFeedback(feedback) {
  const response = await api.post('/reports/team-feedback', { feedback });
  const payload = response.data?.data?.data || response.data?.data;
  return payload?.report;
}

export const reportService = {
  getOverview,
  getPerformanceReport,
  getTeamFeedback,
  submitTeamFeedback,
};

export default reportService;
