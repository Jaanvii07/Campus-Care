import { jwtDecode } from 'jwt-decode';

interface AuthToken {
  id: number;
  role: string; // Changed to 'string' to handle any capitalization
  iat: number;
  exp: number;
}

export const useAuth = () => {
  const token = localStorage.getItem('token'); 
  
  if (token) {
    try {
      const decodedUser = jwtDecode<AuthToken>(token);
      
      // 1. Check if token is expired
      if (decodedUser.exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        return { isLoggedIn: false };
      }
      
      // 2. CRITICAL FIX: Convert ANY role to lowercase
      // This makes "Admin" == "admin", "Department" == "department", etc.
      const role = (decodedUser.role || '').toLowerCase();

      return {
        isLoggedIn: true,
        
        // Now these checks work even if the DB sends Capital Letters
        isAdmin: role === 'admin',
        isStudent: role === 'student',
        
        // Safe check for staff/department (handles variations)
        isDepartment: role === 'department' || role === 'staff' || role === 'maintenance',
        
        user: decodedUser,
      };
    } catch (e) {
      console.error("Token Error:", e);
      localStorage.removeItem('token');
      return { isLoggedIn: false };
    }
  }
  
  return { isLoggedIn: false };
};