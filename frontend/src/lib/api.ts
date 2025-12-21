import axios from "axios";

const BASE_URL = import.meta.env.PROD 
  ? "https://campus-care-2-y1sf.onrender.com/api" 
  : "/api";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Important for cookies/CORS
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Handle File Uploads
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. RESPONSE INTERCEPTOR: Log errors but DO NOT REDIRECT
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // We just log the error. We do NOT kick the user out.
    if (error.response && error.response.status === 401) {
      console.error("⚠️ API 401 Unauthorized - Check your Token or Backend logic.");
      // window.location.href = '/login'; // <--- DISABLED TO STOP THE LOOP
    }
    return Promise.reject(error);
  }
);

export default api;