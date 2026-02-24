// src/state/auth.store.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi, type MeRes } from "../api/auth.api";
import { clearAccessToken, getAccessToken, setAccessToken } from "../api/http";

export type AuthStatus = "loading" | "guest" | "authed";

export type AuthState = {
  status: AuthStatus;
  token: string;
  user: MeRes | null;
};

type AuthCtx = AuthState & {
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [token, setToken] = useState<string>(getAccessToken());
  const [user, setUser] = useState<MeRes | null>(null);

  const bootstrap = async () => {
    const t = getAccessToken();
    setToken(t);

    if (!t) {
      setUser(null);
      setStatus("guest");
      return;
    }

    setStatus("loading");
    try {
      const me = await authApi.me();
      setUser(me);
      setStatus("authed");
    } catch {
      // http.ts đã auto clear token khi 401, nhưng vẫn clear chắc chắn
      clearAccessToken();
      setToken("");
      setUser(null);
      setStatus("guest");
    }
  };

  useEffect(() => {
    void bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
      setStatus("guest");
      throw new Error("Vui lòng nhập đầy đủ email và mật khẩu.");
    }

    setStatus("loading");
    try {
      const res = await authApi.login({ email: normalizedEmail, password: normalizedPassword });
      setAccessToken(res.accessToken);
      setToken(res.accessToken);

      const me = await authApi.me();
      setUser(me);
      setStatus("authed");
    } catch (error) {
      clearAccessToken();
      setToken("");
      setUser(null);
      setStatus("guest");
      throw error;
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    await authApi.register({ email: email.trim().toLowerCase(), password, name });
    await login(email, password);
  };

  const logout = () => {
    clearAccessToken();
    setToken("");
    setUser(null);
    setStatus("guest");
  };

  const value = useMemo<AuthCtx>(
    () => ({ status, token, user, bootstrap, login, register, logout }),
    [status, token, user]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within <AuthProvider>");
  return v;
}
