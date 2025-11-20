import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Page Imports
import Home from "./pages/Home";
import Login from "./pages/Login"; // This is the Student Login
import AdminLogin from "./pages/AdminLogin";
import DepartmentLogin from "./pages/DepartmentLogin";
import Register from "./pages/Register"; // <-- IMPORT THE NEW PAGE
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import UserManagement from "./pages/UserManagement";
import DepartmentDashboard from "./pages/DepartmentDashboard";
import NotFound from "./pages/NotFound";

// Auth Guard Imports
import StudentRoute from "./components/auth/StudentRoute";
import AdminRoute from "./components/auth/AdminRoute";
import DepartmentRoute from "./components/auth/DepartmentRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/login/admin" element={<AdminLogin />} />
          <Route path="/login/department" element={<DepartmentLogin />} />
          <Route path="/register" element={<Register />} /> {/* <-- ADD THE PUBLIC ROUTE */}

          {/* Student Protected Routes */}
          <Route element={<StudentRoute />}>
            <Route path="/student" element={<StudentDashboard />} />
          </Route>

          {/* Admin Protected Routes */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
            <Route path="/admin/users" element={<UserManagement />} />
          </Route>

          {/* Department Protected Routes */}
          <Route element={<DepartmentRoute />}>
            <Route path="/department" element={<DepartmentDashboard />} />
          </Route>

          {/* Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;