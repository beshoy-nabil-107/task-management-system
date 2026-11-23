import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import milestoneService from '../../services/milestoneService';

export const fetchMilestones = createAsyncThunk(
  'milestones/fetchMilestones',
  async (_, { rejectWithValue }) => {
    try {
      return await milestoneService.getMilestones();
    } catch (error) {
      return rejectWithValue(error.parsedMessage || 'Failed to fetch milestones');
    }
  }
);

export const createMilestoneThunk = createAsyncThunk(
  'milestones/createMilestone',
  async (data, { rejectWithValue }) => {
    try {
      return await milestoneService.createMilestone(data);
    } catch (error) {
      return rejectWithValue(error.parsedMessage || 'Failed to create milestone');
    }
  }
);

export const updateMilestoneThunk = createAsyncThunk(
  'milestones/updateMilestone',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await milestoneService.updateMilestone(id, data);
    } catch (error) {
      return rejectWithValue(error.parsedMessage || 'Failed to update milestone');
    }
  }
);

export const deleteMilestoneThunk = createAsyncThunk(
  'milestones/deleteMilestone',
  async (id, { rejectWithValue }) => {
    try {
      await milestoneService.deleteMilestone(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.parsedMessage || 'Failed to delete milestone');
    }
  }
);

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const milestoneSlice = createSlice({
  name: 'milestones',
  initialState,
  reducers: {
    clearMilestoneError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchMilestones
      .addCase(fetchMilestones.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMilestones.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchMilestones.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // createMilestoneThunk
      .addCase(createMilestoneThunk.fulfilled, (state, action) => {
        if (action.payload) {
          state.items.unshift(action.payload);
        }
      })

      // updateMilestoneThunk
      .addCase(updateMilestoneThunk.fulfilled, (state, action) => {
        const updated = action.payload;
        if (updated) {
          const index = state.items.findIndex((m) => m.id === updated.id);
          if (index !== -1) {
            state.items[index] = updated;
          }
        }
      })

      // deleteMilestoneThunk
      .addCase(deleteMilestoneThunk.fulfilled, (state, action) => {
        state.items = state.items.filter((m) => m.id !== action.payload);
      });
  },
});

export const { clearMilestoneError } = milestoneSlice.actions;
export default milestoneSlice.reducer;
