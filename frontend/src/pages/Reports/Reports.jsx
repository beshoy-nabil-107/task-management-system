import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  fetchOverview,
  fetchPerformance,
  fetchTeamFeedback,
  submitTeamFeedbackThunk,
} from '../../store/slices/reportSlice';
import { Button, Badge, Loader, EmptyState } from '../../components/UI';
import { Icons } from '../../assets/icons';
import { formatDate } from '../../utils/formatters';
import './Reports.scss';

export function Reports() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { overview, performance, teamFeedback, loading } = useSelector((state) => state.reports);

  const role = user?.role || 'member';

  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackAlert, setFeedbackAlert] = useState({ type: null, message: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (role === 'manager') {
      dispatch(fetchPerformance());
      dispatch(fetchTeamFeedback());
    } else if (role === 'team_leader') {
      dispatch(fetchOverview(user?.team_id));
      dispatch(fetchTeamFeedback(user?.team_id));
    }
  }, [dispatch, role, user?.team_id]);

  async function handleSubmitFeedback(e) {
    e.preventDefault();
    if (!feedbackText.trim() || feedbackText.trim().length < 5) {
      setFeedbackAlert({
        type: 'error',
        message: 'Feedback report must be at least 5 characters.',
      });
      return;
    }

    setSubmitting(true);
    setFeedbackAlert({ type: null, message: '' });

    const result = await dispatch(submitTeamFeedbackThunk(feedbackText.trim()));
    setSubmitting(false);

    if (submitTeamFeedbackThunk.fulfilled.match(result)) {
      setFeedbackAlert({
        type: 'success',
        message: 'Team performance feedback submitted to management successfully.',
      });
      setFeedbackText('');
      dispatch(fetchTeamFeedback(user?.team_id));
    } else {
      setFeedbackAlert({
        type: 'error',
        message: result.payload || 'Failed to submit report.',
      });
    }
  }

  // Bar chart data for manager
  const barChartData = performance?.teams?.map((t) => ({
    name: t.team_name,
    Completed: t.completed_tasks,
    'In Progress': t.in_progress_tasks,
    Delayed: t.delayed_tasks,
  })) || [];

  // Pie chart data for team leader
  const pieChartData = overview
    ? [
        { name: 'Completed', value: overview.completed_tasks, color: '#059669' },
        { name: 'In Progress', value: overview.in_progress_tasks, color: '#2563EB' },
        { name: 'Pending Review', value: overview.pending_review_tasks, color: '#D97706' },
        { name: 'Pending', value: overview.pending_tasks, color: '#71717A' },
        { name: 'Delayed', value: overview.delayed_tasks, color: '#DC2626' },
      ].filter((item) => item.value > 0)
    : [];

  return (
    <div className="reports-page">
      <div className="reports-page__header">
        <div>
          <h1>
            {role === 'manager'
              ? 'Performance Analytics & Team Reports'
              : 'Team Performance & Feedback'}
          </h1>
          <p>
            {role === 'manager'
              ? 'Cross-team completion metrics, efficiency rankings, and qualitative feedback'
              : 'Review your squad status distribution and submit periodic reports to management'}
          </p>
        </div>
      </div>

      {feedbackAlert.message && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: feedbackAlert.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            color: feedbackAlert.type === 'success' ? '#047857' : '#B91C1C',
            border: `1px solid ${feedbackAlert.type === 'success' ? '#D1FAE5' : '#FEE2E2'}`,
          }}
        >
          <span>{feedbackAlert.message}</span>
          <button
            onClick={() => setFeedbackAlert({ type: null, message: '' })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <Icons.X size={15} />
          </button>
        </div>
      )}

      {loading && !performance && !overview ? (
        <Loader size="md" text="Loading report telemetry..." />
      ) : role === 'manager' ? (
        /* ================= MANAGER VIEW ================= */
        <>
          {/* Top Summary Row */}
          <div className="reports-page__summary-grid">
            {/* KPI Card */}
            <div className="reports-page__kpi-card">
              <span className="reports-page__kpi-card-label">Average Productivity</span>
              <span className="reports-page__kpi-card-value">
                {performance?.averageProductivity || 0}%
              </span>
              <span className="reports-page__kpi-card-subtext">
                Average completion rate across teams
              </span>
            </div>

            {/* Most Productive Team Highlight Card */}
            {performance?.mostProductiveTeam ? (
              <div className="reports-page__top-team-card">
                <div className="reports-page__top-team-card-info">
                  <div className="reports-page__top-team-card-info-tag">
                    <Icons.Star size={14} />
                    <span>Most Productive Squad</span>
                  </div>
                  <h3>{performance.mostProductiveTeam.team_name}</h3>
                  <p>Lead by {performance.mostProductiveTeam.leader_name}</p>
                </div>

                <div className="reports-page__top-team-card-metrics">
                  <div className="reports-page__top-team-card-metrics-item">
                    <span>Completion</span>
                    <span>{performance.mostProductiveTeam.completion_rate}%</span>
                  </div>
                  <div className="reports-page__top-team-card-metrics-item">
                    <span>Quality</span>
                    <span>
                      {performance.mostProductiveTeam.avg_quality_rating
                        ? `${performance.mostProductiveTeam.avg_quality_rating} ★`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="reports-page__top-team-card-metrics-item">
                    <span>Completed</span>
                    <span>{performance.mostProductiveTeam.completed_tasks}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="reports-page__kpi-card">
                <span className="reports-page__kpi-card-label">Top Squad</span>
                <span className="reports-page__kpi-card-value" style={{ fontSize: '20px' }}>
                  Awaiting Data
                </span>
                <span className="reports-page__kpi-card-subtext">
                  Complete tasks to establish team rankings
                </span>
              </div>
            )}
          </div>

          {/* Team Completion Comparison Chart */}
          <div className="reports-page__card">
            <div className="reports-page__card-header">
              <div>
                <h3>Team Task Distribution Comparison</h3>
                <p>Side-by-side volume of completed, in-progress, and delayed tasks</p>
              </div>
            </div>

            {barChartData.length > 0 ? (
              <div className="reports-page__chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
                    <XAxis
                      dataKey="name"
                      stroke="#71717A"
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: '#E4E4E7' }}
                    />
                    <YAxis
                      stroke="#71717A"
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: '#E4E4E7' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E4E4E7',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      formatter={(value) => (
                        <span style={{ color: '#52525B', fontSize: '12px', fontWeight: 500 }}>
                          {value}
                        </span>
                      )}
                    />
                    <Bar dataKey="Completed" fill="#059669" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="In Progress" fill="#2563EB" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Delayed" fill="#DC2626" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState
                icon={Icons.Chart}
                title="No comparative data yet"
                subtitle="Tasks across teams will populate the comparison chart."
              />
            )}
          </div>

          {/* Detailed Teams Breakdown Table */}
          <div className="reports-page__card">
            <div className="reports-page__card-header">
              <h3>Team Performance Scorecard</h3>
            </div>

            {performance?.teams && performance.teams.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Team Name</th>
                    <th>Leader</th>
                    <th>Total</th>
                    <th>Done</th>
                    <th>In Progress</th>
                    <th>Under Review</th>
                    <th>Delayed</th>
                    <th>Completion Rate</th>
                    <th>Avg Quality</th>
                  </tr>
                </thead>
                <tbody>
                  {performance.teams.map((t) => (
                    <tr key={t.team_id}>
                      <td className="font-semibold">{t.team_name}</td>
                      <td className="text-secondary">{t.leader_name}</td>
                      <td>{t.total_tasks}</td>
                      <td style={{ color: '#047857', fontWeight: 600 }}>{t.completed_tasks}</td>
                      <td style={{ color: '#1D4ED8' }}>{t.in_progress_tasks}</td>
                      <td style={{ color: '#B45309' }}>{t.pending_review_tasks}</td>
                      <td style={{ color: '#B91C1C' }}>{t.delayed_tasks}</td>
                      <td>
                        <div className="reports-page__progress-cell">
                          <div className="reports-page__progress-cell-bar">
                            <div
                              className="reports-page__progress-cell-bar-fill"
                              style={{ width: `${t.completion_rate}%` }}
                            />
                          </div>
                          <span>{t.completion_rate}%</span>
                        </div>
                      </td>
                      <td className="font-semibold">
                        {t.avg_quality_rating ? `${t.avg_quality_rating} ★` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState icon={Icons.Teams} title="No teams data available" />
            )}
          </div>

          {/* Team Leaders Qualitative Feedback Section */}
          <div className="reports-page__card">
            <div className="reports-page__card-header">
              <div>
                <h3>Team Leaders' Qualitative Reports</h3>
                <p>Weekly/Monthly updates submitted directly by squad leaders</p>
              </div>
            </div>

            {teamFeedback.length > 0 ? (
              <div className="reports-page__feedback-list">
                {teamFeedback.map((report) => (
                  <div key={report.id} className="reports-page__feedback-item">
                    <div className="reports-page__feedback-item-header">
                      <h4>
                        {report.team_name} &bull; Lead: {report.leader_name || 'Leader'}
                      </h4>
                      <span>{formatDate(report.created_at)}</span>
                    </div>
                    <p className="reports-page__feedback-item-text">{report.feedback}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Icons.FileText}
                title="No leader reports submitted yet"
                subtitle="Team leaders can submit qualitative sprint reviews."
              />
            )}
          </div>
        </>
      ) : (
        /* ================= TEAM LEADER VIEW ================= */
        <>
          {/* Status Breakdown KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            <div className="reports-page__kpi-card">
              <span className="reports-page__kpi-card-label">Total Tasks</span>
              <span className="reports-page__kpi-card-value">{overview?.total_tasks || 0}</span>
            </div>
            <div className="reports-page__kpi-card">
              <span className="reports-page__kpi-card-label">Completed</span>
              <span className="reports-page__kpi-card-value">{overview?.completed_tasks || 0}</span>
            </div>
            <div className="reports-page__kpi-card">
              <span className="reports-page__kpi-card-label">Completion Rate</span>
              <span className="reports-page__kpi-card-value">
                {overview?.percentages?.completed || 0}%
              </span>
            </div>
            <div className="reports-page__kpi-card">
              <span className="reports-page__kpi-card-label">Delayed</span>
              <span className="reports-page__kpi-card-value">{overview?.delayed_tasks || 0}</span>
            </div>
          </div>

          {/* Pie Chart Card */}
          <div className="reports-page__card">
            <div className="reports-page__card-header">
              <h3>Squad Task Distribution</h3>
            </div>
            {pieChartData.length > 0 ? (
              <div className="reports-page__chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E4E4E7',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => (
                        <span style={{ color: '#52525B', fontSize: '12px', fontWeight: 500 }}>
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState icon={Icons.Chart} title="No tasks logged for your team" />
            )}
          </div>

          {/* Submit Report Form */}
          <div className="reports-page__submit-card">
            <div className="reports-page__card-header">
              <div>
                <h3>Submit Squad Performance Review</h3>
                <p>Provide management with a summary of team health, blockers, and achievements</p>
              </div>
            </div>

            <form onSubmit={handleSubmitFeedback}>
              <textarea
                placeholder="Detail current sprint progress, team velocity, obstacles encountered, and high-impact deliverables..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={4}
                required
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="primary"
                  loading={submitting}
                  icon={<Icons.Upload size={14} />}
                >
                  Send Report to Manager
                </Button>
              </div>
            </form>
          </div>

          {/* Previous Submissions by Leader */}
          <div className="reports-page__card">
            <div className="reports-page__card-header">
              <h3>Previous Submitted Reports</h3>
            </div>

            {teamFeedback.length > 0 ? (
              <div className="reports-page__feedback-list">
                {teamFeedback.map((report) => (
                  <div key={report.id} className="reports-page__feedback-item">
                    <div className="reports-page__feedback-item-header">
                      <h4>Submitted Report</h4>
                      <span>{formatDate(report.created_at)}</span>
                    </div>
                    <p className="reports-page__feedback-item-text">{report.feedback}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Icons.FileText}
                title="No reports submitted yet"
                subtitle="Your submitted squad reviews will appear here."
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Reports;
