import { clearTokenPair, readAccessToken, readRefreshToken, writePermissionKeys, writeTokenPair } from '../app/session'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export class ApiError extends Error {
  status: number
  data?: any

  constructor(message: string, status: number, data?: any) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

function getBaseUrl() {
  const viteUrl =
    (import.meta as any)?.env?.VITE_API_BASE ||
    (import.meta as any)?.env?.VITE_API_URL ||
    (import.meta as any)?.env?.VITE_BACKEND_URL

  return (viteUrl || 'http://localhost:8090').replace(/\/+$/, '')
}

function isJsonResponse(res: Response) {
  const ct = res.headers.get('content-type') || ''
  return ct.includes('application/json')
}

async function parseResponseBody(res: Response) {
  if (res.status === 204) return null
  if (isJsonResponse(res)) {
    try {
      return await res.json()
    } catch {
      return null
    }
  }
  try {
    return await res.text()
  } catch {
    return null
  }
}

function normalizeErrorMessage(data: any, fallback: string) {
  if (!data) return fallback
  if (typeof data === 'string') return data

  const msg = (data as any)?.message
  if (typeof msg === 'string') return msg
  if (Array.isArray(msg) && msg.length) return String(msg[0])
  if ((data as any)?.error && typeof (data as any)?.error === 'string') return (data as any).error

  return fallback
}

type RefreshResponse = {
  user?: { permissions?: string[] }
  permissions?: string[]
  accessToken: string
  refreshToken: string
}
let pendingRefresh: Promise<string | null> | null = null

async function refreshAccessToken(baseUrl: string): Promise<string | null> {
  const refreshToken = readRefreshToken()
  if (!refreshToken) return null

  if (!pendingRefresh) {
    pendingRefresh = (async () => {
      const res = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${refreshToken}` },
        credentials: 'include',
      })

      if (!res.ok) {
        clearTokenPair()
        return null
      }

      const payload = (await parseResponseBody(res)) as RefreshResponse | null
      if (!payload?.accessToken || !payload?.refreshToken) {
        clearTokenPair()
        return null
      }

      writeTokenPair(payload.accessToken, payload.refreshToken)
      writePermissionKeys(payload.user?.permissions ?? payload.permissions ?? [])
      return payload.accessToken
    })().finally(() => {
      pendingRefresh = null
    })
  }

  return pendingRefresh
}

export async function request<T>(
  path: string,
  options?: {
    method?: HttpMethod
    body?: any
    auth?: boolean
    headers?: Record<string, string>
    signal?: AbortSignal
    baseUrl?: string
  },
  allowRetry = true,
): Promise<T> {
  const baseUrl = (options?.baseUrl || getBaseUrl()).replace(/\/+$/, '')
  const url = path.startsWith('http') ? path : `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`

  const method = options?.method ?? 'GET'
  const auth = options?.auth ?? true

  const headers: Record<string, string> = {
    ...(options?.headers || {}),
  }

  const body = options?.body
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData

  if (!isFormData && body !== undefined && body !== null) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json'
  }

  if (auth) {
    const token = readAccessToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const fetchInit: RequestInit = {
    method,
    headers,
    signal: options?.signal,
    credentials: 'include', // ✅ thêm dòng này
  }
  if (body !== undefined && body !== null) {
    fetchInit.body = isFormData ? body : JSON.stringify(body)
  }

  let res: Response
  try {
    res = await fetch(url, fetchInit)
  } catch (e: any) {
    throw new ApiError(e?.message || 'Network error', 0)
  }

  if (res.status === 401 && auth && allowRetry) {
    const newToken = await refreshAccessToken(baseUrl)
    if (newToken) return request<T>(path, options, false)
  }

  const data = await parseResponseBody(res)
  if (!res.ok) {
    if (res.status === 401) clearTokenPair()
    throw new ApiError(normalizeErrorMessage(data, `HTTP ${res.status}`), res.status, data)
  }

  return data as T
}

export const http = request
export const get = <T>(path: string, options?: Omit<Parameters<typeof request<T>>[1], 'method' | 'body'>) => request<T>(path, { ...options, method: 'GET' })
export const del = <T>(path: string, options?: Omit<Parameters<typeof request<T>>[1], 'method' | 'body'>) => request<T>(path, { ...options, method: 'DELETE' })
export const post = <T>(path: string, body?: any, options?: Omit<Parameters<typeof request<T>>[1], 'method' | 'body'>) => request<T>(path, { ...options, method: 'POST', body })
export const put = <T>(path: string, body?: any, options?: Omit<Parameters<typeof request<T>>[1], 'method' | 'body'>) => request<T>(path, { ...options, method: 'PUT', body })
export const patch = <T>(path: string, body?: any, options?: Omit<Parameters<typeof request<T>>[1], 'method' | 'body'>) => request<T>(path, { ...options, method: 'PATCH', body })
