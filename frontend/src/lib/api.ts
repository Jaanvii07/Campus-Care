import axios from 'axios';

// 1. Define the Base URL safely
// In Production: Use your Render URL
// In Development: Use localhost directly (safer than proxy)
const BASE_URL = import.meta.env.PROD 
  ? "https://campus-care-2-y1sf.onrender.com/api" 
  : "http://localhost:5001/api"; // Check if your backend runs on 5000 or 5001

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Only keep this if your backend specifically expects Cookies
});

// 2. REQUEST INTERCEPTOR: Add Token & Handle Files
api.interceptors.request.use(
  (config) => {
    // Attach Token
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // If sending a File (FormData), let browser set Content-Type
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    } else {
      // Otherwise, assume JSON
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 3. RESPONSE INTERCEPTOR: Handle 401 (Logout)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If backend says "Unauthorized", force logout
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.warn("Session expired or invalid. Logging out...");
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login (unless already there)
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
         window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;