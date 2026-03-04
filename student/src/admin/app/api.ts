import { useAuth } from "../../app/auth";
import { request } from "../../app/api";

export function useApi() {
  const { token } = useAuth();

  return {
    get: <T,>(path: string) => request<T>(path, { method: "GET" }, token),
    post: <T,>(path: string, body?: unknown) =>
      request<T>(
        path,
        {
          method: "POST",
          body: body !== undefined ? JSON.stringify(body) : undefined,
        },
        token,
      ),
    put: <T,>(path: string, body?: unknown) =>
      request<T>(
        path,
        {
          method: "PUT",
          body: body !== undefined ? JSON.stringify(body) : undefined,
        },
        token,
      ),
    del: <T,>(path: string) => request<T>(path, { method: "DELETE" }, token),
  };
}
