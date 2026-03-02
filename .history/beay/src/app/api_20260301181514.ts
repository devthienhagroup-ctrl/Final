const API_BASE = (import.meta.env.VITE_API_BASE || "http://localhost:8090").replace(/\/+$/, "");
const TOKEN_KEY = "aya_admin_token";

function joinUrl(path: string) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY) || "";
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(joinUrl(path), { ...init, headers, credentials: "include" });
  const text = await response.text();
  if (!response.ok) throw new Error(text || `HTTP ${response.status}`);
  return text ? (JSON.parse(text) as T) : ({} as T);
}

type LoginResponse = {
  accessToken: string;
};

export async function login(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export type ApiRole = { id: number; code: string; scopeType: "OWN" | "BRANCH" | "COURSE" | "GLOBAL"; description?: string | null };
export type ApiPermission = { id: number; code: string; resource: string; action: string };
export type ApiUser = { id: number; email: string; roleId: number | null; roleRef?: { id: number; code: string; scopeType: string } | null };

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
