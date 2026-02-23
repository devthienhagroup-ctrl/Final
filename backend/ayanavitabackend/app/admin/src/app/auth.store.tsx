import React, { createContext, useContext, useMemo, useState } from "react";

type AuthState = {
  token: string;
  setToken: (t: string) => void;
  logout: () => void;
};

const AuthCtx = createContext<AuthState | null>(null);

const KEY = "aya_admin_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string>(() => localStorage.getItem(KEY) || "");

  const setToken = (t: string) => {
    setTokenState(t);
    localStorage.setItem(KEY, t);
  };

  const logout = () => {
    setTokenState("");
    localStorage.removeItem(KEY);
  };

  const value = useMemo(() => ({ token, setToken, logout }), [token]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
