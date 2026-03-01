import { API_BASE } from "../env";
import { api } from "../lib/http";

export type BlogStatus = "DRAFT" | "PUBLISHED";

export type BlogAdminItem = {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  coverImage: string | null;
  tags: string[];
  status: BlogStatus;
  views: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author?: { id: number; name: string | null; email?: string | null };
};

export type BlogListResponse = {
  page: number;
  pageSize: number;
  total: number;
  items: BlogAdminItem[];
};

export type BlogFormPayload = {
  title: string;
  summary: string;
  content: string;
  tags: string[];
  status: BlogStatus;
  coverImage?: string;
};

export async function adminListBlogs(params: {
  page: number;
  pageSize: number;
  q?: string;
  status?: BlogStatus | "";
}) {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("pageSize", String(params.pageSize));
  if (params.q) query.set("q", params.q);
  if (params.status) query.set("status", params.status);
  return api<BlogListResponse>(`/blogs/admin?${query.toString()}`);
}

export async function adminDeleteBlog(id: number) {
  return api<{ ok: boolean }>(`/blogs/admin/${id}`, { method: "DELETE" });
}

export async function adminCleanupViewTrackers() {
  return api<{ ok: boolean }>("/blogs/admin/view-trackers/cleanup", { method: "POST" });
}

async function blogMultipartRequest(id: number | null, payload: BlogFormPayload, coverImageFile?: File) {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("summary", payload.summary);
  formData.append("content", payload.content);
  formData.append("status", payload.status);
  payload.tags.forEach((tag) => formData.append("tags", tag));

  if (payload.coverImage) {
    formData.append("coverImage", payload.coverImage);
  }

  if (coverImageFile) {
    formData.append("coverImageFile", coverImageFile);
  }

  const token = localStorage.getItem("aya_admin_token") || "";
  const endpoint = id == null ? "/blogs/admin" : `/blogs/admin/${id}`;
  const method = id == null ? "POST" : "PATCH";

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  if (!res.ok) {
    throw new Error((await res.text()) || "Blog request failed");
  }

  return (await res.json()) as BlogAdminItem;
}

export async function adminCreateBlog(payload: BlogFormPayload, coverImageFile?: File) {
  return blogMultipartRequest(null, payload, coverImageFile);
}

export async function adminUpdateBlog(id: number, payload: BlogFormPayload, coverImageFile?: File) {
  return blogMultipartRequest(id, payload, coverImageFile);
}
