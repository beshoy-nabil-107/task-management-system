import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../store/slices/notificationSlice';
import { Icons } from '../../assets/icons';
import { Badge, Button } from '../UI';
import './AppLayout.scss';

export function AppLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { items: notifications, unreadCount } = useSelector((state) => state.notifications);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Initial fetch and 30-second live polling for notifications
  useEffect(() => {
    dispatch(fetchNotifications());

    const interval = setInterval(() => {
      dispatch(fetchNotifications());
    }, 30000);

    return () => clearInterval(interval);
  }, [dispatch]);

  // Click outside to close notification dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    }
    if (notificationOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationOpen]);

  function handleLogout() {
    dispatch(logout());
    navigate('/login');
  }

  function handleNotificationClick(n) {
    if (!n.is_read) {
      dispatch(markNotificationRead(n.id));
    }
    if (n.related_task_id) {
      navigate(`/tasks/${n.related_task_id}`);
      setNotificationOpen(false);
    }
  }

  // Format relative timestamp
  function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);
    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  }

  const role = user?.role || 'member';

  return (
    <div className="app-layout">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="app-layout__sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`app-layout__sidebar ${
          sidebarOpen ? 'app-layout__sidebar--open' : ''
        }`}
      >
        <div className="app-layout__brand">
          <div className="app-layout__brand-icon">
            <Icons.Tasks size={16} strokeWidth={2.2} />
          </div>
          <span className="app-layout__brand-title">TaskFlow</span>
        </div>

        <nav className="app-layout__nav">
          <NavLink
            to="/dashboard"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `app-layout__nav-link ${isActive ? 'app-layout__nav-link--active' : ''}`
            }
          >
            <Icons.Dashboard size={17} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/tasks"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `app-layout__nav-link ${isActive ? 'app-layout__nav-link--active' : ''}`
            }
          >
            <Icons.Tasks size={17} />
            <span>Tasks</span>
          </NavLink>

          {/* Teams Link: Manager or Team Leader */}
          {(role === 'manager' || role === 'team_leader') && (
            <NavLink
              to="/teams"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `app-layout__nav-link ${isActive ? 'app-layout__nav-link--active' : ''}`
              }
            >
              <Icons.Teams size={17} />
              <span>{role === 'team_leader' ? 'My Team' : 'Teams'}</span>
            </NavLink>
          )}

          {/* Users Link: Manager only */}
          {role === 'manager' && (
            <NavLink
              to="/users"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `app-layout__nav-link ${isActive ? 'app-layout__nav-link--active' : ''}`
              }
            >
              <Icons.Users size={17} />
              <span>Users</span>
            </NavLink>
          )}

          {/* Milestones Link: Manager or Team Leader */}
          {(role === 'manager' || role === 'team_leader') && (
            <NavLink
              to="/milestones"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `app-layout__nav-link ${isActive ? 'app-layout__nav-link--active' : ''}`
              }
            >
              <Icons.Milestones size={17} />
              <span>Milestones</span>
            </NavLink>
          )}

          <NavLink
            to="/extensions"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `app-layout__nav-link ${isActive ? 'app-layout__nav-link--active' : ''}`
            }
          >
            <Icons.Clock size={17} />
            <span>Extensions</span>
          </NavLink>

          {/* Reports Link: Manager or Team Leader */}
          {(role === 'manager' || role === 'team_leader') && (
            <NavLink
              to="/reports"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `app-layout__nav-link ${isActive ? 'app-layout__nav-link--active' : ''}`
              }
            >
              <Icons.Chart size={17} />
              <span>{role === 'manager' ? 'Performance' : 'Team Reports'}</span>
            </NavLink>
          )}

          <NavLink
            to="/profile"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `app-layout__nav-link ${isActive ? 'app-layout__nav-link--active' : ''}`
            }
          >
            <Icons.User size={17} />
            <span>Profile</span>
          </NavLink>
        </nav>

        <div className="app-layout__sidebar-footer">
          <Button
            variant="ghost"
            size="sm"
            icon={<Icons.Logout size={15} />}
            onClick={handleLogout}
            fullWidth
          >
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="app-layout__main-wrapper">
        {/* Top Navbar */}
        <header className="app-layout__navbar">
          <div className="app-layout__navbar-left">
            <button
              type="button"
              className="app-layout__navbar-toggle-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle navigation"
            >
              <Icons.Menu size={18} />
            </button>

            {/* Role Badge */}
            <Badge variant={role}>
              {role === 'manager'
                ? 'Manager'
                : role === 'team_leader'
                ? 'Team Leader'
                : 'Team Member'}
            </Badge>
          </div>

          <div className="app-layout__navbar-right">
            {/* Live Notification Bell */}
            <div className="app-layout__notification-wrapper" ref={dropdownRef}>
              <button
                type="button"
                className="app-layout__notification-btn"
                onClick={() => setNotificationOpen(!notificationOpen)}
                aria-label="Notifications"
              >
                <Icons.Bell size={17} />
                {unreadCount > 0 && (
                  <span className="app-layout__notification-btn-badge">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {notificationOpen && (
                <div className="app-layout__notification-dropdown">
                  <div className="app-layout__notification-dropdown-header">
                    <h4>Notifications</h4>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() => dispatch(markAllNotificationsRead())}
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="app-layout__notification-dropdown-list">
                    {notifications && notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`app-layout__notification-dropdown-item ${
                            !n.is_read ? 'app-layout__notification-dropdown-item--unread' : ''
                          }`}
                          onClick={() => handleNotificationClick(n)}
                        >
                          <p className="app-layout__notification-dropdown-item-msg">
                            {n.message}
                          </p>
                          <span className="app-layout__notification-dropdown-item-time">
                            {formatTime(n.created_at)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="app-layout__notification-dropdown-empty">
                        No notifications yet.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Quick Link */}
            <NavLink to="/profile" className="app-layout__user-info">
              <Icons.User size={15} />
              <span>{user?.name || 'User'}</span>
            </NavLink>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="app-layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
