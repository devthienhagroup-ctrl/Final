// src/lib/http.ts
import { API_BASE } from "../env";

export function getToken() {
  return localStorage.getItem("aya_admin_token") || "";
}

export async function api<T>(path: string, init: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as T;
}
