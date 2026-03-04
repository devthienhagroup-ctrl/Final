import { request } from '../../app/api'

export type UserGender = 'MALE' | 'FEMALE' | 'OTHER'

export type AdminUser = {
  id: number
  email: string
  name?: string | null
  role: string
  roleId: number | null
  roleRef?: { code: string; scopeType: string } | null
  createdAt?: string
  updatedAt?: string
  isActive: boolean
  phone?: string | null
  birthDate?: string | null
  gender?: UserGender | null
  address?: string | null
  hasRefreshToken?: boolean
}

export type UserChangeLog = {
  id: number
  action: string
  message: string
  oldEmail?: string | null
  newEmail?: string | null
  createdAt: string
  actorUser?: { email: string } | null
  targetUser?: { email: string; name?: string | null } | null
}

export type AdminUserUpsertPayload = {
  email: string
  name?: string
  isActive?: boolean
  phone?: string
  birthDate?: string
  gender?: UserGender
  address?: string
}

export type AdminUserListParams = {
  q?: string
  status?: 'ACTIVE' | 'INACTIVE'
  page?: number
  pageSize?: number
}

type PaginatedAdminUsersResponse = {
  items: AdminUser[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export const getAdminUsers = (params: AdminUserListParams = {}) => {
  const query = new URLSearchParams()
  if (params.q?.trim()) query.set('q', params.q.trim())
  if (params.status) query.set('status', params.status)
  if (params.page) query.set('page', String(params.page))
  if (params.pageSize) query.set('pageSize', String(params.pageSize))
  const suffix = query.toString()
  return request<AdminUser[] | PaginatedAdminUsersResponse>(`/users${suffix ? `?${suffix}` : ''}`)
}

export const createAdminUser = (payload: AdminUserUpsertPayload) =>
  request<AdminUser>('/users', { method: 'POST', body: JSON.stringify(payload) })
export const updateAdminUser = (id: number, payload: Partial<AdminUserUpsertPayload>) =>
  request<AdminUser>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
export const deleteAdminUser = (id: number) => request<{ success: boolean }>(`/users/${id}`, { method: 'DELETE' })
export const resetAdminUserPassword = (id: number) =>
  request<{ success: boolean; message: string }>(`/users/${id}/reset-password`, { method: 'POST' })
export const getUserChangeLogs = () => request<UserChangeLog[]>('/users/change-logs')
export const getUserManagementLogs = () => request<UserChangeLog[]>('/users/user-management-logs')
