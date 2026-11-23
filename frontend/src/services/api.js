import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Bearer Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Errors & Token Expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const currentPath = window.location.pathname;

    // Handle 401 Unauthorized
    if (status === 401) {
      if (currentPath !== '/login' && currentPath !== '/register') {
        localStorage.removeItem('token');
        // Let application state or window handle redirect
      }
    }

    // Extract readable JSend error message
    const responseData = error.response?.data;
    let message = 'An unexpected error occurred';

    if (responseData) {
      if (typeof responseData.message === 'string') {
        message = responseData.message;
      } else if (typeof responseData.data === 'string') {
        message = responseData.data;
      } else if (Array.isArray(responseData.data)) {
        message = responseData.data.join('; ');
      }
    } else if (error.message) {
      message = error.message;
    }

    error.parsedMessage = message;
    return Promise.reject(error);
  }
);

export default api;
