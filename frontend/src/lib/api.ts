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

// Optional: Add interceptor to include token if you have one
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;