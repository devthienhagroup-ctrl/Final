import type { Lang, LeadBookPayload, LeadTalkPayload } from "./types";
import type { CmsPageRes } from "../types/cms";

const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ?? "http://localhost:8090";

async function readJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function fetchLanding(lang: Lang): Promise<CmsPageRes> {
  const url = `${API_BASE}/public/pages/landing?lang=${encodeURIComponent(lang)}`;
  const res = await fetch(url, { method: "GET" });
  return readJson<CmsPageRes>(res);
}

export async function postLeadBook(payload: LeadBookPayload) {
  const url = `${API_BASE}/public/leads/book`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return readJson<any>(res);
}

export async function postLeadTalk(payload: LeadTalkPayload) {
  const url = `${API_BASE}/public/leads/talk`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return readJson<any>(res);
}
