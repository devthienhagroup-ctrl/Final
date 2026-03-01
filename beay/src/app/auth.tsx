import { createContext, useContext, useMemo, useState } from "react";

type AuthState = {
  token: string;
  refreshToken: string;
  setTokenPair: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);
const TOKEN_KEY = "aya_admin_token";
const REFRESH_TOKEN_KEY = "aya_admin_refresh_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string>(() => localStorage.getItem(TOKEN_KEY) || "");
  const [refreshToken, setRefreshTokenState] = useState<string>(() => localStorage.getItem(REFRESH_TOKEN_KEY) || "");

  const setTokenPair = (nextToken: string, nextRefreshToken: string) => {
    const cleanToken = nextToken.trim();
    const cleanRefresh = nextRefreshToken.trim();

    setTokenState(cleanToken);
    setRefreshTokenState(cleanRefresh);

    localStorage.setItem(TOKEN_KEY, cleanToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, cleanRefresh);
  };

  const logout = () => {
    setTokenState("");
    setRefreshTokenState("");
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  };

  const value = useMemo(() => ({ token, refreshToken, setTokenPair, logout }), [token, refreshToken]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
