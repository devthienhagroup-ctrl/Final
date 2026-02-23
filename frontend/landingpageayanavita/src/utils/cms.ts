import type { CmsPage, CmsPageRes, CmsSection, CmsSectionKey } from "../types/cms";

export function normalizeCmsPage(res: CmsPageRes | null | undefined): CmsPage | null {
  if (!res) return null;

  const sections = Array.isArray(res.sections) ? [...res.sections] : [];
  sections.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const byKey: Partial<Record<CmsSectionKey, CmsSection>> = {};
  for (const s of sections) {
    if (s?.key) byKey[s.key] = s;
  }

  return { ...res, sections, byKey };
}
