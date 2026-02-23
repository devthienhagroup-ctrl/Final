// src/components/RequireAuth.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../state/auth.store";
import { Card, Muted, Title } from "../ui/ui";

type RequireAuthProps = {
  children: React.ReactNode;
  /**
   * Optional: override đường dẫn login nếu bạn đổi route.
   * Mặc định: /login
   */
  loginPath?: string;
  /**
   * Optional: nếu muốn không redirect khi guest mà chỉ render fallback UI.
   * Mặc định: redirect.
   */
  fallback?: React.ReactNode;
};

export function RequireAuth({ children, loginPath = "/login", fallback }: RequireAuthProps) {
  const { status } = useAuth();
  const loc = useLocation();

  if (status === "loading") {
    return (
      <div style={{ padding: "28px 0" }}>
        <Card>
          <Title>Đang kiểm tra đăng nhập…</Title>
          <div style={{ height: 8 }} />
          <Muted>Vui lòng đợi trong giây lát.</Muted>
        </Card>
      </div>
    );
  }

  if (status !== "authed") {
    if (fallback) return <>{fallback}</>;
    return (
      <Navigate
        to={loginPath}
        replace
        state={{ from: loc.pathname + loc.search }}
      />
    );
  }

  return <>{children}</>;
}
