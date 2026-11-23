import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import taskService from '../../services/taskService';
import { fetchNotifications } from './notificationSlice';

export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (filters = {}, { rejectWithValue }) => {
    try {
      return await taskService.getTasks(filters);
    } catch (error) {
      return rejectWithValue(error.parsedMessage || 'Failed to fetch tasks');
    }
  }
);

export const fetchTaskById = createAsyncThunk(
  'tasks/fetchTaskById',
  async (id, { rejectWithValue }) => {
    try {
      return await taskService.getTaskById(id);
    } catch (error) {
      return rejectWithValue(error.parsedMessage || 'Failed to fetch task details');
    }
  }
);

export const createTaskThunk = createAsyncThunk(
  'tasks/createTask',
  async (taskData, { dispatch, rejectWithValue }) => {
    try {
      const task = await taskService.createTask(taskData);
      dispatch(fetchNotifications());
      return task;
    } catch (error) {
      return rejectWithValue(error.parsedMessage || 'Failed to create task');
    }
  }
);

export const updateTaskThunk = createAsyncThunk(
  'tasks/updateTask',
  async ({ id, data }, { dispatch, rejectWithValue }) => {
    try {
      const task = await taskService.updateTask(id, data);
      dispatch(fetchNotifications());
      return task;
    } catch (error) {
      return rejectWithValue(error.parsedMessage || 'Failed to update task');
    }
  }
);

export const deleteTaskThunk = createAsyncThunk(
  'tasks/deleteTask',
  async (id, { rejectWithValue }) => {
    try {
      await taskService.deleteTask(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.parsedMessage || 'Failed to delete task');
    }
  }
);

export const updateTaskStatusThunk = createAsyncThunk(
  'tasks/updateStatus',
  async ({ id, status }, { dispatch, rejectWithValue }) => {
    try {
      const updated = await taskService.updateTaskStatus(id, status);
      dispatch(fetchNotifications());
      return updated;
    } catch (error) {
      return rejectWithValue(error.parsedMessage || 'Failed to update task status');
    }
  }
);

export const reviewTaskThunk = createAsyncThunk(
  'tasks/reviewTask',
  async ({ id, payload }, { dispatch, rejectWithValue }) => {
    try {
      const reviewed = await taskService.reviewTask(id, payload);
      dispatch(fetchNotifications());
      return reviewed;
    } catch (error) {
      return rejectWithValue(error.parsedMessage || 'Failed to submit review');
    }
  }
);

export const addAttachmentThunk = createAsyncThunk(
  'tasks/addAttachment',
  async ({ taskId, formData }, { rejectWithValue }) => {
    try {
      return await taskService.addAttachment(taskId, formData);
    } catch (error) {
      return rejectWithValue(error.parsedMessage || 'Failed to add attachment');
    }
  }
);

const initialState = {
  items: [],
  currentTask: null, // { task, attachments: [], extensions: [] }
  loading: false,
  detailLoading: false,
  error: null,
};

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    clearTaskError: (state) => {
      state.error = null;
    },
    clearCurrentTask: (state) => {
      state.currentTask = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchTasks
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchTaskById
      .addCase(fetchTaskById.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchTaskById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.currentTask = action.payload;
      })
      .addCase(fetchTaskById.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload;
      })

      // createTaskThunk
      .addCase(createTaskThunk.fulfilled, (state, action) => {
        if (action.payload) {
          state.items.unshift(action.payload);
        }
      })

      // updateTaskThunk
      .addCase(updateTaskThunk.fulfilled, (state, action) => {
        const updated = action.payload;
        if (updated) {
          const index = state.items.findIndex((t) => t.id === updated.id);
          if (index !== -1) {
            state.items[index] = updated;
          }
          if (state.currentTask?.task?.id === updated.id) {
            state.currentTask.task = updated;
          }
        }
      })

      // deleteTaskThunk
      .addCase(deleteTaskThunk.fulfilled, (state, action) => {
        state.items = state.items.filter((t) => t.id !== action.payload);
        if (state.currentTask?.task?.id === action.payload) {
          state.currentTask = null;
        }
      })

      // updateTaskStatusThunk
      .addCase(updateTaskStatusThunk.fulfilled, (state, action) => {
        const updated = action.payload;
        if (updated) {
          const index = state.items.findIndex((t) => t.id === updated.id);
          if (index !== -1) {
            state.items[index] = updated;
          }
          if (state.currentTask?.task?.id === updated.id) {
            state.currentTask.task = updated;
          }
        }
      })

      // reviewTaskThunk
      .addCase(reviewTaskThunk.fulfilled, (state, action) => {
        const updated = action.payload;
        if (updated) {
          const index = state.items.findIndex((t) => t.id === updated.id);
          if (index !== -1) {
            state.items[index] = updated;
          }
          if (state.currentTask?.task?.id === updated.id) {
            state.currentTask.task = updated;
          }
        }
      })

      // addAttachmentThunk
      .addCase(addAttachmentThunk.fulfilled, (state, action) => {
        if (action.payload && state.currentTask) {
          if (!state.currentTask.attachments) {
            state.currentTask.attachments = [];
          }
          state.currentTask.attachments.push(action.payload);
        }
      });
  },
});

export const { clearTaskError, clearCurrentTask } = taskSlice.actions;
export default taskSlice.reducer;
