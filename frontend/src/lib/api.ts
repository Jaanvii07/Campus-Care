import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001/api', // Your backend's URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add the JWT token to every request EXCEPT for FormData uploads
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Don't set Content-Type if it's FormData, let Axios handle it
    if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add an interceptor to handle common errors like 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Token might be invalid or expired, redirect to login
      localStorage.removeItem('token');
      // Use window.location to force reload and clear state
      if (window.location.pathname !== '/login') {
         window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;