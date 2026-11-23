import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchTeams,
  fetchTeamByIdThunk,
  createTeamThunk,
  updateTeamThunk,
  addTeamMemberThunk,
  removeTeamMemberThunk,
  deleteTeamThunk,
} from '../../store/slices/teamSlice';
import { fetchUsers } from '../../store/slices/userSlice';
import { Button, Badge, Modal, Loader, EmptyState } from '../../components/UI';
import { Icons } from '../../assets/icons';
import './Teams.scss';

export function Teams() {
  const dispatch = useDispatch();
  const { user: currentUser } = useSelector((state) => state.auth);
  const { items: teams, currentTeam, loading } = useSelector((state) => state.teams);
  const { items: users } = useSelector((state) => state.users);

  const role = currentUser?.role || 'member';

  // Modals
  const [formModal, setFormModal] = useState({ isOpen: false, isEdit: false, team: null });
  const [membersModal, setMembersModal] = useState({ isOpen: false, teamId: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, team: null });

  // Form Fields
  const [formData, setFormData] = useState({ name: '', description: '', leader_id: '' });
  const [selectedUserToAdd, setSelectedUserToAdd] = useState('');
  const [feedback, setFeedback] = useState({ type: null, message: '' });

  useEffect(() => {
    dispatch(fetchTeams());
    if (role === 'manager') {
      dispatch(fetchUsers());
    }
  }, [dispatch, role]);

  function handleOpenCreate() {
    setFormData({ name: '', description: '', leader_id: '' });
    setFormModal({ isOpen: true, isEdit: false, team: null });
  }

  function handleOpenEdit(team) {
    setFormData({
      name: team.name,
      description: team.description || '',
      leader_id: team.leader_id ? String(team.leader_id) : '',
    });
    setFormModal({ isOpen: true, isEdit: true, team });
  }

  async function handleOpenMembers(teamId) {
    setMembersModal({ isOpen: true, teamId });
    setSelectedUserToAdd('');
    await dispatch(fetchTeamByIdThunk(teamId));
  }

  async function handleSaveTeam(e) {
    e.preventDefault();
    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      leader_id: formData.leader_id ? Number(formData.leader_id) : null,
    };

    let result;
    if (formModal.isEdit) {
      result = await dispatch(updateTeamThunk({ id: formModal.team.id, data: payload }));
    } else {
      result = await dispatch(createTeamThunk(payload));
    }

    if (
      createTeamThunk.fulfilled.match(result) ||
      updateTeamThunk.fulfilled.match(result)
    ) {
      setFeedback({
        type: 'success',
        message: `Team ${formModal.isEdit ? 'updated' : 'created'} successfully.`,
      });
      setFormModal({ isOpen: false, isEdit: false, team: null });
      dispatch(fetchTeams());
      if (role === 'manager') dispatch(fetchUsers());
    } else {
      setFeedback({
        type: 'error',
        message: result.payload || 'Failed to save team.',
      });
    }
  }

  async function handleAddMember(e) {
    e.preventDefault();
    if (!selectedUserToAdd || !membersModal.teamId) return;

    const result = await dispatch(
      addTeamMemberThunk({
        teamId: membersModal.teamId,
        userId: Number(selectedUserToAdd),
      })
    );

    if (addTeamMemberThunk.fulfilled.match(result)) {
      setSelectedUserToAdd('');
      dispatch(fetchTeams());
      if (role === 'manager') dispatch(fetchUsers());
    } else {
      setFeedback({
        type: 'error',
        message: result.payload || 'Failed to add member to team.',
      });
    }
  }

  async function handleRemoveMember(userId) {
    if (!membersModal.teamId) return;
    const result = await dispatch(
      removeTeamMemberThunk({
        teamId: membersModal.teamId,
        userId,
      })
    );

    if (removeTeamMemberThunk.fulfilled.match(result)) {
      dispatch(fetchTeams());
      if (role === 'manager') dispatch(fetchUsers());
    } else {
      setFeedback({
        type: 'error',
        message: result.payload || 'Failed to remove member.',
      });
    }
  }

  async function handleConfirmDelete() {
    if (!deleteModal.team) return;
    const result = await dispatch(deleteTeamThunk(deleteModal.team.id));
    if (deleteTeamThunk.fulfilled.match(result)) {
      setFeedback({ type: 'success', message: 'Team deleted successfully.' });
      setDeleteModal({ isOpen: false, team: null });
      dispatch(fetchTeams());
    } else {
      setFeedback({ type: 'error', message: result.payload || 'Failed to delete team.' });
    }
  }

  // Eligible users to add (users not currently in this team)
  const availableUsersToAdd = users.filter((u) => {
    if (!currentTeam?.members) return true;
    return !currentTeam.members.some((m) => m.id === u.id);
  });

  return (
    <div className="teams-page">
      <div className="teams-page__header">
        <div>
          <h1>{role === 'manager' ? 'Teams Management' : 'My Team Workspace'}</h1>
          <p>
            {role === 'manager'
              ? 'Organize squads, appoint team leaders, and assign members'
              : 'Review your squad structure and team members'}
          </p>
        </div>

        {role === 'manager' && (
          <Button variant="primary" icon={<Icons.Plus size={16} />} onClick={handleOpenCreate}>
            Create Team
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

      {loading ? (
        <Loader size="md" text="Loading teams..." />
      ) : teams.length > 0 ? (
        <div className="teams-page__grid">
          {teams.map((team) => (
            <div key={team.id} className="teams-page__card">
              <div className="teams-page__card-header">
                <div>
                  <h3>{team.name}</h3>
                  <p>{team.description || 'No description provided.'}</p>
                </div>
              </div>

              <div className="teams-page__card-meta">
                <div className="teams-page__card-meta-item">
                  <span>Leader</span>
                  <span>{team.leader_name || 'Unassigned'}</span>
                </div>
                <div className="teams-page__card-meta-item">
                  <span>Members</span>
                  <span>{team.member_count ?? team.members?.length ?? 0}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="teams-page__card-footer">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Icons.Users size={14} />}
                  onClick={() => handleOpenMembers(team.id)}
                >
                  {role === 'manager' ? 'Manage Members' : 'View Members'}
                </Button>

                {role === 'manager' && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Icons.Edit size={14} />}
                      onClick={() => handleOpenEdit(team)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Icons.Trash size={14} />}
                      onClick={() => setDeleteModal({ isOpen: true, team })}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Icons.Teams}
          title="No teams found"
          subtitle={
            role === 'manager'
              ? 'Get started by creating your first team.'
              : 'You are not currently assigned to any team.'
          }
          action={
            role === 'manager' ? (
              <Button variant="primary" size="sm" onClick={handleOpenCreate}>
                Create Team
              </Button>
            ) : null
          }
        />
      )}

      {/* Create / Edit Team Modal (Manager Only) */}
      <Modal
        isOpen={formModal.isOpen}
        onClose={() => setFormModal({ isOpen: false, isEdit: false, team: null })}
        title={formModal.isEdit ? `Edit Team: ${formModal.team?.name}` : 'Create New Team'}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setFormModal({ isOpen: false, isEdit: false, team: null })}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveTeam}>
              {formModal.isEdit ? 'Save Changes' : 'Create Team'}
            </Button>
          </>
        }
      >
        <form className="teams-page__form" onSubmit={handleSaveTeam}>
          <div className="teams-page__form-group">
            <label htmlFor="team-name">Team Name</label>
            <input
              id="team-name"
              type="text"
              placeholder="e.g. Frontend Engineering"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="teams-page__form-group">
            <label htmlFor="team-description">Description (optional)</label>
            <textarea
              id="team-description"
              placeholder="Primary responsibilities of this team..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="teams-page__form-group">
            <label htmlFor="team-leader">Designated Team Leader (optional)</label>
            <select
              id="team-leader"
              value={formData.leader_id}
              onChange={(e) => setFormData({ ...formData, leader_id: e.target.value })}
            >
              <option value="">No leader appointed</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  #{u.id} — {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>

      {/* Manage / View Members Modal */}
      <Modal
        isOpen={membersModal.isOpen}
        onClose={() => setMembersModal({ isOpen: false, teamId: null })}
        title={`Team Members: ${currentTeam?.name || ''}`}
        size="lg"
        footer={
          <Button
            variant="secondary"
            onClick={() => setMembersModal({ isOpen: false, teamId: null })}
          >
            Close
          </Button>
        }
      >
        <div className="teams-page__members-section">
          {/* Add Member form for Manager */}
          {role === 'manager' && (
            <form className="teams-page__members-section-add" onSubmit={handleAddMember}>
              <select
                value={selectedUserToAdd}
                onChange={(e) => setSelectedUserToAdd(e.target.value)}
              >
                <option value="">Select a user to assign to this team...</option>
                {availableUsersToAdd.map((u) => (
                  <option key={u.id} value={u.id}>
                    #{u.id} — {u.name} ({u.email})
                  </option>
                ))}
              </select>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={!selectedUserToAdd}
                icon={<Icons.Plus size={15} />}
              >
                Add Member
              </Button>
            </form>
          )}

          {/* Members List Table */}
          <div className="teams-page__members-section-list">
            {currentTeam?.members && currentTeam.members.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    {role === 'manager' && <th style={{ textAlign: 'right' }}>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {currentTeam.members.map((m) => (
                    <tr key={m.id}>
                      <td className="text-muted font-medium">#{m.id}</td>
                      <td className="font-medium">{m.name}</td>
                      <td className="text-secondary">{m.email}</td>
                      <td>
                        <Badge variant={m.role}>
                          {m.role === 'team_leader' ? 'Leader' : 'Member'}
                        </Badge>
                      </td>
                      {role === 'manager' && (
                        <td style={{ textAlign: 'right' }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Icons.Trash size={13} />}
                            onClick={() => handleRemoveMember(m.id)}
                          >
                            Remove
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState
                icon={Icons.Users}
                title="No members in this team"
                subtitle="Assign users above to populate this team roster."
              />
            )}
          </div>
        </div>
      </Modal>

      {/* Delete Team Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, team: null })}
        title="Confirm Team Deletion"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeleteModal({ isOpen: false, team: null })}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              Delete Team
            </Button>
          </>
        }
      >
        <p style={{ color: '#52525B', fontSize: '13px', lineHeight: 1.5 }}>
          Are you sure you want to delete team <strong>{deleteModal.team?.name}</strong>? Any
          members assigned to this team will become unassigned.
        </p>
      </Modal>
    </div>
  );
}

export default Teams;
