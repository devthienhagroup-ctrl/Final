// app/admin/src/api/leads.api.ts
import { apiFetch } from "./client";

export type LeadType = "book" | "talk";

export type LeadRow = {
  id: number;
  type: LeadType;

  name?: string | null;
  phone?: string | null;
  contact?: string | null;

  topic?: string | null;
  message?: string | null;

  date?: string | null;
  time?: string | null;

  note?: string | null;
  createdAt?: string;
  lang?: string | null;
};

/**
 * GIẢ ĐỊNH endpoint đúng là:
 * GET /admin/cms/leads?type=book
 *
 * Nếu backend bạn đang là /admin/leads hoặc /admin/cms-admin/leads...
 * thì chỉ cần đổi BASE phía dưới.
 */
const BASE = "/admin/cms";

/** GET /admin/cms/leads?type=book|talk */
export async function adminListLeads(token: string, type: LeadType) {
  const qs = new URLSearchParams({ type }).toString();
  return apiFetch<LeadRow[]>(`${BASE}/leads?${qs}`, { method: "GET", token });
}
