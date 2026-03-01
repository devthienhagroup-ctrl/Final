import React, { useEffect, useMemo, useState } from "react";
import "../styles/blog.css";

import {http} from "../api/http";

import { BlogTopStrip } from "../components/blog/BlogTopStrip";
import { BlogHeader } from "../components/blog/BlogHeader";
import { BlogHero } from "../components/blog/BlogHero";
import { BlogTopics } from "../components/blog/BlogTopics";
import { BlogGrid } from "../components/blog/BlogGrid";
import { BlogNewsletter } from "../components/blog/BlogNewsletter";
import { BlogFooter } from "../components/blog/BlogFooter";
import { BlogReadModal } from "../components/blog/BlogReadModal";
import {BlogSavedModal} from "../components/blog/BlogSavedModal";

import { useBlogStore } from "../hooks/useBlogStore";
import type { BlogPost } from "../shared/blog.types";
import {Header} from "../components/layout/Header";
import {Footer} from "../components/layout/Footer";

export default function BlogPage() {
    const store = useBlogStore();

    const [mobileOpen, setMobileOpen] = useState(false);

    const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
        return localStorage.getItem("preferred-language") || "vi";
    });

    const [blogData, setBlogData] = useState<any>(null);

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

    // Lắng nghe sự kiện thay đổi ngôn ngữ
    useEffect(() => {
        const handleLanguageChange = (event: CustomEvent) => {
            setCurrentLanguage(event.detail.language);
        };

        window.addEventListener("languageChange", handleLanguageChange as EventListener);
        return () => {
            window.removeEventListener("languageChange", handleLanguageChange as EventListener);
        };
    }, []);

    // Gọi API CMS theo ngôn ngữ và gán vào blogData
    useEffect(() => {
        let cancelled = false;

        const fetchCmsBlog = async () => {
            try {
                const res = await http.get(`/public/pages/blog?lang=${currentLanguage}`);
                if (!cancelled) setBlogData(res.data);
            } catch (e) {
                if (!cancelled) setBlogData(null);
            }
        };

        fetchCmsBlog();

        return () => {
            cancelled = true;
        };
    }, [currentLanguage]);


    return (
        <div className="text-slate-900 bg-slate-50 min-h-screen">

            <BlogHero
                cmsData={blogData?.sections[0]?.data}
                stats={store.stats}
                filter={store.filter}
                onChange={(patch) => store.setFilter((prev) => ({ ...prev, ...patch }))}
                onApply={() => store.refresh()}
                onReset={() => { store.resetFilter(); store.refresh(); }}
            />

            <BlogTopics
                cmsData={blogData?.sections[1]?.data}
                onQuick={(tag) => {
                    store.setFilter((prev) => ({ ...prev, q: "", tag, sort: "new" }));
                    store.refresh();
                    window.location.hash = "#topics";
                }}
                onOpenSaved={openSaved}
                activeTag={store.filter.tag}
            />

            <BlogGrid
                cmsData={blogData?.sections[2]?.data}
                posts={store.filtered}
                savedIds={store.savedIds}
                onRead={openRead}
                onToggleSave={(id) => store.toggleSave(id)}
                onReset={() => { store.resetFilter(); store.refresh(); }}
            />

            <BlogNewsletter
                cmsData={blogData?.sections[3]?.data}
            />

            {/* Modals */}
            <BlogReadModal
                cmsData={blogData?.sections[4]?.data}
                open={!!reading}
                post={reading}
                savedOn={!!(readId && store.savedIds.has(readId))}
                onClose={closeRead}
                onToggleSave={() => { if (readId) store.toggleSave(readId); }}
            />

            <BlogSavedModal
                cmsData={blogData?.sections[5]?.data}
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
