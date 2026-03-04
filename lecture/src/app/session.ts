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
export const PermissionsKeys = 'PermissionsKeys'
export const ROLE_PERMS_KEY = 'aya_role_perms_v1'

const CROSS_APP_SESSION_PARAM = 'aya_session'
let crossAppSessionConsumed = false

type CrossAppSessionPayload = {
  accessToken?: unknown
  refreshToken?: unknown
  permissions?: unknown
}

function consumeCrossAppSessionFromUrl() {
  if (crossAppSessionConsumed || typeof window === 'undefined') return
  crossAppSessionConsumed = true

  try {
    const url = new URL(window.location.href)
    const encoded = url.searchParams.get(CROSS_APP_SESSION_PARAM)
    if (!encoded) return

    const decoded = atob(encoded)
    const payload = JSON.parse(decoded) as CrossAppSessionPayload
    const accessToken = typeof payload.accessToken === 'string' ? payload.accessToken.trim() : ''
    const refreshToken = typeof payload.refreshToken === 'string' ? payload.refreshToken.trim() : ''
    const permissions = Array.isArray(payload.permissions)
      ? payload.permissions.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
      : []

    if (accessToken && refreshToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
      localStorage.setItem(PermissionsKeys, JSON.stringify([...new Set(permissions)]))
    }

    url.searchParams.delete(CROSS_APP_SESSION_PARAM)
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
  } catch {
    // ignore invalid cross-app session payload
  }
}


export function readAccessToken() {
  consumeCrossAppSessionFromUrl()
  return localStorage.getItem(ACCESS_TOKEN_KEY) || ''
}

export function readRefreshToken() {
  consumeCrossAppSessionFromUrl()
  return localStorage.getItem(REFRESH_TOKEN_KEY) || ''
}

export function writeTokenPair(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken.trim())
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken.trim())
}

export function readPermissionKeys() {
  consumeCrossAppSessionFromUrl()
  try {
    const raw = localStorage.getItem(PermissionsKeys)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

export function writePermissionKeys(permissions: string[] | null | undefined) {
  const safePermissions = Array.isArray(permissions)
    ? permissions.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
    : []

  localStorage.setItem(PermissionsKeys, JSON.stringify([...new Set(safePermissions)]))
}

export function clearTokenPair() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(PermissionsKeys)
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
  const persistedPermissions = readPermissionKeys()
  if (!claims?.role) return [...new Set([...(claims?.permissions ?? []), ...persistedPermissions])]
  const rolePerms = readRolePermissionMap()[claims.role] || []
  const merged = new Set([...(claims.permissions || []), ...persistedPermissions, ...rolePerms])
  return [...merged]
}

export function hasPermission(claims: SessionClaims | null | undefined, permission: string) {
  if (!claims?.role) return false
  if (claims.role === 'ADMIN') return true
  return resolvePermissions(claims).includes(permission)
}
