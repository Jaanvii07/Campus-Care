import { useAuth } from '@/lib/useAuth';
import { Navigate, Outlet } from 'react-router-dom';

const DepartmentRoute = () => {
  const { isLoggedIn, isDepartment } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/login/department" replace />;
  }
  if (!isDepartment) {
    // If logged in but not department, send them away
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default DepartmentRoute;