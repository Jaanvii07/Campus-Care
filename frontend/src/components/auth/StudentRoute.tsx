import { Navigate, Outlet } from "react-router-dom";

const StudentRoute = () => {
  // 1. Read directly from the browser's pocket (LocalStorage)
  // We do NOT use useAuth() here because it might be too slow to update.
  const token = localStorage.getItem("token");
  const userString = localStorage.getItem("user");

  // 2. If nothing is found, kick them out
  if (!token || !userString) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userString);
    
    // 3. CASE-INSENSITIVE CHECK
    // This handles "Student", "student", or "STUDENT" automatically
    const role = (user.role || user.type || "").toLowerCase();

    if (role !== "student") {
      // If they are an Admin trying to access Student page, kick them out
      return <Navigate to="/login" replace />;
    }

    // 4. Allowed!
    return <Outlet />;

  } catch (error) {
    // If data is corrupted, force a re-login
    localStorage.removeItem("token");
    return <Navigate to="/login" replace />;
  }
};

export default StudentRoute;