// app/admin/src/api/client.ts
import { API_BASE } from "../env";

export type ApiError = {
  status: number;
  message: string;
  raw?: string;
};

function joinUrl(base: string, path: string) {
  const b = base.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

async function readText(res: Response) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

function safeJsonParse<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    // backend đôi khi trả plain text (vd lỗi)
    return (text as unknown) as T;
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { token?: string } = {},
): Promise<T> {
  const url = joinUrl(API_BASE, path);

  // normalize token (tránh " " hoặc undefined)
  const token = (init.token || "").trim();

  // ✅ DEBUG: kiểm tra token có được inject hay không
  // (đúng cái bạn đang cần: xem request nào bị 401 vì thiếu token)
  console.log("[apiFetch]", path, "hasToken=", Boolean(token));

  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    // Nếu bạn không dùng cookie thì nên bỏ để tránh CORS/cookie side-effects
    // Giữ lại nếu backend dùng cookie/session song song
    credentials: "include",
  });

  if (!res.ok) {
    const raw = await readText(res);
    // ✅ DEBUG: log status + raw
    console.warn("[apiFetch][ERR]", path, res.status, raw || res.statusText);

    throw {
      status: res.status,
      message: raw || res.statusText,
      raw,
    } as ApiError;
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  const text = await readText(res);
  if (!text) return {} as T;

  return safeJsonParse<T>(text);
}
