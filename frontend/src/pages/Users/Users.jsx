import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, updateUserRoleThunk, deleteUserThunk } from '../../store/slices/userSlice';
import { fetchTeams } from '../../store/slices/teamSlice';
import { Button, Badge, Modal, Loader, EmptyState } from '../../components/UI';
import { Icons } from '../../assets/icons';
import { formatDate } from '../../utils/formatters';
import './Users.scss';

export function Users() {
  const dispatch = useDispatch();
  const { user: currentUser } = useSelector((state) => state.auth);
  const { items: users, loading } = useSelector((state) => state.users);
  const { items: teams } = useSelector((state) => state.teams);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modals state
  const [editModal, setEditModal] = useState({ isOpen: false, user: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, user: null });
  const [selectedRole, setSelectedRole] = useState('member');
  const [selectedTeamId, setSelectedTeamId] = useState('');

  const [feedback, setFeedback] = useState({ type: null, message: '' });

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchTeams());
  }, [dispatch]);

  function handleOpenEdit(user) {
    setSelectedRole(user.role);
    setSelectedTeamId(user.team_id ? String(user.team_id) : '');
    setEditModal({ isOpen: true, user });
  }

  async function handleSaveRole(e) {
    e.preventDefault();
    if (!editModal.user) return;

    const team_id = selectedTeamId ? Number(selectedTeamId) : null;
    const result = await dispatch(
      updateUserRoleThunk({
        id: editModal.user.id,
        role: selectedRole,
        team_id,
      })
    );

    if (updateUserRoleThunk.fulfilled.match(result)) {
      setFeedback({ type: 'success', message: 'User role updated successfully.' });
      setEditModal({ isOpen: false, user: null });
    } else {
      setFeedback({ type: 'error', message: result.payload || 'Failed to update user.' });
    }
  }

  async function handleConfirmDelete() {
    if (!deleteModal.user) return;
    const result = await dispatch(deleteUserThunk(deleteModal.user.id));
    if (deleteUserThunk.fulfilled.match(result)) {
      setFeedback({ type: 'success', message: 'User deleted successfully.' });
      setDeleteModal({ isOpen: false, user: null });
    } else {
      setFeedback({ type: 'error', message: result.payload || 'Failed to delete user.' });
    }
  }

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="users-page">
      <div className="users-page__header">
        <div>
          <h1>Users & Permissions</h1>
          <p>Manage enterprise users, team assignments, and system roles</p>
        </div>
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
      <div className="users-page__toolbar">
        <div className="users-page__toolbar-search">
          <Icons.Search size={16} className="users-page__toolbar-search-icon" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="users-page__toolbar-filter">
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="ALL">All Roles</option>
            <option value="manager">Managers</option>
            <option value="team_leader">Team Leaders</option>
            <option value="member">Team Members</option>
          </select>
        </div>
      </div>

      {/* Table Card */}
      <div className="users-page__table-card">
        {loading ? (
          <Loader size="md" text="Loading users..." />
        ) : filteredUsers.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Assigned Team</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const isSelf = Number(u.id) === Number(currentUser?.id);
                return (
                  <tr key={u.id}>
                    <td className="font-medium text-muted">#{u.id}</td>
                    <td className="font-medium">{u.name}</td>
                    <td className="text-secondary">{u.email}</td>
                    <td>
                      <Badge variant={u.role}>
                        {u.role === 'manager'
                          ? 'Manager'
                          : u.role === 'team_leader'
                          ? 'Team Leader'
                          : 'Member'}
                      </Badge>
                    </td>
                    <td className="text-secondary">
                      {u.team_name ? u.team_name : <span className="text-muted">Unassigned</span>}
                    </td>
                    <td className="text-muted">{formatDate(u.created_at)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="users-page__actions" style={{ justifyContent: 'flex-end' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Icons.Edit size={14} />}
                          disabled={isSelf}
                          onClick={() => handleOpenEdit(u)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Icons.Trash size={14} />}
                          disabled={isSelf}
                          onClick={() => setDeleteModal({ isOpen: true, user: u })}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <EmptyState
            icon={Icons.Users}
            title="No users found"
            subtitle="No users match your search criteria."
          />
        )}
      </div>

      {/* Edit Role / Team Modal */}
      <Modal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, user: null })}
        title={`Edit User: ${editModal.user?.name}`}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setEditModal({ isOpen: false, user: null })}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveRole}>
              Save Changes
            </Button>
          </>
        }
      >
        <form className="users-page__form" onSubmit={handleSaveRole}>
          <div className="users-page__form-group">
            <label htmlFor="user-role">Account Role</label>
            <select
              id="user-role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              required
            >
              <option value="member">Team Member</option>
              <option value="team_leader">Team Leader</option>
              <option value="manager">Manager</option>
            </select>
          </div>

          <div className="users-page__form-group">
            <label htmlFor="user-team">Assign to Team</label>
            <select
              id="user-team"
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
            >
              <option value="">No team (Unassigned)</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>

      {/* Delete User Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, user: null })}
        title="Confirm User Deletion"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeleteModal({ isOpen: false, user: null })}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              Delete User
            </Button>
          </>
        }
      >
        <p style={{ color: '#52525B', fontSize: '13px', lineHeight: 1.5 }}>
          Are you sure you want to permanently delete user{' '}
          <strong>{deleteModal.user?.name}</strong> (#{deleteModal.user?.id})? This action cannot
          be undone.
        </p>
      </Modal>
    </div>
  );
}

export default Users;
