import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    adminListPages,
    adminPatchPage,
    type CmsPageLite,
} from "../api/cms.api";
import { useAuth } from "../../app/auth";
import { useToast } from "../components/Toast";

type SortKey = "slug" | "title" | "updatedAt";
type SortDir = "asc" | "desc";
type ViewMode = "table" | "cards";

function fmtDate(s?: string) {
    if (!s) return "";
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleString();
}

function cmp(a: string, b: string) {
    return a.localeCompare(b, undefined, { sensitivity: "base" });
}


function getPageInitial(title?: string, slug?: string) {
    const source = (title || slug || "P").trim();
    return source.charAt(0).toUpperCase();
}

function getPageMeta(r: CmsPageLite) {
    const active = (r.isActive ?? true) === true;
    const title = (r.title || "Untitled page").trim();
    const slug = (r.slug || "").trim();
    return {
        active,
        title,
        slug,
        subtitle: `/${slug || "-"}`,
        updatedText: fmtDate(r.updatedAt) || "Chưa có dữ liệu",
    };
}

export function CmsPagesPage() {
    const { token } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();

    const [rows, setRows] = useState<CmsPageLite[]>([]);
    const [loading, setLoading] = useState(true);

    const [q, setQ] = useState("");
    const [onlyActive, setOnlyActive] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>("table");

    const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
    const [sortDir, setSortDir] = useState<SortDir>("desc");

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    const [busyId, setBusyId] = useState<number | null>(null);

    async function load() {
        setLoading(true);
        try {
            const data = await adminListPages(token);
            setRows(Array.isArray(data) ? data : []);
        } catch (e: unknown) {
            const detail = e instanceof Error ? e.message : String(e);
            toast.push({ kind: "err", title: "Load pages failed", detail });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function toggleSort(key: SortKey) {
        if (sortKey !== key) {
            setSortKey(key);
            setSortDir("asc");
            return;
        }
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    }

    const pinnedSlug = "landing";

    const filtered = useMemo(() => {
        const keyword = q.trim().toLowerCase();
        let list = rows;

        if (onlyActive) list = list.filter((r) => (r.isActive ?? true) === true);

        if (keyword) {
            list = list.filter((r) => {
                const slug = (r.slug || "").toLowerCase();
                const title = (r.title || "").toLowerCase();
                return slug.includes(keyword) || title.includes(keyword);
            });
        }

        const dir = sortDir === "asc" ? 1 : -1;

        const sorted = [...list].sort((a, b) => {
            if (sortKey === "slug") return dir * cmp(a.slug || "", b.slug || "");
            if (sortKey === "title") return dir * cmp(a.title || "", b.title || "");
            const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            return dir * (ta - tb);
        });

        const idx = sorted.findIndex((x) => x.slug === pinnedSlug);
        if (idx > 0) {
            const [pin] = sorted.splice(idx, 1);
            sorted.unshift(pin);
        }
        return sorted;
    }, [rows, q, onlyActive, sortKey, sortDir]);

    useEffect(() => {
        setPage(1);
    }, [q, onlyActive, pageSize, sortKey, sortDir]);

    const total = rows.length;
    const shown = filtered.length;
    const totalPages = Math.max(1, Math.ceil(shown / pageSize));
    const pageClamped = Math.min(page, totalPages);
    const start = (pageClamped - 1) * pageSize;
    const paged = filtered.slice(start, start + pageSize);

    const pinned = useMemo(() => rows.find((x) => x.slug === pinnedSlug) || null, [rows]);

    const activeCount = useMemo(
        () => rows.filter((r) => (r.isActive ?? true) === true).length,
        [rows]
    );
    const hiddenCount = Math.max(0, rows.length - activeCount);
    const landingUpdated = pinned?.updatedAt ? fmtDate(pinned.updatedAt) : "Chưa cập nhật";

    async function onToggleActive(r: CmsPageLite) {
        if (!r.id) {
            toast.push({ kind: "err", title: "Cannot toggle", detail: "Page missing id" });
            return;
        }

        const next = !((r.isActive ?? true) === true);
        setBusyId(r.id);
        try {
            await adminPatchPage(token, r.id, { isActive: next });
            toast.push({ kind: "ok", title: "Updated", detail: `isActive = ${String(next)}` });
            setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, isActive: next } : x)));
        } catch (e: unknown) {
            const detail =
                e instanceof Error
                    ? e.message
                    : "Backend chưa có endpoint PATCH /admin/cms/pages/:id.";
            toast.push({ kind: "err", title: "Toggle active failed", detail });
        } finally {
            setBusyId(null);
        }
    }


    function renderRowActions(r: CmsPageLite) {
        return (
            <div className="x-actions">
                <Link className="x-btn x-btn-primary" to={`/admin/cms/pages/${encodeURIComponent(r.slug)}`}>
                    Edit
                </Link>
            </div>
        );
    }

    return (
        <div className="x-wrap">
            <section className="x-hero">
                <div className="x-hero-copy">
                    <div className="x-hero-badges">
                        <span className="x-pill x-pill-info">CMS Pages</span>
                        <span className="x-pill">{shown}/{total} trang</span>
                    </div>
                    <h1 className="x-title">Quản lý trang CMS</h1>
                    <p className="x-subtitle">
                        Tập trung vào tìm nhanh, nhìn rõ trạng thái, và thao tác sửa trang gọn hơn để đỡ mỏi mắt khi làm nội dung.
                    </p>
                </div>

                <div className="x-hero-actions">
                    <button className="x-btn" onClick={() => navigate(-1)}>
                        Quay lại
                    </button>
                    <button className="x-btn x-btn-primary" onClick={load} disabled={loading}>
                        {loading ? "Đang tải..." : "Làm mới danh sách"}
                    </button>
                </div>
            </section>

            <section className="x-stats-grid">
                <article className="x-stat-card">
                    <div className="x-stat-label">Tổng số page</div>
                    <div className="x-stat-value">{total}</div>
                    <div className="x-stat-note">Tất cả trang nội dung hiện có</div>
                </article>
                <article className="x-stat-card">
                    <div className="x-stat-label">Đang active</div>
                    <div className="x-stat-value">{activeCount}</div>
                    <div className="x-stat-note">Đang được phép hiển thị public</div>
                </article>
                <article className="x-stat-card">
                    <div className="x-stat-label">Đang ẩn</div>
                    <div className="x-stat-value">{hiddenCount}</div>
                    <div className="x-stat-note">Có thể bật lại bất kỳ lúc nào</div>
                </article>
                <article className="x-stat-card x-stat-card-soft">
                    <div className="x-stat-label">Landing page</div>
                    <div className="x-stat-value x-stat-value-sm">{pinned ? pinned.title || "landing" : "Chưa có"}</div>
                    <div className="x-stat-note">Cập nhật gần nhất: {landingUpdated}</div>
                </article>
            </section>

            {pinned ? (
                <section className="x-feature-card">
                    <div className="x-feature-left">
                        <div className="x-feature-icon">✦</div>
                        <div>
                            <div className="x-feature-kicker">Trang ghim ưu tiên</div>
                            <div className="x-feature-title">Landing page</div>
                            <div className="x-feature-desc">
                                <code className="x-code">{pinned.slug}</code>
                                <span className="x-sep">•</span>
                                <span>{pinned.title}</span>
                            </div>
                        </div>
                    </div>

                    <div className="x-actions x-actions-wrap">
                        <Link className="x-btn x-btn-primary" to={`/admin/cms/pages/${encodeURIComponent(pinned.slug)}`}>
                            Sửa landing
                        </Link>
                    </div>
                </section>
            ) : null}

            <section className="x-panel">
                <div className="x-panel-top">
                    <div className="x-search-block">
                        <label className="x-label">Tìm trang</label>
                        <div className="x-search">
              <span className="x-search-icon" aria-hidden="true">
                ⌕
              </span>
                            <input
                                className="x-input"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Tìm theo slug hoặc title..."
                            />
                            {q ? (
                                <button className="x-search-clear" type="button" onClick={() => setQ("")} aria-label="Clear">
                                    ✕
                                </button>
                            ) : null}
                        </div>
                    </div>

                    <div className="x-inline-tools">
                        <label className="x-check-card">
                            <span className="x-label">Bộ lọc</span>
                            <span className="x-check-row">
                <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} />
                <span>Chỉ hiển thị page active</span>
              </span>
                        </label>

                        <div className="x-toggle-card">
                            <span className="x-label">Hiển thị</span>
                            <div className="x-segmented">
                                <button
                                    className={`x-segment ${viewMode === "table" ? "x-segment-on" : ""}`}
                                    type="button"
                                    onClick={() => setViewMode("table")}
                                >
                                    Bảng
                                </button>
                                <button
                                    className={`x-segment ${viewMode === "cards" ? "x-segment-on" : ""}`}
                                    type="button"
                                    onClick={() => setViewMode("cards")}
                                >
                                    Cards
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="x-panel-toolbar">
                    <div className="x-toolbar-group">
                        <span className="x-toolbar-label">Sắp xếp</span>
                        <button className={`x-chip ${sortKey === "updatedAt" ? "x-chip-on" : ""}`} onClick={() => toggleSort("updatedAt")}>
                            Updated {sortKey === "updatedAt" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                        </button>
                        <button className={`x-chip ${sortKey === "slug" ? "x-chip-on" : ""}`} onClick={() => toggleSort("slug")}>
                            Slug {sortKey === "slug" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                        </button>
                        <button className={`x-chip ${sortKey === "title" ? "x-chip-on" : ""}`} onClick={() => toggleSort("title")}>
                            Title {sortKey === "title" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                        </button>
                    </div>

                    <div className="x-toolbar-meta">
                        <span className="x-soft-pill">Hiển thị {shown} kết quả</span>
                        <span className="x-soft-pill">Page {pageClamped}/{totalPages}</span>
                    </div>
                </div>

                {viewMode === "table" ? (
                    <div className="x-table-wrap">
                        <table className="x-table">
                            <thead>
                            <tr>
                                <th style={{ width: 84 }}>Page</th>
                                <th style={{ width: 210 }} onClick={() => toggleSort("slug")} className="x-th-sort">
                                    Slug {sortKey === "slug" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                                </th>
                                <th onClick={() => toggleSort("title")} className="x-th-sort">
                                    Title {sortKey === "title" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                                </th>
                                <th style={{ width: 130 }}>Status</th>
                                <th style={{ width: 220 }} onClick={() => toggleSort("updatedAt")} className="x-th-sort">
                                    Updated {sortKey === "updatedAt" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                                </th>
                                <th style={{ width: 360, textAlign: "right" }}>Quick actions</th>
                            </tr>
                            </thead>

                            <tbody>
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={i}>
                                        <td><div className="sk skAvatar" /></td>
                                        <td><div className="sk sk1" /></td>
                                        <td><div className="sk sk2" /></td>
                                        <td><div className="sk sk3" /></td>
                                        <td><div className="sk sk4" /></td>
                                        <td style={{ textAlign: "right" }}><div className="sk skBtn" /></td>
                                    </tr>
                                ))
                            ) : paged.length ? (
                                paged.map((r) => {
                                    const meta = getPageMeta(r);
                                    const isLanding = r.slug === pinnedSlug;
                                    return (
                                        <tr key={r.slug}>
                                            <td>
                                                <div className="x-avatar">{getPageInitial(r.title, r.slug)}</div>
                                            </td>
                                            <td>
                                                <div className="x-code-row">
                                                    <code className="x-code">{meta.slug}</code>
                                                    {isLanding ? <span className="x-badge x-badge-landing-sm">Landing</span> : null}
                                                </div>
                                            </td>
                                            <td className="x-title-cell">
                                                <div className="x-t1">{meta.title}</div>
                                                <div className="x-t2 muted">{meta.subtitle}</div>
                                            </td>
                                            <td>
                          <span className={`x-badge ${meta.active ? "x-badge-ok" : "x-badge-off"}`}>
                            {meta.active ? "ACTIVE" : "DISABLED"}
                          </span>
                                            </td>
                                            <td className="muted">{meta.updatedText}</td>
                                            <td style={{ textAlign: "right" }}>{renderRowActions(r)}</td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6}>
                                        <div className="x-empty">
                                            <div className="x-empty-title">Không có dữ liệu phù hợp.</div>
                                            <div className="x-empty-desc muted">
                                                {total === 0 ? "Chưa có page nào hoặc endpoint đang trả về rỗng." : "Thử xoá filter, đổi keyword hoặc làm mới danh sách."}
                                            </div>
                                            <div style={{ marginTop: 12 }}>
                                                <button className="x-btn" onClick={load}>Làm mới</button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="x-cards-grid">
                        {loading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <article key={i} className="x-page-card x-page-card-skeleton">
                                    <div className="sk skAvatarLg" />
                                    <div className="sk sk1" />
                                    <div className="sk sk2" />
                                    <div className="sk sk4" />
                                    <div className="sk skBtnWide" />
                                </article>
                            ))
                        ) : paged.length ? (
                            paged.map((r) => {
                                const meta = getPageMeta(r);
                                const isLanding = r.slug === pinnedSlug;
                                return (
                                    <article key={r.slug} className="x-page-card">
                                        <div className="x-page-card-head">
                                            <div className="x-avatar x-avatar-lg">{getPageInitial(r.title, r.slug)}</div>
                                            <div className="x-page-card-meta">
                                                <div className="x-page-card-topline">
                          <span className={`x-badge ${meta.active ? "x-badge-ok" : "x-badge-off"}`}>
                            {meta.active ? "ACTIVE" : "DISABLED"}
                          </span>
                                                    {isLanding ? <span className="x-badge x-badge-landing-sm">Landing</span> : null}
                                                </div>
                                                <div className="x-card-title">{meta.title}</div>
                                                <div className="muted">{meta.subtitle}</div>
                                            </div>
                                        </div>

                                        <div className="x-page-card-body">
                                            <div className="x-page-card-line">
                                                <span className="x-mini-label">Slug</span>
                                                <code className="x-code">{meta.slug}</code>
                                            </div>
                                            <div className="x-page-card-line">
                                                <span className="x-mini-label">Updated</span>
                                                <span>{meta.updatedText}</span>
                                            </div>
                                        </div>

                                        {renderRowActions(r)}
                                    </article>
                                );
                            })
                        ) : (
                            <div className="x-empty-card">
                                <div className="x-empty-title">Không có dữ liệu phù hợp.</div>
                                <div className="x-empty-desc muted">Thử xoá filter hoặc đổi từ khoá tìm kiếm.</div>
                            </div>
                        )}
                    </div>
                )}

                <div className="x-pager">
                    <div className="muted">
                        Page <b>{pageClamped}</b> / {totalPages} • Showing <b>{shown === 0 ? 0 : start + 1}</b>–
                        <b>{Math.min(start + pageSize, shown)}</b> of {shown}
                    </div>

                    <div className="x-row x-row-wrap" style={{ gap: 12 }}>
                        <div className="x-row" style={{ gap: 8 }}>
                            <span className="muted">Rows:</span>
                            <select className="x-select" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                                {[12, 24, 48, 96].map((n) => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </div>

                        <div className="x-row" style={{ gap: 8 }}>
                            <button className="x-btn" onClick={() => setPage(1)} disabled={pageClamped <= 1}>⟪</button>
                            <button className="x-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pageClamped <= 1}>
                                Prev
                            </button>
                            <button
                                className="x-btn"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={pageClamped >= totalPages}
                            >
                                Next
                            </button>
                            <button className="x-btn" onClick={() => setPage(totalPages)} disabled={pageClamped >= totalPages}>⟫</button>
                        </div>
                    </div>
                </div>
            </section>

            <style>{`
        .x-wrap{
          display:grid;
          gap:14px;
          max-width:1320px;
          margin:24px auto;
          padding:0 14px 28px;
          color:#0f172a;
        }
        .x-hero,
        .x-panel,
        .x-feature-card,
        .x-stat-card{
          border:1px solid rgba(148,163,184,.18);
          box-shadow:0 18px 42px rgba(15,23,42,.07);
        }
        .x-hero{
          border-radius:24px;
          background:
            radial-gradient(circle at top right, rgba(99,102,241,.12), transparent 32%),
            radial-gradient(circle at left bottom, rgba(14,165,233,.10), transparent 28%),
            linear-gradient(180deg, rgba(255,255,255,.98), rgba(248,250,252,.96));
          padding:22px;
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
          gap:16px;
          flex-wrap:wrap;
        }
        .x-hero-copy{ max-width:760px; }
        .x-hero-badges{ display:flex; gap:10px; flex-wrap:wrap; margin-bottom:14px; }
        .x-title{ margin:0; font-size:26px; line-height:1.1; font-weight:800; letter-spacing:-.02em; }
        .x-subtitle{ margin:8px 0 0; color:#64748b; font-size:13px; line-height:1.65; max-width:760px; }
        .x-hero-actions{ display:flex; gap:10px; flex-wrap:wrap; }

        .x-stats-grid{
          display:grid;
          grid-template-columns:repeat(4,minmax(0,1fr));
          gap:14px;
        }
        .x-stat-card{
          border-radius:20px;
          background:linear-gradient(180deg, rgba(255,255,255,.98), rgba(248,250,252,.92));
          padding:18px;
        }
        .x-stat-card-soft{
          background:linear-gradient(180deg, rgba(238,242,255,.92), rgba(255,255,255,.96));
        }
        .x-stat-label{ color:#64748b; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; }
        .x-stat-value{ margin-top:8px; font-size:28px; line-height:1; font-weight:800; letter-spacing:-.02em; }
        .x-stat-value-sm{ font-size:18px; line-height:1.3; }
        .x-stat-note{ margin-top:6px; color:#64748b; font-size:11px; }

        .x-feature-card{
          border-radius:22px;
          padding:16px 18px;
          background:linear-gradient(135deg, rgba(255,255,255,.98), rgba(244,247,255,.96));
          display:flex;
          justify-content:space-between;
          gap:14px;
          align-items:center;
          flex-wrap:wrap;
        }
        .x-feature-left{ display:flex; align-items:flex-start; gap:14px; }
        .x-feature-icon{
          width:48px; height:48px; border-radius:16px;
          display:grid; place-items:center;
          font-size:20px; font-weight:900; color:#4338ca;
          background:linear-gradient(135deg, rgba(224,231,255,.95), rgba(238,242,255,.95));
          border:1px solid rgba(99,102,241,.16);
        }
        .x-feature-kicker{ font-size:12px; text-transform:uppercase; letter-spacing:.12em; color:#6366f1; font-weight:800; }
        .x-feature-title{ margin-top:2px; font-size:18px; font-weight:800; }
        .x-feature-desc{ margin-top:6px; color:#475569; display:flex; gap:8px; align-items:center; flex-wrap:wrap; font-size:13px; }
        .x-sep{ color:#cbd5e1; }

        .x-panel{
          border-radius:24px;
          background:linear-gradient(180deg, rgba(255,255,255,.98), rgba(248,250,252,.96));
          overflow:hidden;
        }
        .x-panel-top{
          padding:18px;
          display:grid;
          grid-template-columns:minmax(0,1.4fr) minmax(340px,.8fr);
          gap:14px;
          border-bottom:1px solid rgba(148,163,184,.16);
        }
        .x-search-block,
        .x-check-card,
        .x-toggle-card{
          border:1px solid rgba(148,163,184,.18);
          border-radius:18px;
          background:#fff;
          padding:14px;
        }
        .x-label{ display:block; font-size:12px; text-transform:uppercase; letter-spacing:.12em; color:#64748b; font-weight:800; margin-bottom:10px; }
        .x-inline-tools{ display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        .x-check-row{ display:flex; align-items:center; gap:10px; font-weight:700; color:#0f172a; }

        .x-search{ position:relative; display:flex; align-items:center; }
        .x-search-icon{ position:absolute; left:14px; opacity:.55; }
        .x-input{
          width:100%;
          height:42px;
          padding:0 42px 0 40px;
          border-radius:14px;
          border:1px solid rgba(148,163,184,.24);
          background:#f8fafc;
          outline:none;
          color:#0f172a;
          font-size:13px;
        }
        .x-input:focus{ border-color:rgba(99,102,241,.45); box-shadow:0 0 0 4px rgba(99,102,241,.12); background:#fff; }
        .x-search-clear{
          position:absolute; right:10px;
          width:28px; height:28px;
          border-radius:999px;
          border:1px solid rgba(148,163,184,.24);
          background:#fff;
          cursor:pointer;
          color:#475569;
        }

        .x-panel-toolbar{
          display:flex;
          justify-content:space-between;
          gap:12px;
          padding:14px 18px;
          align-items:center;
          flex-wrap:wrap;
          background:rgba(248,250,252,.88);
          border-bottom:1px solid rgba(148,163,184,.16);
        }
        .x-toolbar-group{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
        .x-toolbar-label{ color:#64748b; font-size:12px; font-weight:800; text-transform:uppercase; letter-spacing:.1em; margin-right:2px; }
        .x-toolbar-meta{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; }

        .x-row{ display:flex; align-items:center; gap:10px; }
        .x-row-wrap{ flex-wrap:wrap; }
        .x-actions{ display:flex; justify-content:flex-end; gap:8px; flex-wrap:wrap; }
        .x-actions-wrap{ justify-content:flex-start; }

        .x-pill,
        .x-soft-pill,
        .x-badge,
        .x-chip,
        .x-segment{
          display:inline-flex;
          align-items:center;
          justify-content:center;
          font-weight:800;
        }
        .x-pill,
        .x-soft-pill{
          padding:8px 12px;
          border-radius:999px;
          border:1px solid rgba(148,163,184,.22);
          background:#fff;
          color:#334155;
          font-size:12px;
        }
        .x-pill-info{ border-color:rgba(99,102,241,.24); color:#4338ca; background:rgba(238,242,255,.92); }
        .x-soft-pill{ background:#f8fafc; }

        .x-btn{
          height:36px;
          padding:0 12px;
          border-radius:13px;
          border:1px solid rgba(148,163,184,.24);
          background:#fff;
          color:#0f172a;
          font-weight:700;
          cursor:pointer;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          text-decoration:none;
          white-space:nowrap;
          line-height:1;
          font-size:12px;
          box-sizing:border-box;
        }
        .x-btn:hover{ background:#f8fafc; }
        .x-btn:disabled{ opacity:.62; cursor:not-allowed; }
        .x-btn-primary{ border-color:#2563eb; background:#2563eb; color:#fff; }
        .x-btn-primary:hover{ background:#1d4ed8; }

        .x-segmented{
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:8px;
          padding:6px;
          border-radius:16px;
          background:#f8fafc;
          border:1px solid rgba(148,163,184,.18);
        }
        .x-segment{
          height:34px;
          border:0;
          background:transparent;
          border-radius:12px;
          color:#475569;
          cursor:pointer;
        }
        .x-segment-on{
          background:#fff;
          color:#1d4ed8;
          box-shadow:0 8px 18px rgba(15,23,42,.08);
        }

        .x-chip{
          height:36px;
          padding:0 12px;
          border-radius:999px;
          border:1px solid rgba(148,163,184,.22);
          background:#fff;
          color:#334155;
          cursor:pointer;
          font-size:12px;
        }
        .x-chip-on{ border-color:rgba(37,99,235,.28); background:rgba(239,246,255,.95); color:#1d4ed8; }

        .x-table-wrap{ width:100%; overflow:auto; }
        .x-table{ width:100%; border-collapse:separate; border-spacing:0; }
        .x-table thead th{
          font-weight:800;
          position:sticky; top:0;
          background:#f8fafc;
          padding:14px 16px;
          text-align:left;
          font-size:11px;
          text-transform:uppercase;
          letter-spacing:.09em;
          color:#64748b;
          border-bottom:1px solid rgba(148,163,184,.16);
        }
        .x-th-sort{ cursor:pointer; user-select:none; }
        .x-table tbody td{
          padding:12px 16px;
          border-bottom:1px solid rgba(148,163,184,.14);
          vertical-align:middle;
          background:rgba(255,255,255,.82);
        }
        .x-table tbody tr:hover td{ background:#f8fafc; }

        .x-avatar{
          width:34px; height:34px; border-radius:12px;
          display:grid; place-items:center;
          background:linear-gradient(135deg, rgba(224,231,255,.9), rgba(224,242,254,.9));
          color:#3730a3; font-weight:900;
          border:1px solid rgba(99,102,241,.16);
        }
        .x-avatar-lg{ width:40px; height:40px; border-radius:12px; font-size:14px; }
        .x-code-row{ display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
        .x-code{
          padding:4px 8px;
          border-radius:999px;
          border:1px solid rgba(148,163,184,.22);
          background:#f8fafc;
          color:#334155;
          display:inline-block;
        }
        .x-badge{
          padding:4px 8px;
          border-radius:999px;
          font-size:12px;
          letter-spacing:.06em;
          border:1px solid rgba(148,163,184,.18);
          background:#fff;
        }
        .x-badge-ok{ border-color:rgba(22,163,74,.28); color:#166534; background:rgba(220,252,231,.95); }
        .x-badge-off{ border-color:rgba(239,68,68,.28); color:#991b1b; background:rgba(254,226,226,.95); }
        .x-badge-landing-sm{ border-color:rgba(79,70,229,.24); color:#4338ca; background:rgba(238,242,255,.92); }

        .x-title-cell .x-t1,
        .x-card-title{ font-weight:900; color:#0f172a; }
        .x-title-cell .x-t2{ margin-top:4px; font-size:12px; }
        .muted{ color:#64748b; }

        .x-cards-grid{
          padding:16px;
          display:grid;
          grid-template-columns:repeat(3, minmax(0,1fr));
          gap:12px;
          align-items:start;
        }
        .x-page-card,
        .x-empty-card{
          border:1px solid rgba(148,163,184,.16);
          border-radius:16px;
          background:#fff;
          box-shadow:none;
        }
        .x-page-card{ padding:14px; display:grid; gap:12px; }
        .x-page-card-head{ display:grid; grid-template-columns:auto 1fr; gap:10px; align-items:start; }
        .x-page-card-meta{ min-width:0; flex:1; }
        .x-page-card-topline{ display:flex; gap:6px; flex-wrap:wrap; margin-bottom:6px; }
        .x-page-card-body{
          display:grid;
          gap:8px;
          padding-top:8px;
          border-top:1px solid rgba(148,163,184,.14);
        }
        .x-page-card-line{
          display:grid;
          grid-template-columns:56px minmax(0,1fr);
          gap:10px;
          align-items:start;
        }
        .x-page-card-line > :last-child{
          min-width:0;
          overflow:hidden;
          text-overflow:ellipsis;
        }
        .x-mini-label{ font-size:10px; text-transform:uppercase; letter-spacing:.08em; color:#64748b; font-weight:800; padding-top:4px; }
        .x-card-title{ font-size:14px; line-height:1.35; }
        .x-empty-card{ grid-column:1 / -1; padding:24px; text-align:center; }

        .x-pager{
          padding:14px 16px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:12px;
          flex-wrap:wrap;
          border-top:1px solid rgba(148,163,184,.16);
          background:#f8fafc;
        }
        .x-select{
          height:36px;
          padding:0 12px;
          border-radius:12px;
          border:1px solid rgba(148,163,184,.22);
          background:#fff;
          color:#0f172a;
          outline:none;
        }

        .x-empty{ padding:34px 12px; text-align:center; }
        .x-empty-title{ font-weight:800; font-size:15px; color:#0f172a; }
        .x-empty-desc{ margin-top:6px; }

        .sk{
          height:12px;
          border-radius:999px;
          background:rgba(148,163,184,.14);
          overflow:hidden;
          position:relative;
        }
        .sk:after{
          content:"";
          position:absolute;
          inset:0;
          transform:translateX(-60%);
          background:linear-gradient(90deg, transparent, rgba(255,255,255,.45), transparent);
          animation:shimmer 1.1s linear infinite;
        }
        .sk1{ width:120px; }
        .sk2{ width:260px; }
        .sk3{ width:90px; }
        .sk4{ width:160px; }
        .skBtn{ width:240px; height:40px; margin-left:auto; border-radius:12px; }
        .skBtnWide{ width:100%; height:36px; border-radius:12px; }
        .skAvatar{ width:40px; height:40px; border-radius:14px; }
        .skAvatarLg{ width:48px; height:48px; border-radius:16px; }

        @keyframes shimmer{ to { transform:translateX(60%); } }

        @media (max-width: 1120px){
          .x-stats-grid{ grid-template-columns:repeat(2, minmax(0,1fr)); }
          .x-panel-top{ grid-template-columns:1fr; }
          .x-cards-grid{ grid-template-columns:repeat(2, minmax(0,1fr)); }
        }
        @media (max-width: 760px){
          .x-title{ font-size:22px; }
          .x-stats-grid,
          .x-inline-tools,
          .x-cards-grid{ grid-template-columns:1fr; }
          .x-hero,
          .x-feature-card{ padding:18px; }
          .x-panel-top,
          .x-panel-toolbar,
          .x-pager{ padding:14px; }
          .x-actions{ justify-content:flex-start; }
          .x-table thead th,
          .x-table tbody td{ padding:12px; }
        }
      `}</style>
        </div>
    );
}
