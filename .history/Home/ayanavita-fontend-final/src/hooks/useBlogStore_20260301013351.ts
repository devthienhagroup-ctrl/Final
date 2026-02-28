import { useCallback, useEffect, useMemo, useState } from "react";
import { http } from "../api/http";
import type { BlogFilter, BlogPost } from "../shared/blog.types";
import { getSavedIds, setSavedIds, toggleSaved } from "../shared/blog.store";

type PublicBlogItem = {
  id: number;
  title: string;
  summary?: string | null;
  content: string;
  coverImage?: string | null;
  tags?: string[];
  views: number;
  publishedAt?: string | null;
  createdAt: string;
  author?: { name?: string | null };
};

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1400&q=80";

function mapTag(tag?: string): BlogPost["tag"] {
  if (tag === "skincare" || tag === "massage" || tag === "wellness" || tag === "franchise") return tag;
  return "wellness";
}

function mapPost(item: PublicBlogItem): BlogPost {
  return {
    id: String(item.id),
    title: item.title,
    tag: mapTag(item.tags?.[0]),
    author: item.author?.name || "Ayanavita",
    date: (item.publishedAt || item.createdAt || "").slice(0, 10),
    views: item.views || 0,
    img: item.coverImage || DEFAULT_IMAGE,
    excerpt: item.summary || item.content?.slice(0, 140) || "",
    body: (item.content || "").split(/\n{2,}/).filter(Boolean),
  };
}

export function useBlogStore() {
  const [filter, setFilter] = useState<BlogFilter>({ q: "", tag: "all", sort: "new" });
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [savedIds, setSavedIdsState] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize] = useState(9);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await http.get<{ items: PublicBlogItem[]; total: number }>("/blogs/public", {
        params: {
          q: filter.q || undefined,
          tag: filter.tag === "all" ? undefined : filter.tag,
          sort: filter.sort,
          page,
          pageSize,
        },
      });

      setPosts((res.data.items || []).map(mapPost));
      setTotal(res.data.total || 0);
      setSavedIdsState(new Set(getSavedIds()));
    } finally {
      setLoading(false);
    }
  }, [filter.q, filter.tag, filter.sort, page, pageSize]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = useMemo(() => posts, [posts]);
  const stats = useMemo(() => ({ posts: total, saved: savedIds.size }), [total, savedIds.size]);

  const toggleSave = useCallback((id: string) => {
    const next = toggleSaved(id);
    setSavedIdsState(new Set(Array.from(next)));
  }, []);

  const clearSaved = useCallback(() => {
    setSavedIds([]);
    setSavedIdsState(new Set());
  }, []);

  const resetFilter = useCallback(() => {
    setFilter({ q: "", tag: "all", sort: "new" });
    setPage(1);
  }, []);

  return {
    filter,
    setFilter,
    resetFilter,
    posts,
    filtered,
    savedIds,
    toggleSave,
    clearSaved,
    refresh,
    stats,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    setPage,
    loading,
  };
}
