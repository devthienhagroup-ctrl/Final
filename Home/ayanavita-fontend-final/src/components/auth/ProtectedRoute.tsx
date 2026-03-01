import React from "react";
import { Navigate, useLocation } from "react-router-dom";

type ProtectedRouteProps = {
  children: React.ReactElement;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const token = localStorage.getItem("aya_access_token");

  if (token) return children;

  const next = encodeURIComponent(`${location.pathname}${location.search}`);
  return <Navigate to={`/login?next=${next}`} replace />;
}
