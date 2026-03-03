// app/admin/src/api/cms.api.ts
import { apiFetch } from "./client";
import { API_BASE } from "../env";

/** Align với Prisma enum nếu có, ở UI giữ union là đủ */
export type CmsLocale = "vi" | "en" | "de";

/** Theo schema hiện tại của UI (tuỳ bạn mở rộng) */
export type CmsSectionKey = "hero" | "about" | "cards" | "cta" | "footer";

/** List pages */
export type CmsPageLite = {
  id: number;
  slug: string;
  title: string;
  isActive?: boolean;
  updatedAt?: string;
};

/** Locale payload trong section */
export type CmsSectionLocale = {
  id: number;
  locale: CmsLocale;
  status: string; // DRAFT | PUBLISHED | ...
  draftData: any;
  publishedData: any;
  publishedAt: string | null;
  updatedAt?: string;
};

/** Section */
export type CmsSection = {
  id: number;
  key: CmsSectionKey;
  sortOrder: number;
  locales: CmsSectionLocale[];
};

/** Page detail */
export type CmsPageDetail = {
  id: number;
  slug: string;
  title: string;
  sections: CmsSection[];
};

export type SaveDraftDto = {
  draftData: any;
  note?: string;
};

export type RestoreDto = {
  versionId: number;
};

export type OkRes = { ok: boolean };
export type CmsUploadedImage = { fileName: string; url: string; size: number };

const BASE = "/admin/cms";

/** GET /admin/cms/pages */
export async function adminListPages(token: string) {
  return apiFetch<CmsPageLite[]>(`${BASE}/pages`, { method: "GET", token });
}

/** GET /admin/cms/pages/:slug */
export async function adminGetPage(token: string, slug: string) {
  return apiFetch<CmsPageDetail>(`${BASE}/pages/${encodeURIComponent(slug)}`, {
    method: "GET",
    token,
  });
}

/**
 * PUT /admin/cms/sections/:id/draft?locale=vi
 * Body: { draftData, note? }
 */
export async function adminSaveDraft(
  
  token: string,
  sectionId: number,
  locale: CmsLocale,
  draftData: any,
  note?: string,
) {
  console.trace("[TRACE] adminSaveDraft called");
  const qs = new URLSearchParams({ locale }).toString();
  const body: SaveDraftDto = { draftData, ...(note ? { note } : {}) };

  return apiFetch<OkRes>(`${BASE}/sections/${sectionId}/draft?${qs}`, {
    method: "PUT",
    token,
    body: JSON.stringify(body),
  });
}

/** POST /admin/cms/sections/:id/publish?locale=vi */
export async function adminPublish(token: string, sectionId: number, locale: CmsLocale) {
  const qs = new URLSearchParams({ locale }).toString();
  return apiFetch<OkRes>(`${BASE}/sections/${sectionId}/publish?${qs}`, {
    method: "POST",
    token,
  });
}

/** POST /admin/cms/sections/:id/unpublish?locale=vi */
export async function adminUnpublish(token: string, sectionId: number, locale: CmsLocale) {
  const qs = new URLSearchParams({ locale }).toString();
  return apiFetch<OkRes>(`${BASE}/sections/${sectionId}/unpublish?${qs}`, {
    method: "POST",
    token,
  });
}

/** GET /admin/cms/sections/:id/versions?locale=vi */
export async function adminListVersions(token: string, sectionId: number, locale: CmsLocale) {
  const qs = new URLSearchParams({ locale }).toString();
  return apiFetch<any[]>(`${BASE}/sections/${sectionId}/versions?${qs}`, {
    method: "GET",
    token,
  });
}

/** POST /admin/cms/sections/:id/restore?locale=vi  Body: { versionId } */
export async function adminRestore(
  token: string,
  sectionId: number,
  locale: CmsLocale,
  versionId: number,
) {
  const qs = new URLSearchParams({ locale }).toString();
  const body: RestoreDto = { versionId };

  return apiFetch<OkRes>(`${BASE}/sections/${sectionId}/restore?${qs}`, {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
  
}

export async function adminUploadCmsImage(token: string, file: File): Promise<CmsUploadedImage> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}${BASE}/images/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error((await res.text()) || "Upload image failed");
  }

  return (await res.json()) as CmsUploadedImage;
}

export async function adminDeleteCmsImage(token: string, url: string): Promise<OkRes> {
  return apiFetch<OkRes>(`${BASE}/images`, {
    method: "DELETE",
    token,
    body: JSON.stringify({ url }),
  });
}
// ===== extra endpoints (optional) =====
export type PatchPageDto = { isActive?: boolean; title?: string };

export async function adminPatchPage(token: string, pageId: number, dto: PatchPageDto) {
  // đề xuất endpoint: PATCH /admin/cms/pages/:id
  return apiFetch<OkRes>(`${BASE}/pages/${pageId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(dto),
  });
}

export async function adminDuplicatePage(token: string, pageId: number) {
  // đề xuất endpoint: POST /admin/cms/pages/:id/duplicate
  return apiFetch<{ ok: boolean; newId?: number; newSlug?: string }>(`${BASE}/pages/${pageId}/duplicate`, {
    method: "POST",
    token,
  });
}

// cms.api.ts
export function adminGetPublicPageUrl(slug: string, lang?: string) {
  const qs = lang ? `?lang=${encodeURIComponent(lang)}` : "";
  return `http://localhost:5174/public/pages/${encodeURIComponent(slug)}${qs}`;
}
