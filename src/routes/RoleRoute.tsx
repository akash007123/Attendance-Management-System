import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { UserRole } from "../types/user";

interface RoleRouteProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export const RoleRoute: React.FC<RoleRouteProps> = ({
  allowedRoles,
  children,
}) => {
  const { currentUser, isAuthenticated } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    // Redirect to 403 Forbidden
    return <Navigate to="/403" state={{ attemptedPath: location.pathname }} replace />;
  }

  return <>{children}</>;
};
