// src/api/client.ts
const API_BASE = (import.meta as any).env?.VITE_API_BASE || "http://localhost:8090";

export type ApiError = { status: number; message: string; raw?: string };

async function readText(res: Response) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { token?: string } = {},
): Promise<T> {
  const token = init.token || "";
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const raw = await readText(res);
    throw { status: res.status, message: raw || res.statusText, raw } as ApiError;
  }

  const text = await readText(res);
  return (text ? (JSON.parse(text) as T) : ({} as T));
}
