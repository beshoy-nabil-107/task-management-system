import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import reportService from '../../services/reportService';
import { fetchNotifications } from './notificationSlice';

export const fetchOverview = createAsyncThunk(
  'reports/fetchOverview',
  async (teamId = null, { rejectWithValue }) => {
    try {
      return await reportService.getOverview(teamId);
    } catch (error) {
      return rejectWithValue(error.parsedMessage || 'Failed to fetch status overview');
    }
  }
);

export const fetchPerformance = createAsyncThunk(
  'reports/fetchPerformance',
  async (_, { rejectWithValue }) => {
    try {
      return await reportService.getPerformanceReport();
    } catch (error) {
      return rejectWithValue(error.parsedMessage || 'Failed to fetch performance report');
    }
  }
);

export const fetchTeamFeedback = createAsyncThunk(
  'reports/fetchTeamFeedback',
  async (teamId = null, { rejectWithValue }) => {
    try {
      return await reportService.getTeamFeedback(teamId);
    } catch (error) {
      return rejectWithValue(error.parsedMessage || 'Failed to fetch team feedback');
    }
  }
);

export const submitTeamFeedbackThunk = createAsyncThunk(
  'reports/submitTeamFeedback',
  async (feedback, { dispatch, rejectWithValue }) => {
    try {
      const report = await reportService.submitTeamFeedback(feedback);
      dispatch(fetchNotifications());
      return report;
    } catch (error) {
      return rejectWithValue(error.parsedMessage || 'Failed to submit team report');
    }
  }
);

const initialState = {
  overview: null,
  performance: null,
  teamFeedback: [],
  loading: false,
  error: null,
};

const reportSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    clearReportError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchOverview
      .addCase(fetchOverview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOverview.fulfilled, (state, action) => {
        state.loading = false;
        state.overview = action.payload;
      })
      .addCase(fetchOverview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchPerformance
      .addCase(fetchPerformance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPerformance.fulfilled, (state, action) => {
        state.loading = false;
        state.performance = action.payload;
      })
      .addCase(fetchPerformance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchTeamFeedback
      .addCase(fetchTeamFeedback.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeamFeedback.fulfilled, (state, action) => {
        state.loading = false;
        state.teamFeedback = action.payload;
      })
      .addCase(fetchTeamFeedback.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // submitTeamFeedbackThunk
      .addCase(submitTeamFeedbackThunk.fulfilled, (state, action) => {
        if (action.payload) {
          state.teamFeedback.unshift(action.payload);
        }
      });
  },
});

export const { clearReportError } = reportSlice.actions;
export default reportSlice.reducer;
