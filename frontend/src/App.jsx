import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentUser } from './store/slices/authSlice';
import { ProtectedRoute } from './components/ProtectedRoute/ProtectedRoute';
import { AppLayout } from './components/Layout/AppLayout';

// Auth Pages
import { Login } from './pages/Login/Login';
import { Register } from './pages/Register/Register';
import { Profile } from './pages/Profile/Profile';

// Core Application Pages
import { Dashboard } from './pages/Dashboard/Dashboard';
import { Tasks } from './pages/Tasks/Tasks';
import { TaskDetails } from './pages/TaskDetails/TaskDetails';
import { Teams } from './pages/Teams/Teams';
import { Users } from './pages/Users/Users';
import { Milestones } from './pages/Milestones/Milestones';
import { Extensions } from './pages/Extensions/Extensions';
import { Reports } from './pages/Reports/Reports';

export function App() {
  const dispatch = useDispatch();
  const { token, isInitialized } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token && !isInitialized) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, token, isInitialized]);

  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Main Application Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="tasks/:id" element={<TaskDetails />} />

        {/* Manager & Team Leader Routes */}
        <Route
          path="teams"
          element={
            <ProtectedRoute allowedRoles={['manager', 'team_leader']}>
              <Teams />
            </ProtectedRoute>
          }
        />

        {/* Manager Only Route */}
        <Route
          path="users"
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <Users />
            </ProtectedRoute>
          }
        />

        {/* Manager & Team Leader Route */}
        <Route
          path="milestones"
          element={
            <ProtectedRoute allowedRoles={['manager', 'team_leader']}>
              <Milestones />
            </ProtectedRoute>
          }
        />

        {/* All Roles */}
        <Route path="extensions" element={<Extensions />} />

        {/* Manager & Team Leader Route */}
        <Route
          path="reports"
          element={
            <ProtectedRoute allowedRoles={['manager', 'team_leader']}>
              <Reports />
            </ProtectedRoute>
          }
        />

        {/* User Profile */}
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
