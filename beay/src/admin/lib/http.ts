import { request } from "../../app/api";

export function getToken() {
  return localStorage.getItem("aya_admin_token") || "";
}

export async function api<T>(path: string, init: RequestInit = {}) {
  return request<T>(path, init);
}
