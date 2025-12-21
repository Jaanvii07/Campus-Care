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

// 2. REQUEST INTERCEPTOR: Attach & Clean Token
api.interceptors.request.use(
  (config) => {
    // 1. Get Token
    let token = localStorage.getItem("token");
    
    // 2. DEBUG: Print it to the console
    if (!token) {
        console.error("❌ FATAL ERROR: No token found in LocalStorage! Request will fail.");
    } else {
        // Remove quotes if they exist
        token = token.replace(/"/g, '');
        console.log("✅ Attaching Token:", token.substring(0, 10) + "...");
        
        // 3. Attach to Headers
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
export default api;