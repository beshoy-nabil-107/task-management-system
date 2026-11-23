import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import userService from '../../services/userService';

export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      return await userService.getUsers();
    } catch (error) {
      return rejectWithValue(error.parsedMessage || 'Failed to fetch users');
    }
  }
);

export const updateUserRoleThunk = createAsyncThunk(
  'users/updateUserRole',
  async ({ id, role, team_id }, { rejectWithValue }) => {
    try {
      return await userService.updateUserRole(id, { role, team_id });
    } catch (error) {
      return rejectWithValue(error.parsedMessage || 'Failed to update user role');
    }
  }
);

export const deleteUserThunk = createAsyncThunk(
  'users/deleteUser',
  async (id, { rejectWithValue }) => {
    try {
      await userService.deleteUser(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.parsedMessage || 'Failed to delete user');
    }
  }
);

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearUserError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchUsers
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // updateUserRoleThunk
      .addCase(updateUserRoleThunk.fulfilled, (state, action) => {
        const updated = action.payload;
        if (updated) {
          const index = state.items.findIndex((u) => u.id === updated.id);
          if (index !== -1) {
            state.items[index] = updated;
          }
        }
      })

      // deleteUserThunk
      .addCase(deleteUserThunk.fulfilled, (state, action) => {
        state.items = state.items.filter((u) => u.id !== action.payload);
      });
  },
});

export const { clearUserError } = userSlice.actions;
export default userSlice.reducer;
