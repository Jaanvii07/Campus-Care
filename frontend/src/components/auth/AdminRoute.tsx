import { useAuth } from '@/lib/useAuth';
import { Navigate, Outlet } from 'react-router-dom';

const AdminRoute = () => {
  const { isLoggedIn, isAdmin } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/login/admin" replace />;
  }
  if (!isAdmin) {
    // If logged in but not an admin, send them away
    return <Navigate to="/login" replace />; 
  }

  return <Outlet />;
};

export default AdminRoute;