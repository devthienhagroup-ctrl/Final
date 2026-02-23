// src/api/http.ts
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// Bạn có thể đổi key/token storage tùy dự án
const ACCESS_TOKEN_KEY = "accessToken";

// Base URL: ưu tiên env, fallback localhost
function getBaseUrl() {
  const viteUrl =
    (import.meta as any)?.env?.VITE_API_URL ||
    (import.meta as any)?.env?.VITE_BACKEND_URL;

  return (viteUrl || "http://localhost:3000").replace(/\/+$/, "");
}


export function getAccessToken() {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function setAccessToken(token: string) {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export function clearAccessToken() {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {
    // ignore
  }
}

function isJsonResponse(res: Response) {
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json");
}

async function parseResponseBody(res: Response) {
  if (res.status === 204) return null;

  if (isJsonResponse(res)) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  // fallback text
  try {
    return await res.text();
  } catch {
    return null;
  }
}

function normalizeErrorMessage(data: any, fallback: string) {
  // NestJS thường trả:
  // { statusCode, message: "xxx" } hoặc { statusCode, message: ["a","b"], error: "Bad Request" }
  if (!data) return fallback;

  if (typeof data === "string") return data;

  const msg = (data as any)?.message;
  if (typeof msg === "string") return msg;
  if (Array.isArray(msg) && msg.length) return String(msg[0]);

  if ((data as any)?.error && typeof (data as any)?.error === "string") {
    return (data as any).error;
  }

  return fallback;
}

export async function request<T>(
  path: string,
  options?: {
    method?: HttpMethod;
    body?: any;
    auth?: boolean;
    headers?: Record<string, string>;
    signal?: AbortSignal;
    // nếu muốn override baseUrl trong vài trường hợp (hiếm)
    baseUrl?: string;
  }
): Promise<T> {
  const baseUrl = (options?.baseUrl || getBaseUrl()).replace(/\/+$/, "");
  const url = path.startsWith("http")
    ? path
    : `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;

  const method = options?.method ?? "GET";
  const auth = options?.auth ?? true;

  const headers: Record<string, string> = {
    ...(options?.headers || {}),
  };

  // Body JSON by default (trừ khi là FormData)
  const body = options?.body;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  if (!isFormData) {
    // Chỉ set Content-Type nếu có body (POST/PUT/PATCH) và body không phải FormData
    if (body !== undefined && body !== null) {
      headers["Content-Type"] = headers["Content-Type"] || "application/json";
    }
  }

  if (auth) {
    const token = getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const fetchInit: RequestInit = {
    method,
    headers,
    signal: options?.signal,
  };

  if (body !== undefined && body !== null) {
    fetchInit.body = isFormData ? body : JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(url, fetchInit);
  } catch (e: any) {
    throw new ApiError(e?.message || "Network error", 0);
  }

  const data = await parseResponseBody(res);

  if (!res.ok) {
    const msg = normalizeErrorMessage(data, `HTTP ${res.status}`);

    // (Tuỳ chọn) xử lý 401 tập trung:
    // - nếu token hết hạn hoặc sai, clear để tránh loop lỗi
    if (res.status === 401) {
      // bạn có thể comment dòng này nếu không muốn auto-clear
      clearAccessToken();
    }

    throw new ApiError(msg, res.status, data);
  }

  return data as T;
}

/**
 * Alias để migration dần:
 * - Nếu file cũ còn import { http } từ "./http" thì vẫn chạy.
 * - Khuyến nghị: code mới dùng request/get/post.
 */
export const http = request;

// Helpers cho DX tốt hơn (vẫn dựa trên request)
export function get<T>(
  path: string,
  options?: Omit<Parameters<typeof request<T>>[1], "method" | "body">
) {
  return request<T>(path, { ...options, method: "GET" });
}

export function del<T>(
  path: string,
  options?: Omit<Parameters<typeof request<T>>[1], "method" | "body">
) {
  return request<T>(path, { ...options, method: "DELETE" });
}

export function post<T>(
  path: string,
  body?: any,
  options?: Omit<Parameters<typeof request<T>>[1], "method" | "body">
) {
  return request<T>(path, { ...options, method: "POST", body });
}

export function put<T>(
  path: string,
  body?: any,
  options?: Omit<Parameters<typeof request<T>>[1], "method" | "body">
) {
  return request<T>(path, { ...options, method: "PUT", body });
}

export function patch<T>(
  path: string,
  body?: any,
  options?: Omit<Parameters<typeof request<T>>[1], "method" | "body">
) {
  return request<T>(path, { ...options, method: "PATCH", body });
}
