import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi, MeRes } from "../api/auth.api";
import { clearToken, getToken, setToken } from "./auth.storage";

type AuthState = {
  user: MeRes | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MeRes | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshMe() {
    const token = getToken();
    if (!token) {
      setUser(null);
      return;
    }
    const me = await authApi.me();
    setUser(me);
  }

  async function login(email: string, password: string) {
    const { accessToken } = await authApi.login({ email, password });
    setToken(accessToken);
    await refreshMe();
  }

  async function register(email: string, password: string, name?: string) {
    await authApi.register({ email, password, name });
    // Sau đăng ký: auto login
    await login(email, password);
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  useEffect(() => {
    (async () => {
      try {
        await refreshMe();
      } catch {
        clearToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refreshMe }),
    [user, loading]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
