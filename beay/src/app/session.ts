export type ScopeType = 'OWN' | 'BRANCH' | 'COURSE' | 'GLOBAL'

export type SessionClaims = {
  sub?: number
  email?: string
  role?: string
  scopeType?: ScopeType | string | null
  permissions?: string[]
  exp?: number
  iat?: number
}

export const ACCESS_TOKEN_KEY = 'aya_admin_token'
export const REFRESH_TOKEN_KEY = 'aya_admin_refresh_token'
export const ROLE_PERMS_KEY = 'aya_role_perms_v1'

export function readAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || ''
}

export function readRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY) || ''
}

export function writeTokenPair(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken.trim())
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken.trim())
}

export function clearTokenPair() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function decodeJwtClaims(token: string): SessionClaims | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(normalized)
        .split('')
        .map((ch) => `%${(`00${ch.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join(''),
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}

type RolePermMap = Record<string, string[]>

function readRolePermissionMap(): RolePermMap {
  try {
    const raw = localStorage.getItem(ROLE_PERMS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as RolePermMap
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function resolvePermissions(claims: SessionClaims | null | undefined): string[] {
  if (!claims?.role) return claims?.permissions ?? []
  const rolePerms = readRolePermissionMap()[claims.role] || []
  const merged = new Set([...(claims.permissions || []), ...rolePerms])
  return [...merged]
}

export function hasPermission(claims: SessionClaims | null | undefined, permission: string) {
  if (!claims?.role) return false
  if (claims.role === 'ADMIN') return true
  return resolvePermissions(claims).includes(permission)
}
