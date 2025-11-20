import { useAuth } from '@/lib/useAuth';
import { Navigate, Outlet } from 'react-router-dom';

const StudentRoute = () => {
  const { isLoggedIn, isStudent } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  if (!isStudent) {
    // If logged in but not a student, send them away
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default StudentRoute;