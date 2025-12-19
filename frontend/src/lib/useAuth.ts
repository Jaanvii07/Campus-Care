import { jwtDecode } from 'jwt-decode';

export const useAuth = () => {
  // 1. Get BOTH the token and the saved user details
  const token = localStorage.getItem('token'); 
  const userStr = localStorage.getItem('user');
  
  if (token && userStr) {
    try {
      // 2. Parse the User Object (This definitely has the role!)
      const user = JSON.parse(userStr);
      
      // 3. Check if token is valid/expired (Security check)
      const decodedToken = jwtDecode<{ exp: number }>(token);
      if (decodedToken.exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return { isLoggedIn: false };
      }
      
      // 4. THE FIX: Read role from the USER OBJECT, not the token
      // We also handle "Student" vs "student" here.
      const role = (user.role || user.type || '').toLowerCase();

      return {
        isLoggedIn: true,
        isAdmin: role === 'admin',
        isStudent: role === 'student',
        // Checks for 'department', 'staff', 'maintenance'
        isDepartment: ['department', 'staff', 'maintenance'].includes(role),
        user: user,
      };
    } catch (e) {
      console.error("Auth Error:", e);
      return { isLoggedIn: false };
    }
  }
  
  return { isLoggedIn: false };
};