import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export function RequireRole({
  role,
  children,
}: {
  role: "ADMIN" | "USER";
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to="/courses" replace />;

  return <>{children}</>;
}
