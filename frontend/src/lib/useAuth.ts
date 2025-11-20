import { jwtDecode } from 'jwt-decode';

interface AuthToken {
  id: number;
  role: 'student' | 'admin' | 'department';
  iat: number;
  exp: number;
}

export const useAuth = () => {
  // We get the token from localStorage (it will be set on login)
  const token = localStorage.getItem('token'); 
  
  if (token) {
    try {
      const decodedUser = jwtDecode<AuthToken>(token);
      
      // Check if token is expired
      if (decodedUser.exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        return { isLoggedIn: false };
      }
      
      // Token is valid and not expired
      return {
        isLoggedIn: true,
        isAdmin: decodedUser.role === 'admin',
        isStudent: decodedUser.role === 'student',
        isDepartment: decodedUser.role === 'department',
        user: decodedUser,
      };
    } catch (e) {
      // Token is invalid
      localStorage.removeItem('token');
      return { isLoggedIn: false };
    }
  }
  
  // No token found
  return { isLoggedIn: false };
};