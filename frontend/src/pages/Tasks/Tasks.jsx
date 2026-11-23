import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchTasks,
  createTaskThunk,
  updateTaskThunk,
  deleteTaskThunk,
} from '../../store/slices/taskSlice';
import { fetchTeams } from '../../store/slices/teamSlice';
import { fetchUsers } from '../../store/slices/userSlice';
import { fetchMilestones } from '../../store/slices/milestoneSlice';
import { Button, Badge, Modal, Loader, EmptyState } from '../../components/UI';
import { Icons } from '../../assets/icons';
import { formatDate, toInputDate } from '../../utils/formatters';
import './Tasks.scss';

export function Tasks() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);
  const { items: tasks, loading } = useSelector((state) => state.tasks);
  const { items: teams } = useSelector((state) => state.teams);
  const { items: users } = useSelector((state) => state.users);
  const { items: milestones } = useSelector((state) => state.milestones);

  const role = user?.role || 'member';

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');

  // Modals
  const [formModal, setFormModal] = useState({ isOpen: false, isEdit: false, task: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, task: null });

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    deadline: '',
    team_id: '',
    assigned_to: '',
    milestone_id: '',
  });

  const [feedback, setFeedback] = useState({ type: null, message: '' });

  useEffect(() => {
    dispatch(fetchTasks());
    dispatch(fetchMilestones());
    if (role === 'manager') {
      dispatch(fetchTeams());
      dispatch(fetchUsers());
    } else if (role === 'team_leader') {
      dispatch(fetchUsers()); // Will return leader's team members
    }
  }, [dispatch, role]);

  function handleOpenCreate() {
    setFormData({
      title: '',
      description: '',
      priority: 'Medium',
      deadline: '',
      team_id: role === 'team_leader' ? String(user?.team_id || '') : '',
      assigned_to: '',
      milestone_id: '',
    });
    setFormModal({ isOpen: true, isEdit: false, task: null });
  }

  function handleOpenEdit(task) {
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      deadline: toInputDate(task.deadline),
      team_id: task.team_id ? String(task.team_id) : '',
      assigned_to: task.assigned_to ? String(task.assigned_to) : '',
      milestone_id: task.milestone_id ? String(task.milestone_id) : '',
    });
    setFormModal({ isOpen: true, isEdit: true, task });
  }

  async function handleSaveTask(e) {
    e.preventDefault();
    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      priority: formData.priority,
      deadline: formData.deadline,
      team_id: formData.team_id ? Number(formData.team_id) : null,
      assigned_to: formData.assigned_to ? Number(formData.assigned_to) : null,
      milestone_id: formData.milestone_id ? Number(formData.milestone_id) : null,
    };

    let result;
    if (formModal.isEdit) {
      result = await dispatch(updateTaskThunk({ id: formModal.task.id, data: payload }));
    } else {
      result = await dispatch(createTaskThunk(payload));
    }

    if (
      createTaskThunk.fulfilled.match(result) ||
      updateTaskThunk.fulfilled.match(result)
    ) {
      setFeedback({
        type: 'success',
        message: `Task ${formModal.isEdit ? 'updated' : 'created'} successfully.`,
      });
      setFormModal({ isOpen: false, isEdit: false, task: null });
      dispatch(fetchTasks());
    } else {
      setFeedback({
        type: 'error',
        message: result.payload || 'Failed to save task.',
      });
    }
  }

  async function handleConfirmDelete() {
    if (!deleteModal.task) return;
    const result = await dispatch(deleteTaskThunk(deleteModal.task.id));
    if (deleteTaskThunk.fulfilled.match(result)) {
      setFeedback({ type: 'success', message: 'Task deleted successfully.' });
      setDeleteModal({ isOpen: false, task: null });
      dispatch(fetchTasks());
    } else {
      setFeedback({ type: 'error', message: result.payload || 'Failed to delete task.' });
    }
  }

  // Filter assignee candidates
  const eligibleAssignees = users.filter((u) => {
    if (role === 'team_leader') {
      return Number(u.team_id) === Number(user?.team_id);
    }
    if (role === 'manager' && formData.team_id) {
      return Number(u.team_id) === Number(formData.team_id);
    }
    return true;
  });

  // Client filtered list
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || t.status === statusFilter;
    const matchesPriority = !priorityFilter || t.priority === priorityFilter;
    const matchesTeam = !teamFilter || Number(t.team_id) === Number(teamFilter);
    return matchesSearch && matchesStatus && matchesPriority && matchesTeam;
  });

  const pageTitle =
    role === 'manager'
      ? 'All Tasks'
      : role === 'team_leader'
      ? 'Team Tasks'
      : 'My Assigned Tasks';

  return (
    <div className="tasks-page">
      <div className="tasks-page__header">
        <div>
          <h1>{pageTitle}</h1>
          <p>Create, track, assign, and review sprint tasks</p>
        </div>

        {(role === 'manager' || role === 'team_leader') && (
          <Button variant="primary" icon={<Icons.Plus size={16} />} onClick={handleOpenCreate}>
            New Task
          </Button>
        )}
      </div>

      {feedback.message && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: feedback.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            color: feedback.type === 'success' ? '#047857' : '#B91C1C',
            border: `1px solid ${feedback.type === 'success' ? '#D1FAE5' : '#FEE2E2'}`,
          }}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback({ type: null, message: '' })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <Icons.X size={15} />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="tasks-page__toolbar">
        <div className="tasks-page__toolbar-search">
          <Icons.Search size={16} className="tasks-page__toolbar-search-icon" />
          <input
            type="text"
            placeholder="Search tasks by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="tasks-page__toolbar-filters">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="PendingReview">Pending Review</option>
            <option value="Completed">Completed</option>
            <option value="Delayed">Delayed</option>
          </select>

          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>

          {role === 'manager' && (
            <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
              <option value="">All Teams</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Tasks Table */}
      <div className="tasks-page__table-card">
        {loading ? (
          <Loader size="md" text="Loading tasks..." />
        ) : filteredTasks.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Task Title</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Team</th>
                <th>Assigned To</th>
                <th>Milestone</th>
                <th>Deadline</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((t) => (
                <tr key={t.id}>
                  <td>
                    <Link to={`/tasks/${t.id}`}>{t.title}</Link>
                  </td>
                  <td>
                    <Badge variant={t.priority}>{t.priority}</Badge>
                  </td>
                  <td>
                    <Badge variant={t.status}>{t.status}</Badge>
                  </td>
                  <td className="text-secondary">{t.team_name || '—'}</td>
                  <td>
                    {t.assigned_to ? (
                      <span className="font-medium text-secondary">
                        {t.assignee_name} (#{t.assigned_to})
                      </span>
                    ) : (
                      <span className="text-muted">Unassigned</span>
                    )}
                  </td>
                  <td className="text-secondary">{t.milestone_title || '—'}</td>
                  <td className="text-muted">{formatDate(t.deadline)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/tasks/${t.id}`)}
                      >
                        View
                      </Button>
                      {(role === 'manager' ||
                        (role === 'team_leader' &&
                          Number(t.team_id) === Number(user?.team_id))) && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Icons.Edit size={13} />}
                            onClick={() => handleOpenEdit(t)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Icons.Trash size={13} />}
                            onClick={() => setDeleteModal({ isOpen: true, task: t })}
                          />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState
            icon={Icons.Tasks}
            title="No tasks found"
            subtitle="No tasks match your selected filter criteria."
          />
        )}
      </div>

      {/* Create / Edit Task Modal */}
      <Modal
        isOpen={formModal.isOpen}
        onClose={() => setFormModal({ isOpen: false, isEdit: false, task: null })}
        title={formModal.isEdit ? `Edit Task #${formModal.task?.id}` : 'Create New Task'}
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setFormModal({ isOpen: false, isEdit: false, task: null })}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveTask}>
              {formModal.isEdit ? 'Save Changes' : 'Create Task'}
            </Button>
          </>
        }
      >
        <form className="tasks-page__form" onSubmit={handleSaveTask}>
          <div className="tasks-page__form-group">
            <label htmlFor="task-title">Title</label>
            <input
              id="task-title"
              type="text"
              placeholder="e.g. Implement user authentication endpoints"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="tasks-page__form-group">
            <label htmlFor="task-desc">Description</label>
            <textarea
              id="task-desc"
              placeholder="Detailed acceptance criteria and technical notes..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="tasks-page__form-row">
            <div className="tasks-page__form-group">
              <label htmlFor="task-priority">Priority</label>
              <select
                id="task-priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div className="tasks-page__form-group">
              <label htmlFor="task-deadline">Deadline</label>
              <input
                id="task-deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="tasks-page__form-row">
            {role === 'manager' && (
              <div className="tasks-page__form-group">
                <label htmlFor="task-team">Assign Team</label>
                <select
                  id="task-team"
                  value={formData.team_id}
                  onChange={(e) =>
                    setFormData({ ...formData, team_id: e.target.value, assigned_to: '' })
                  }
                >
                  <option value="">No team assigned</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="tasks-page__form-group">
              <label htmlFor="task-assignee">Assigned Member (ID & Name)</label>
              <select
                id="task-assignee"
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              >
                <option value="">Unassigned</option>
                {eligibleAssignees.map((u) => (
                  <option key={u.id} value={u.id}>
                    #{u.id} — {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="tasks-page__form-group">
            <label htmlFor="task-milestone">Milestone Target (optional)</label>
            <select
              id="task-milestone"
              value={formData.milestone_id}
              onChange={(e) => setFormData({ ...formData, milestone_id: e.target.value })}
            >
              <option value="">No milestone linked</option>
              {milestones.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>

      {/* Delete Task Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, task: null })}
        title="Confirm Task Deletion"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeleteModal({ isOpen: false, task: null })}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              Delete Task
            </Button>
          </>
        }
      >
        <p style={{ color: '#52525B', fontSize: '13px', lineHeight: 1.5 }}>
          Are you sure you want to delete task <strong>{deleteModal.task?.title}</strong>? All
          attachments and extension requests will also be removed.
        </p>
      </Modal>
    </div>
  );
}

export default Tasks;
