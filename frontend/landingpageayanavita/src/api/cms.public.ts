import { apiFetch } from "./client";


export type Lang = "vi" | "en" | "de";
export type CmsSectionKey = "hero" | "about" | "cards" | "cta" | "footer";

export type CmsSection = {
  id: number;
  key: CmsSectionKey;
  sortOrder: number;
  data: any;
  publishedAt: string | null;
};

export type CmsLandingRes = {
  slug: string;
  title: string;
  sections: CmsSection[];
};

/** API thật của bạn trả đúng JSON này */
export async function getLanding(slug: string = "landing", lang?: Lang) {
  const qs = new URLSearchParams();
  if (lang) qs.set("lang", lang);
  const q = qs.toString();
  // ✅ sửa path đúng với backend bạn đang chạy:
  // ví dụ backend đang trả JSON khi call /public/pages/landing?lang=vi
  return apiFetch<CmsLandingRes>(`/public/pages/${encodeURIComponent(slug)}${q ? `?${q}` : ""}`, {
    method: "GET",
  });
}

/** Helper: map sections -> object by key */
export function sectionsToMap(sections: CmsSection[]) {
  const ordered = [...sections].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const map = {} as Record<CmsSectionKey, any>;
  for (const s of ordered) map[s.key] = s.data;
  return map;
}
