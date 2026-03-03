import React from "react";
import { Navigate, useLocation } from "react-router-dom";

type ProtectedRouteProps = {
  children: React.ReactElement;
  canAccess?: boolean;
};

export default function ProtectedRoute({ children, canAccess = true }: ProtectedRouteProps) {
  const location = useLocation();
  const token = localStorage.getItem("aya_access_token");

  if (!token) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  if (!canAccess) {
    return <Navigate to="/403" replace />;
  }

  return children;
}
