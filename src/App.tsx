import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { useAppSelector } from "./store/hooks";

// Layouts & Guards
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { RoleRoute } from "./routes/RoleRoute";

// Auth Pages
import { LoginPage } from "./pages/auth/LoginPage";
import { SignupPage } from "./pages/auth/SignupPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";

// Employee Pages
import { EmployeeDashboard } from "./pages/employee/EmployeeDashboard";
import { MyAttendancePage } from "./pages/employee/MyAttendancePage";
import { OvertimePage } from "./pages/employee/OvertimePage";

// Manager Pages
import { ManagerDashboard } from "./pages/manager/ManagerDashboard";

// Admin Pages
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { UsersPage } from "./pages/admin/UsersPage";
import { AllAttendancePage } from "./pages/admin/AllAttendancePage";
import { AttendanceValidationPage } from "./pages/admin/AttendanceValidationPage";
import { OvertimeApprovalsPage } from "./pages/admin/OvertimeApprovalsPage";
import { SettingsPage } from "./pages/admin/SettingsPage";

// Common Pages
import { DailyReportPage } from "./pages/reports/DailyReportPage";
import { NotificationsPage } from "./pages/notifications/NotificationsPage";
import { ProfilePage } from "./pages/profile/ProfilePage";

// Status & Fallback Pages
import { AccessDeniedPage } from "./pages/status/AccessDeniedPage";
import { PageNotFound } from "./pages/status/PageNotFound";

// Root Redirect Component
const RootRedirect: React.FC = () => {
  const { isAuthenticated, currentUser } = useAppSelector((state) => state.auth);

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  switch (currentUser.role) {
    case "ADMIN":
      return <Navigate to="/admin/dashboard" replace />;
    case "MANAGER":
      return <Navigate to="/manager/dashboard" replace />;
    default:
      return <Navigate to="/employee/dashboard" replace />;
  }
};

// Generic Role-Aware Module Router
const RoleAwareModuleRedirect: React.FC<{
  module: "dashboard" | "attendance" | "overtime" | "validation" | "settings" | "users" | "reports";
}> = ({ module }) => {
  const { isAuthenticated, currentUser } = useAppSelector((state) => state.auth);

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  const role = currentUser.role;

  switch (module) {
    case "dashboard":
      if (role === "ADMIN") return <Navigate to="/admin/dashboard" replace />;
      if (role === "MANAGER") return <Navigate to="/manager/dashboard" replace />;
      return <Navigate to="/employee/dashboard" replace />;

    case "attendance":
      if (role === "ADMIN") return <Navigate to="/admin/attendance" replace />;
      if (role === "MANAGER") return <Navigate to="/manager/attendance" replace />;
      return <Navigate to="/employee/attendance" replace />;

    case "overtime":
      if (role === "ADMIN") return <Navigate to="/admin/overtime" replace />;
      if (role === "MANAGER") return <Navigate to="/manager/overtime" replace />;
      return <Navigate to="/employee/overtime" replace />;

    case "validation":
      if (role === "ADMIN") return <Navigate to="/admin/validation" replace />;
      if (role === "MANAGER") return <Navigate to="/manager/validation" replace />;
      return <Navigate to="/employee/dashboard" replace />;

    case "settings":
      if (role === "ADMIN") return <Navigate to="/admin/settings" replace />;
      return <Navigate to="/profile" replace />;

    case "users":
      if (role === "ADMIN") return <Navigate to="/admin/users" replace />;
      return <Navigate to="/employee/dashboard" replace />;

    case "reports":
      return <Navigate to="/reports/daily" replace />;

    default:
      return <Navigate to="/" replace />;
  }
};

// Theme Sync Component
const ThemeSync: React.FC = () => {
  const theme = useAppSelector((state) => state.ui.theme);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  return null;
};

export default function App() {
  return (
    <Provider store={store}>
      <ThemeSync />
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/403" element={<AccessDeniedPage />} />

          {/* Root Index Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Protected Application Routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Employee Routes */}
            <Route
              path="/employee/dashboard"
              element={
                <RoleRoute allowedRoles={["EMPLOYEE", "MANAGER", "ADMIN"]}>
                  <EmployeeDashboard />
                </RoleRoute>
              }
            />
            <Route
              path="/employee/attendance"
              element={
                <RoleRoute allowedRoles={["EMPLOYEE", "MANAGER", "ADMIN"]}>
                  <MyAttendancePage />
                </RoleRoute>
              }
            />
            <Route
              path="/employee/overtime"
              element={
                <RoleRoute allowedRoles={["EMPLOYEE", "MANAGER", "ADMIN"]}>
                  <OvertimePage />
                </RoleRoute>
              }
            />

            {/* Manager Routes */}
            <Route
              path="/manager/dashboard"
              element={
                <RoleRoute allowedRoles={["MANAGER", "ADMIN"]}>
                  <ManagerDashboard />
                </RoleRoute>
              }
            />
            <Route
              path="/manager/attendance"
              element={
                <RoleRoute allowedRoles={["MANAGER", "ADMIN"]}>
                  <AllAttendancePage />
                </RoleRoute>
              }
            />
            <Route
              path="/manager/validation"
              element={
                <RoleRoute allowedRoles={["MANAGER", "ADMIN"]}>
                  <AttendanceValidationPage />
                </RoleRoute>
              }
            />
            <Route
              path="/manager/overtime"
              element={
                <RoleRoute allowedRoles={["MANAGER", "ADMIN"]}>
                  <OvertimeApprovalsPage />
                </RoleRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <RoleRoute allowedRoles={["ADMIN"]}>
                  <AdminDashboard />
                </RoleRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <RoleRoute allowedRoles={["ADMIN"]}>
                  <UsersPage />
                </RoleRoute>
              }
            />
            <Route
              path="/admin/attendance"
              element={
                <RoleRoute allowedRoles={["ADMIN"]}>
                  <AllAttendancePage />
                </RoleRoute>
              }
            />
            <Route
              path="/admin/validation"
              element={
                <RoleRoute allowedRoles={["ADMIN"]}>
                  <AttendanceValidationPage />
                </RoleRoute>
              }
            />
            <Route
              path="/admin/overtime"
              element={
                <RoleRoute allowedRoles={["ADMIN"]}>
                  <OvertimeApprovalsPage />
                </RoleRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <RoleRoute allowedRoles={["ADMIN"]}>
                  <SettingsPage />
                </RoleRoute>
              }
            />

            {/* Common Shared Routes */}
            <Route path="/reports/daily" element={<DailyReportPage />} />
            <Route path="/reports" element={<RoleAwareModuleRedirect module="reports" />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* Role-Aware Module Route Aliases */}
            <Route path="/dashboard" element={<RoleAwareModuleRedirect module="dashboard" />} />
            <Route path="/attendance" element={<RoleAwareModuleRedirect module="attendance" />} />
            <Route path="/overtime" element={<RoleAwareModuleRedirect module="overtime" />} />
            <Route path="/validation" element={<RoleAwareModuleRedirect module="validation" />} />
            <Route path="/settings" element={<RoleAwareModuleRedirect module="settings" />} />
            <Route path="/users" element={<RoleAwareModuleRedirect module="users" />} />
          </Route>

          {/* 404 Catch-All */}
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}
