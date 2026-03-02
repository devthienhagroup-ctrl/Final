import { request, type ApiError } from "../../app/api";

export type { ApiError };

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...rest } = init;
  return request<T>(path, rest, token);
}
