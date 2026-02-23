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
    setStatus("loading");
    const res = await authApi.login({ email, password });
    setAccessToken(res.accessToken);
    setToken(res.accessToken);

    const me = await authApi.me();
    setUser(me);
    setStatus("authed");
  };

  const logout = () => {
    clearAccessToken();
    setToken("");
    setUser(null);
    setStatus("guest");
  };

  const value = useMemo<AuthCtx>(
    () => ({ status, token, user, bootstrap, login, logout }),
    [status, token, user]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within <AuthProvider>");
  return v;
}
