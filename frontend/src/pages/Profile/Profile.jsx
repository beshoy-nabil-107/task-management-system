import React, { useRef, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile } from '../../store/slices/authSlice';
import { Badge, Button } from '../../components/UI';
import { Icons } from '../../assets/icons';
import './Profile.scss';

export function Profile() {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);

  const nameRef = useRef(null);
  const passwordRef = useRef(null);

  const [feedback, setFeedback] = useState({ type: null, message: '' });

  useEffect(() => {
    if (user && nameRef.current) {
      nameRef.current.value = user.name || '';
    }
  }, [user]);

  async function handleSubmit(event) {
    event.preventDefault();
    setFeedback({ type: null, message: '' });

    const newName = nameRef.current?.value?.trim();
    const newPassword = passwordRef.current?.value;

    const updatePayload = {};
    if (newName && newName !== user?.name) {
      updatePayload.name = newName;
    }
    if (newPassword && newPassword.trim().length >= 6) {
      updatePayload.password = newPassword;
    }

    if (Object.keys(updatePayload).length === 0) {
      setFeedback({
        type: 'error',
        message: 'No changes detected. Update your name or enter a new password (min 6 chars).',
      });
      return;
    }

    const result = await dispatch(updateProfile(updatePayload));
    if (updateProfile.fulfilled.match(result)) {
      setFeedback({
        type: 'success',
        message: 'Profile updated successfully.',
      });
      if (passwordRef.current) {
        passwordRef.current.value = '';
      }
    } else {
      setFeedback({
        type: 'error',
        message: result.payload || 'Failed to update profile.',
      });
    }
  }

  const roleLabel =
    user?.role === 'manager'
      ? 'Manager'
      : user?.role === 'team_leader'
      ? 'Team Leader'
      : 'Team Member';

  return (
    <div className="profile-page">
      <div className="profile-page__header">
        <h1>Account Profile</h1>
        <p>Manage your account settings and credentials</p>
      </div>

      <div className="profile-page__grid">
        {/* Left Card: Account Overview */}
        <div className="profile-page__card">
          <h3>Personal Details</h3>

          <div className="profile-page__info-list">
            <div className="profile-page__info-item">
              <span className="profile-page__info-item-label">Full Name</span>
              <span className="profile-page__info-item-value">{user?.name}</span>
            </div>

            <div className="profile-page__info-item">
              <span className="profile-page__info-item-label">Email Address</span>
              <span className="profile-page__info-item-value">{user?.email}</span>
            </div>

            <div className="profile-page__info-item">
              <span className="profile-page__info-item-label">System Role</span>
              <div>
                <Badge variant={user?.role}>{roleLabel}</Badge>
              </div>
            </div>

            <div className="profile-page__info-item">
              <span className="profile-page__info-item-label">Assigned Team</span>
              <span className="profile-page__info-item-value">
                {user?.team_name ? user.team_name : 'No team assigned'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Card: Edit Profile Form */}
        <div className="profile-page__card">
          <h3>Update Information</h3>

          {feedback.message && (
            <div
              className={`profile-page__alert profile-page__alert--${feedback.type}`}
              role="alert"
            >
              {feedback.type === 'success' ? (
                <Icons.Check size={16} />
              ) : (
                <Icons.Alert size={16} />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <form className="profile-page__form" onSubmit={handleSubmit}>
            <div className="profile-page__form-group">
              <label htmlFor="profile-name">Display Name</label>
              <input
                id="profile-name"
                type="text"
                ref={nameRef}
                defaultValue={user?.name || ''}
                required
              />
            </div>

            <div className="profile-page__form-group">
              <label htmlFor="profile-password">New Password</label>
              <input
                id="profile-password"
                type="password"
                ref={passwordRef}
                placeholder="Leave blank to keep current password"
                minLength={6}
              />
              <small>Leave blank if you do not wish to change your password.</small>
            </div>

            <div>
              <Button type="submit" variant="primary" loading={loading}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;
