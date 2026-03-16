import { apiFetch } from "./client";

export type ContactInquiryReply = {
  id: number;
  subject: string;
  content: string;
  staffEmail: string | null;
  createdAt: string;
};

export type ContactInquiry = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  need: string | null;
  note: string | null;
  ipAddress: string;
  userAgent: string | null;
  status: "new" | "replied" | string;
  createdAt: string;
  replies: ContactInquiryReply[];
};

export type ContactInquiryListResponse = {
  items: ContactInquiry[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export async function adminListContactInquiries(token: string, params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  return apiFetch<ContactInquiryListResponse>(`/admin/cms/contacts${qs ? `?${qs}` : ""}`, { method: "GET", token });
}

export async function adminReplyContactInquiry(token: string, id: number, payload: { subject: string; content: string; toEmail?: string }) {
  return apiFetch<{ ok: boolean }>(`/admin/cms/contacts/${id}/reply`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}
