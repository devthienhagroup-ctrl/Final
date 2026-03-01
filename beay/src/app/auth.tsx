import { createContext, useContext, useMemo, useState } from "react";

type AuthState = {
  token: string;
  setToken: (token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);
const TOKEN_KEY = "aya_admin_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string>(() => localStorage.getItem(TOKEN_KEY) || "");

  const setToken = (nextToken: string) => {
    const cleanToken = nextToken.trim();
    setTokenState(cleanToken);
    localStorage.setItem(TOKEN_KEY, cleanToken);
  };

  const logout = () => {
    setTokenState("");
    localStorage.removeItem(TOKEN_KEY);
  };

  const value = useMemo(() => ({ token, setToken, logout }), [token]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
