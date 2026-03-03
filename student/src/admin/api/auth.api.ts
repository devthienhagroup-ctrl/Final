import { apiFetch } from "./client";

export type LoginRes = { accessToken: string };

export async function login(email: string, password: string): Promise<LoginRes> {
  // chỉnh path nếu backend khác
  return apiFetch<LoginRes>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}
