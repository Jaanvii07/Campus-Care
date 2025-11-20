import { useAuth } from '@/lib/useAuth';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const { isLoggedIn } = useAuth();
  
  if (!isLoggedIn) {
    // Redirect to the main student login page if not logged in
    return <Navigate to="/login" replace />;
  }

  return <Outlet />; // This renders the child component (e.g., the dashboard)
};

export default ProtectedRoute;