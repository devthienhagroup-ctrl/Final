import React, { useEffect, useMemo, useState } from "react";
import "../styles/blog.css";

import { BlogTopStrip } from "../components/blog/BlogTopStrip";
import { BlogHeader } from "../components/blog/BlogHeader";
import { BlogHero } from "../components/blog/BlogHero";
import { BlogTopics } from "../components/blog/BlogTopics";
import { BlogGrid } from "../components/blog/BlogGrid";
import { BlogNewsletter } from "../components/blog/BlogNewsletter";
import { BlogFooter } from "../components/blog/BlogFooter";
import { BlogReadModal } from "../components/blog/BlogReadModal";
import { BlogSavedModal } from "../components/blog/BlogSavedModal";

import { useBlogStore } from "../hooks/useBlogStore";
import type { BlogPost } from "../shared/blog.types";

export default function BlogPage() {
  const store = useBlogStore();

  const [mobileOpen, setMobileOpen] = useState(false);

  const [readId, setReadId] = useState<string | null>(null);
  const [savedOpen, setSavedOpen] = useState(false);

  const postMap = useMemo(() => new Map(store.posts.map((p) => [p.id, p])), [store.posts]);
  const reading: BlogPost | null = readId ? postMap.get(readId) || null : null;

  const openRead = (id: string) => {
    setReadId(id);
    document.body.style.overflow = "hidden";
  };
  const closeRead = () => {
    setReadId(null);
    document.body.style.overflow = "";
  };

  const openSaved = () => {
    setSavedOpen(true);
    document.body.style.overflow = "hidden";
  };
  const closeSaved = () => {
    setSavedOpen(false);
    document.body.style.overflow = "";
  };

  // ESC global (đóng modals)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (readId) closeRead();
      if (savedOpen) closeSaved();
      setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readId, savedOpen]);

  return (
    <div className="text-slate-900 bg-slate-50 min-h-screen">
      <BlogTopStrip />

      <BlogHeader
        mobileOpen={mobileOpen}
        onToggleMobile={() => setMobileOpen((v) => !v)}
        onOpenSaved={openSaved}
      />

      <BlogHero
        stats={store.stats}
        filter={store.filter}
        onChange={(patch) => store.setFilter((prev) => ({ ...prev, ...patch }))}
        onApply={() => store.refresh()}
        onReset={() => { store.resetFilter(); store.refresh(); }}
      />

      <BlogTopics
        onQuick={(tag) => {
          store.setFilter((prev) => ({ ...prev, q: "", tag, sort: "new" }));
          store.refresh();
          window.location.hash = "#topics";
        }}
      />

      <BlogGrid
        posts={store.filtered}
        savedIds={store.savedIds}
        onRead={openRead}
        onToggleSave={(id) => store.toggleSave(id)}
        onReset={() => { store.resetFilter(); store.refresh(); }}
      />

      <BlogNewsletter />
      <BlogFooter onOpenSaved={openSaved} />

      {/* Modals */}
      <BlogReadModal
        open={!!reading}
        post={reading}
        savedOn={!!(readId && store.savedIds.has(readId))}
        onClose={closeRead}
        onToggleSave={() => { if (readId) store.toggleSave(readId); }}
      />

      <BlogSavedModal
        open={savedOpen}
        savedIds={store.savedIds}
        posts={store.posts}
        onClose={closeSaved}
        onClear={() => {
          if (!confirm("Xoá toàn bộ bài đã lưu?")) return;
          localStorage.setItem("aya_blog_saved_v1", "[]");
          store.refresh();
        }}
        onToggleSave={(id) => store.toggleSave(id)}
        onRead={(id) => { closeSaved(); openRead(id); }}
      />
    </div>
  );
}
