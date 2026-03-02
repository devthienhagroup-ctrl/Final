import { createContext, useContext, useMemo, useState } from 'react'
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, clearTokenPair, decodeJwtClaims, hasPermission, readAccessToken, readRefreshToken, writePermissionKeys, type ScopeType } from './session'

type AuthState = {
  token: string
  refreshToken: string
  claims: ReturnType<typeof decodeJwtClaims>
  setTokenPair: (accessToken: string, refreshToken: string, permissions?: string[]) => void
  logout: () => void
  can: (permission: string) => boolean
  hasScope: (scope: ScopeType | string) => boolean
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string>(() => readAccessToken())
  const [refreshToken, setRefreshTokenState] = useState<string>(() => readRefreshToken())

  const claims = useMemo(() => decodeJwtClaims(token), [token])

  const setTokenPair = (nextToken: string, nextRefreshToken: string, permissions?: string[]) => {
    const cleanToken = nextToken.trim()
    const cleanRefresh = nextRefreshToken.trim()

    setTokenState(cleanToken)
    setRefreshTokenState(cleanRefresh)

    localStorage.setItem(ACCESS_TOKEN_KEY, cleanToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, cleanRefresh)
    writePermissionKeys(permissions)
  }

  const logout = () => {
    setTokenState('')
    setRefreshTokenState('')
    clearTokenPair()
  }

  const can = (permission: string) => hasPermission(claims, permission)
  const hasScope = (scope: ScopeType | string) => claims?.role === 'ADMIN' || claims?.scopeType === scope

  const value = useMemo(() => ({ token, refreshToken, claims, setTokenPair, logout, can, hasScope }), [token, refreshToken, claims])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
