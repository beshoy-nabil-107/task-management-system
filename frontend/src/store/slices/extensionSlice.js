import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import extensionService from '../../services/extensionService';
import { fetchNotifications } from './notificationSlice';

export const fetchExtensions = createAsyncThunk(
  'extensions/fetchExtensions',
  async (_, { rejectWithValue }) => {
    try {
      return await extensionService.getExtensions();
    } catch (error) {
      return rejectWithValue(error.parsedMessage || 'Failed to fetch extension requests');
    }
  }
);

export const createExtensionThunk = createAsyncThunk(
  'extensions/createExtension',
  async (data, { dispatch, rejectWithValue }) => {
    try {
      const ext = await extensionService.createExtension(data);
      dispatch(fetchNotifications());
      return ext;
    } catch (error) {
      return rejectWithValue(error.parsedMessage || 'Failed to submit extension request');
    }
  }
);

export const reviewExtensionThunk = createAsyncThunk(
  'extensions/reviewExtension',
  async ({ id, status }, { dispatch, rejectWithValue }) => {
    try {
      const ext = await extensionService.reviewExtension(id, status);
      dispatch(fetchNotifications());
      return ext;
    } catch (error) {
      return rejectWithValue(error.parsedMessage || 'Failed to review extension request');
    }
  }
);

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const extensionSlice = createSlice({
  name: 'extensions',
  initialState,
  reducers: {
    clearExtensionError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchExtensions
      .addCase(fetchExtensions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExtensions.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchExtensions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // createExtensionThunk
      .addCase(createExtensionThunk.fulfilled, (state, action) => {
        if (action.payload) {
          state.items.unshift(action.payload);
        }
      })

      // reviewExtensionThunk
      .addCase(reviewExtensionThunk.fulfilled, (state, action) => {
        const updated = action.payload;
        if (updated) {
          const index = state.items.findIndex((e) => e.id === updated.id);
          if (index !== -1) {
            state.items[index] = updated;
          }
        }
      });
  },
});

export const { clearExtensionError } = extensionSlice.actions;
export default extensionSlice.reducer;
