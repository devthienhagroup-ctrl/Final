import { JwtUser } from './decorators/current-user.decorator'

export function hasPermission(user: JwtUser | null | undefined, permission: string) {
  if (!user) return false
  if (user.role === 'ADMIN') return true
  return (user.permissions ?? []).includes(permission)
}

export function hasAnyPermission(user: JwtUser | null | undefined, permissions: string[]) {
  return permissions.some((perm) => hasPermission(user, perm))
}

export function isGlobalScope(user: JwtUser | null | undefined) {
  return user?.scopeType === 'GLOBAL' || user?.role === 'ADMIN'
}
