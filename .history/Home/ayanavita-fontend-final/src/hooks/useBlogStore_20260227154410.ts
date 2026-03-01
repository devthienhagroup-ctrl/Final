import { useCallback, useEffect, useMemo, useState } from "react";
import type { BlogFilter, BlogPost } from "../shared/blog.types";
import {
  applyFilter,
  ensureSeed,
  getPosts,
  getSavedIds,
  toggleSaved,
} from "../shared/blog.store";

export function useBlogStore() {
  const [filter, setFilter] = useState<BlogFilter>({ q: "", tag: "all", sort: "new" });
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(() => {
    ensureSeed();
    const p = getPosts();
    setPosts(p);
    setSavedIds(new Set(getSavedIds()));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => applyFilter(posts, filter), [posts, filter]);
  const stats = useMemo(() => ({ posts: posts.length, saved: savedIds.size }), [posts.length, savedIds.size]);

  const toggleSave = useCallback((id: string) => {
    const next = toggleSaved(id);
    setSavedIds(new Set(Array.from(next)));
  }, []);

  const resetFilter = useCallback(() => {
    setFilter({ q: "", tag: "all", sort: "new" });
  }, []);

  return {
    filter,
    setFilter,
    resetFilter,
    posts,
    filtered,
    savedIds,
    toggleSave,
    refresh,
    stats,
  };
}
