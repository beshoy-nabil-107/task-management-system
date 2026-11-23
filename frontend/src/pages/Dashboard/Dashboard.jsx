import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { fetchOverview, fetchPerformance } from '../../store/slices/reportSlice';
import { fetchTasks } from '../../store/slices/taskSlice';
import { fetchExtensions } from '../../store/slices/extensionSlice';
import { Badge, Button, EmptyState, Loader } from '../../components/UI';
import { Icons } from '../../assets/icons';
import { formatDate } from '../../utils/formatters';
import './Dashboard.scss';

export function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);
  const { overview, performance, loading: reportsLoading } = useSelector((state) => state.reports);
  const { items: tasks, loading: tasksLoading } = useSelector((state) => state.tasks);
  const { items: extensions } = useSelector((state) => state.extensions);

  const role = user?.role || 'member';

  useEffect(() => {
    dispatch(fetchTasks());
    if (role === 'manager' || role === 'team_leader') {
      dispatch(fetchOverview(role === 'team_leader' ? user?.team_id : null));
    }
    if (role === 'manager') {
      dispatch(fetchPerformance());
    }
    if (role === 'team_leader' || role === 'manager') {
      dispatch(fetchExtensions());
    }
  }, [dispatch, role, user?.team_id]);

  // Chart data
  const chartData = overview
    ? [
        { name: 'Completed', value: overview.completed_tasks, color: '#059669' },
        { name: 'In Progress', value: overview.in_progress_tasks, color: '#2563EB' },
        { name: 'Pending Review', value: overview.pending_review_tasks, color: '#D97706' },
        { name: 'Pending', value: overview.pending_tasks, color: '#71717A' },
        { name: 'Delayed', value: overview.delayed_tasks, color: '#DC2626' },
      ].filter((item) => item.value > 0)
    : [];

  const pendingReviewTasks = tasks.filter((t) => t.status === 'PendingReview');
  const pendingExtensions = extensions.filter((e) => e.status === 'Pending');

  // Member tasks statistics
  const memberTasks = tasks.filter((t) => Number(t.assigned_to) === Number(user?.id));
  const memberInProgress = memberTasks.filter((t) => t.status === 'In Progress').length;
  const memberReview = memberTasks.filter((t) => t.status === 'PendingReview').length;
  const memberCompleted = memberTasks.filter((t) => t.status === 'Completed').length;

  return (
    <div className="dashboard-page">
      {/* Page Header */}
      <div className="dashboard-page__header">
        <div>
          <h1>Welcome back, {user?.name}</h1>
          <p>
            {role === 'manager'
              ? 'Organization task workflow and productivity overview'
              : role === 'team_leader'
              ? `Team Lead Dashboard — ${user?.team_name || 'Assigned Team'}`
              : 'Your workspace, active tasks, and upcoming deadlines'}
          </p>
        </div>

        <div>
          {role === 'manager' || role === 'team_leader' ? (
            <Button
              variant="primary"
              icon={<Icons.Plus size={16} />}
              onClick={() => navigate('/tasks')}
            >
              New Task
            </Button>
          ) : (
            <Button
              variant="secondary"
              icon={<Icons.Tasks size={16} />}
              onClick={() => navigate('/tasks')}
            >
              View My Tasks
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="dashboard-page__kpis">
        {role === 'manager' || role === 'team_leader' ? (
          <>
            <div className="dashboard-page__kpi-card">
              <span className="dashboard-page__kpi-card-label">Total Tasks</span>
              <span className="dashboard-page__kpi-card-value">
                {overview?.total_tasks || 0}
              </span>
              <span className="dashboard-page__kpi-card-subtext">Across team scope</span>
            </div>

            <div className="dashboard-page__kpi-card">
              <span className="dashboard-page__kpi-card-label">In Progress</span>
              <span className="dashboard-page__kpi-card-value">
                {overview?.in_progress_tasks || 0}
              </span>
              <span className="dashboard-page__kpi-card-subtext">Currently active</span>
            </div>

            <div className="dashboard-page__kpi-card">
              <span className="dashboard-page__kpi-card-label">Pending Review</span>
              <span className="dashboard-page__kpi-card-value">
                {overview?.pending_review_tasks || 0}
              </span>
              <span className="dashboard-page__kpi-card-subtext">Awaiting evaluation</span>
            </div>

            <div className="dashboard-page__kpi-card">
              <span className="dashboard-page__kpi-card-label">Completed</span>
              <span className="dashboard-page__kpi-card-value">
                {overview?.completed_tasks || 0}
              </span>
              <span className="dashboard-page__kpi-card-subtext">
                {overview?.percentages?.completed || 0}% completion rate
              </span>
            </div>

            <div className="dashboard-page__kpi-card">
              <span className="dashboard-page__kpi-card-label">Delayed</span>
              <span className="dashboard-page__kpi-card-value">
                {overview?.delayed_tasks || 0}
              </span>
              <span className="dashboard-page__kpi-card-subtext">Exceeded deadline</span>
            </div>
          </>
        ) : (
          <>
            <div className="dashboard-page__kpi-card">
              <span className="dashboard-page__kpi-card-label">My Tasks</span>
              <span className="dashboard-page__kpi-card-value">{memberTasks.length}</span>
              <span className="dashboard-page__kpi-card-subtext">Assigned to you</span>
            </div>

            <div className="dashboard-page__kpi-card">
              <span className="dashboard-page__kpi-card-label">In Progress</span>
              <span className="dashboard-page__kpi-card-value">{memberInProgress}</span>
              <span className="dashboard-page__kpi-card-subtext">Active work</span>
            </div>

            <div className="dashboard-page__kpi-card">
              <span className="dashboard-page__kpi-card-label">Under Review</span>
              <span className="dashboard-page__kpi-card-value">{memberReview}</span>
              <span className="dashboard-page__kpi-card-subtext">Pending leader approval</span>
            </div>

            <div className="dashboard-page__kpi-card">
              <span className="dashboard-page__kpi-card-label">Completed</span>
              <span className="dashboard-page__kpi-card-value">{memberCompleted}</span>
              <span className="dashboard-page__kpi-card-subtext">Delivered work</span>
            </div>
          </>
        )}
      </div>

      {/* Team Leader / Manager Pending Attention Callout */}
      {(role === 'team_leader' || role === 'manager') && pendingReviewTasks.length > 0 && (
        <div className="dashboard-page__attention-card">
          <div className="dashboard-page__attention-card-info">
            <div className="dashboard-page__attention-card-info-icon">
              <Icons.Star size={22} />
            </div>
            <div>
              <h4>{pendingReviewTasks.length} task(s) awaiting quality review</h4>
              <p>Team members have finished submissions that need rating and approval.</p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/tasks/${pendingReviewTasks[0].id}`)}
          >
            Review Now
          </Button>
        </div>
      )}

      {/* Main 2-Column Section */}
      <div className="dashboard-page__section-grid">
        {/* Left Column: Chart for Managers/Leaders, Priority Tasks for Members */}
        {role === 'manager' || role === 'team_leader' ? (
          <div className="dashboard-page__card">
            <div className="dashboard-page__card-header">
              <h3>Task Status Distribution</h3>
              <span className="text-muted font-medium">Total: {overview?.total_tasks || 0}</span>
            </div>

            {chartData.length > 0 ? (
              <div className="dashboard-page__chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                    >
                      {chartData.map((entry, index) => (
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
              <EmptyState
                icon={Icons.Chart}
                title="No task distribution data"
                subtitle="Tasks created for this team will appear in the breakdown."
              />
            )}
          </div>
        ) : (
          <div className="dashboard-page__card">
            <div className="dashboard-page__card-header">
              <h3>Upcoming Deadlines</h3>
              <Link to="/tasks" className="text-secondary font-medium">
                View all &rarr;
              </Link>
            </div>

            {memberTasks.length > 0 ? (
              <div className="dashboard-page__list">
                {memberTasks.slice(0, 5).map((task) => (
                  <Link
                    key={task.id}
                    to={`/tasks/${task.id}`}
                    className="dashboard-page__list-item"
                  >
                    <div className="dashboard-page__list-item-left">
                      <h4>{task.title}</h4>
                      <span>Due {formatDate(task.deadline)}</span>
                    </div>
                    <div className="dashboard-page__list-item-right">
                      <Badge variant={task.priority}>{task.priority}</Badge>
                      <Badge variant={task.status}>{task.status}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Icons.Tasks}
                title="No assigned tasks"
                subtitle="You currently do not have any tasks assigned."
              />
            )}
          </div>
        )}

        {/* Right Column: Recent Tasks or Management Highlights */}
        <div className="dashboard-page__card">
          <div className="dashboard-page__card-header">
            <h3>Recent Tasks</h3>
            <Link to="/tasks" className="text-secondary font-medium">
              View all &rarr;
            </Link>
          </div>

          {tasks.length > 0 ? (
            <div className="dashboard-page__list">
              {tasks.slice(0, 5).map((task) => (
                <Link
                  key={task.id}
                  to={`/tasks/${task.id}`}
                  className="dashboard-page__list-item"
                >
                  <div className="dashboard-page__list-item-left">
                    <h4>{task.title}</h4>
                    <span>
                      {task.team_name ? task.team_name : 'No team'} &bull; Due{' '}
                      {formatDate(task.deadline)}
                    </span>
                  </div>
                  <div className="dashboard-page__list-item-right">
                    <Badge variant={task.status}>{task.status}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Icons.Tasks}
              title="No tasks found"
              subtitle="Get started by creating your first task."
            />
          )}

          {/* Quick Extension badge for leaders */}
          {role === 'team_leader' && pendingExtensions.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <Link to="/extensions">
                <Button variant="secondary" size="sm" fullWidth>
                  {pendingExtensions.length} pending deadline extension(s)
                </Button>
              </Link>
            </div>
          )}

          {/* Manager Productivity link */}
          {role === 'manager' && performance?.mostProductiveTeam && (
            <div
              style={{
                marginTop: '12px',
                padding: '12px 14px',
                backgroundColor: '#FAFAFA',
                border: '1px solid #E4E4E7',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: '#71717A', fontWeight: 600 }}>
                  TOP TEAM
                </span>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#09090B' }}>
                  {performance.mostProductiveTeam.team_name} (
                  {performance.mostProductiveTeam.completion_rate}%)
                </p>
              </div>
              <Link to="/reports">
                <Button variant="ghost" size="sm">
                  View report &rarr;
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
