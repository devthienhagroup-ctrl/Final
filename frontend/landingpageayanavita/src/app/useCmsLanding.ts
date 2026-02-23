import { useEffect, useMemo, useState } from "react";
import type { CmsPage, CmsPageRes } from "../types/cms";
import { normalizeCmsPage } from "../utils/cms";
import { fetchLanding } from "./api";
import type { Lang } from "./types";

export function useCmsLanding() {
  const [lang, setLang] = useState<Lang>("vi");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<CmsPage | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    fetchLanding(lang)
      .then((res: CmsPageRes) => {
        if (!alive) return;
        setPage(normalizeCmsPage(res));
      })
      .catch((e) => {
        if (!alive) return;
        setError(String(e?.message ?? e ?? "Failed to fetch"));
        setPage(null);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [lang]);

  const byKey = useMemo(() => page?.byKey ?? {}, [page]);

  return { lang, setLang, loading, error, page, byKey };
}
