import React, { useEffect, useMemo, useState } from "react";

import { getLanding, sectionsToMap, type Lang } from "../api/cms.public";
import LandingView from "../components/LandingView";

export default function LandingPage() {
  const [lang, setLang] = useState<Lang>("vi");
  const [raw, setRaw] = useState<any>(null);
  const [err, setErr] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    setErr("");
    setLoading(true);

    getLanding("landing", lang)
      .then((res) => {
        if (!mounted) return;
        setRaw(res);
      })
      .catch((e) => {
        if (!mounted) return;
        setErr(e?.message || "Load failed");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [lang]);

  // map { hero, about, cards, ... } -> byKey format mà LandingView dùng
  const byKey = useMemo(() => {
    const map = raw?.sections ? sectionsToMap(raw.sections) : null;
    if (!map) return null;

    // LandingView đang đọc byKey[key].data
    return Object.fromEntries(Object.entries(map).map(([k, data]) => [k, { data }])) as any;
  }, [raw]);

  return (
    <LandingView
      lang={lang}
      setLang={setLang}
      loading={loading}
      error={err}
      byKey={byKey}
    />
  );
}
