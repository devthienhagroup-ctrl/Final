const API_BASE = (import.meta.env.VITE_API_BASE || "http://localhost:8090").replace(/\/+$/, "");
const ACCESS_TOKEN_KEY = "aya_admin_token";
const REFRESH_TOKEN_KEY = "aya_admin_refresh_token";

function joinUrl(path: string) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
}

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
};

let pendingRefresh: Promise<string | null> | null = null;

function readAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || "";
}

function readRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY) || "";
}

function writeTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken.trim());
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken.trim());
}

function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = readRefreshToken();
  if (!refreshToken) return null;

  if (!pendingRefresh) {
    pendingRefresh = (async () => {
      const response = await fetch(joinUrl("/auth/refresh"), {
        method: "POST",
        headers: { Authorization: `Bearer ${refreshToken}` },
        credentials: "include",
      });

      if (!response.ok) {
        clearTokens();
        return null;
      }

      const text = await response.text();
      const payload = text ? (JSON.parse(text) as LoginResponse) : null;
      if (!payload?.accessToken || !payload?.refreshToken) {
        clearTokens();
        return null;
      }

      writeTokens(payload.accessToken, payload.refreshToken);
      return payload.accessToken;
    })().finally(() => {
      pendingRefresh = null;
    });
  }

  return pendingRefresh;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!response.ok) throw new Error(text || `HTTP ${response.status}`);
  return text ? (JSON.parse(text) as T) : ({} as T);
}

async function request<T>(path: string, init: RequestInit = {}, allowRetry = true): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");

  const token = readAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(joinUrl(path), { ...init, headers, credentials: "include" });

  if (response.status === 401 && allowRetry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return request<T>(path, init, false);
    }
  }

  return parseResponse<T>(response);
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  }, false);
}

export type ApiRole = { id: number; code: string; scopeType: "OWN" | "BRANCH" | "COURSE" | "GLOBAL"; description?: string | null };
export type ApiPermission = { id: number; code: string; resource: string; action: string };
export type ApiUser = { id: number; email: string; name?: string | null; roleId: number | null; roleRef?: { id: number; code: string; scopeType: string } | null };

export type ApiRoleAuditLog = {
  id: number;
  action: string;
  message: string;
  actorUserId: number | null;
  actorEmail: string | null;
  targetUserId: number | null;
  targetEmail: string | null;
  roleId: number | null;
  roleCode: string | null;
  createdAt: string;
};

export type ApiPermissionCheck = {
  email: string;
  roleCode: string;
  module: string;
  action: string;
  resource?: string;
};

export type ApiPermissionCheckResult = {
  permKey: string;
  active: boolean;
  allowed: boolean;
  reason: string;
  source: "server";
};

export const getRoles = () => request<ApiRole[]>("/roles");
export const createRole = (payload: Omit<ApiRole, "id">) => request<ApiRole>("/roles", { method: "POST", body: JSON.stringify(payload) });
export const updateRole = (id: number, payload: Partial<Omit<ApiRole, "id">>) => request<ApiRole>(`/roles/${id}`, { method: "PUT", body: JSON.stringify(payload) });
export const deleteRole = (id: number) => request<void>(`/roles/${id}`, { method: "DELETE" });

export const getPermissions = () => request<ApiPermission[]>("/permissions");
export const createPermission = (payload: Omit<ApiPermission, "id">) => request<ApiPermission>("/permissions", { method: "POST", body: JSON.stringify(payload) });
export const updatePermission = (id: number, payload: Partial<Omit<ApiPermission, "id">>) => request<ApiPermission>(`/permissions/${id}`, { method: "PUT", body: JSON.stringify(payload) });
export const deletePermission = (id: number) => request<void>(`/permissions/${id}`, { method: "DELETE" });

export const assignPermissionsToRole = (roleId: number, permissionIds: number[]) => request(`/roles/${roleId}/permissions`, { method: "POST", body: JSON.stringify({ permissionIds }) });
export const getUsers = () => request<ApiUser[]>("/users");
export const assignRoleToUser = (userId: number, roleId: number) => request(`/users/${userId}/role`, { method: "PUT", body: JSON.stringify({ roleId }) });
export const getRoleAuditLogs = (limit = 50) => request<ApiRoleAuditLog[]>(`/roles/audit-logs?limit=${limit}`);
export const checkPermission = (payload: ApiPermissionCheck) => request<ApiPermissionCheckResult>("/roles/check-permission", { method: "POST", body: JSON.stringify(payload) });
