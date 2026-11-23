import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import notificationReducer from './slices/notificationSlice';
import userReducer from './slices/userSlice';
import teamReducer from './slices/teamSlice';
import milestoneReducer from './slices/milestoneSlice';
import taskReducer from './slices/taskSlice';
import extensionReducer from './slices/extensionSlice';
import reportReducer from './slices/reportSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    notifications: notificationReducer,
    users: userReducer,
    teams: teamReducer,
    milestones: milestoneReducer,
    tasks: taskReducer,
    extensions: extensionReducer,
    reports: reportReducer,
  },
});

export default store;
