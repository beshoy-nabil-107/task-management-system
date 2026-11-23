import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import teamService from '../../services/teamService';

export const fetchTeams = createAsyncThunk(
  'teams/fetchTeams',
  async (_, { rejectWithValue }) => {
    try {
      return await teamService.getTeams();
    } catch (error) {
      return rejectWithValue(error.parsedMessage || 'Failed to fetch teams');
    }
  }
);

export const fetchTeamByIdThunk = createAsyncThunk(
  'teams/fetchTeamById',
  async (id, { rejectWithValue }) => {
    try {
      return await teamService.getTeamById(id);
    } catch (error) {
      return rejectWithValue(error.parsedMessage || 'Failed to fetch team details');
    }
  }
);

export const createTeamThunk = createAsyncThunk(
  'teams/createTeam',
  async (teamData, { rejectWithValue }) => {
    try {
      return await teamService.createTeam(teamData);
    } catch (error) {
      return rejectWithValue(error.parsedMessage || 'Failed to create team');
    }
  }
);

export const updateTeamThunk = createAsyncThunk(
  'teams/updateTeam',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await teamService.updateTeam(id, data);
    } catch (error) {
      return rejectWithValue(error.parsedMessage || 'Failed to update team');
    }
  }
);

export const addTeamMemberThunk = createAsyncThunk(
  'teams/addMember',
  async ({ teamId, userId }, { rejectWithValue }) => {
    try {
      return await teamService.addTeamMember(teamId, userId);
    } catch (error) {
      return rejectWithValue(error.parsedMessage || 'Failed to add team member');
    }
  }
);

export const removeTeamMemberThunk = createAsyncThunk(
  'teams/removeMember',
  async ({ teamId, userId }, { rejectWithValue }) => {
    try {
      return await teamService.removeTeamMember(teamId, userId);
    } catch (error) {
      return rejectWithValue(error.parsedMessage || 'Failed to remove team member');
    }
  }
);

export const deleteTeamThunk = createAsyncThunk(
  'teams/deleteTeam',
  async (id, { rejectWithValue }) => {
    try {
      await teamService.deleteTeam(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.parsedMessage || 'Failed to delete team');
    }
  }
);

const initialState = {
  items: [],
  currentTeam: null,
  loading: false,
  error: null,
};

const teamSlice = createSlice({
  name: 'teams',
  initialState,
  reducers: {
    clearTeamError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchTeams
      .addCase(fetchTeams.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeams.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTeams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchTeamByIdThunk
      .addCase(fetchTeamByIdThunk.fulfilled, (state, action) => {
        state.currentTeam = action.payload;
      })

      // createTeamThunk
      .addCase(createTeamThunk.fulfilled, (state, action) => {
        if (action.payload) {
          state.items.unshift(action.payload);
        }
      })

      // updateTeamThunk
      .addCase(updateTeamThunk.fulfilled, (state, action) => {
        const updated = action.payload;
        if (updated) {
          const index = state.items.findIndex((t) => t.id === updated.id);
          if (index !== -1) {
            state.items[index] = updated;
          }
          if (state.currentTeam?.id === updated.id) {
            state.currentTeam = updated;
          }
        }
      })

      // addTeamMemberThunk & removeTeamMemberThunk
      .addCase(addTeamMemberThunk.fulfilled, (state, action) => {
        const updated = action.payload;
        if (updated) {
          const index = state.items.findIndex((t) => t.id === updated.id);
          if (index !== -1) {
            state.items[index] = updated;
          }
          state.currentTeam = updated;
        }
      })
      .addCase(removeTeamMemberThunk.fulfilled, (state, action) => {
        const updated = action.payload;
        if (updated) {
          const index = state.items.findIndex((t) => t.id === updated.id);
          if (index !== -1) {
            state.items[index] = updated;
          }
          state.currentTeam = updated;
        }
      })

      // deleteTeamThunk
      .addCase(deleteTeamThunk.fulfilled, (state, action) => {
        state.items = state.items.filter((t) => t.id !== action.payload);
        if (state.currentTeam?.id === action.payload) {
          state.currentTeam = null;
        }
      });
  },
});

export const { clearTeamError } = teamSlice.actions;
export default teamSlice.reducer;
