// app/admin/src/app/api.ts
import { useAuth } from "./auth.store";
import { apiFetch } from "../api/client";

export function useApi() {
  const { token } = useAuth();

  return {
    get: <T,>(path: string) => apiFetch<T>(path, { method: "GET", token }),
    post: <T,>(path: string, body?: any) =>
      apiFetch<T>(path, {
        method: "POST",
        body: body !== undefined ? JSON.stringify(body) : undefined,
        token,
      }),
    put: <T,>(path: string, body?: any) =>
      apiFetch<T>(path, {
        method: "PUT",
        body: body !== undefined ? JSON.stringify(body) : undefined,
        token,
      }),
    del: <T,>(path: string) => apiFetch<T>(path, { method: "DELETE", token }),
  };
}
