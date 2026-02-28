import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  adminListPages,
  adminPatchPage,
  adminDuplicatePage,
  adminGetPublicPageUrl,
  type CmsPageLite,
} from "../api/cms.api";
import { useAuth } from "../app/auth.store";
import { useToast } from "../components/Toast";

type SortKey = "slug" | "title" | "updatedAt";
type SortDir = "asc" | "desc";

function fmtDate(s?: string) {
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString();
}
function cmp(a: string, b: string) {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

function safeSlugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function CmsPagesPage() {
  const { token } = useAuth();
  const toast = useToast();

  const [rows, setRows] = useState<CmsPageLite[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);

  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // row action loading states
  const [busyId, setBusyId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await adminListPages(token);
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast.push({ kind: "err", title: "Load pages failed", detail: e?.message || String(e) });
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

  // pin landing
  const pinnedSlug = "landing";

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    let list = rows;

    if (onlyActive) list = list.filter((r) => (r.isActive ?? true) === true);

    if (keyword) {
      list = list.filter((r) => {
        const s1 = (r.slug || "").toLowerCase();
        const s2 = (r.title || "").toLowerCase();
        return s1.includes(keyword) || s2.includes(keyword);
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

    // pin landing to top (if exists)
    const idx = sorted.findIndex((x) => x.slug === pinnedSlug);
    if (idx > 0) {
      const [pin] = sorted.splice(idx, 1);
      sorted.unshift(pin);
    }
    return sorted;
  }, [rows, q, onlyActive, sortKey, sortDir]);

  // reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [q, onlyActive, pageSize, sortKey, sortDir]);

  const total = rows.length;
  const shown = filtered.length;

  const totalPages = Math.max(1, Math.ceil(shown / pageSize));
  const pageClamped = Math.min(page, totalPages);
  const start = (pageClamped - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

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
      // optimistic update
      setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, isActive: next } : x)));
    } catch (e: any) {
      toast.push({
        kind: "err",
        title: "Toggle active failed",
        detail:
          e?.message ||
          "Backend chưa có endpoint PATCH /admin/cms/pages/:id (mình đã để sẵn, chỉ cần implement).",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function onDuplicate(r: CmsPageLite) {
    if (!r.id) {
      toast.push({ kind: "err", title: "Cannot duplicate", detail: "Page missing id" });
      return;
    }

    // UI-only: đề xuất slug mới để backend dùng (nếu backend bạn muốn)
    const suggested = `${r.slug}-copy-${safeSlugify(new Date().toISOString().slice(0, 10))}`;

    setBusyId(r.id);
    try {
      const res = await adminDuplicatePage(token, r.id);
      toast.push({
        kind: "ok",
        title: "Duplicated",
        detail: res?.newSlug ? `New slug: ${res.newSlug}` : `Suggested slug: ${suggested}`,
      });
      // reload vì backend có thể tạo sections/locale…
      await load();
    } catch (e: any) {
      toast.push({
        kind: "err",
        title: "Duplicate failed",
        detail:
          e?.message ||
          "Backend chưa có endpoint POST /admin/cms/pages/:id/duplicate (mình đã đề xuất route).",
      });
    } finally {
      setBusyId(null);
    }
  }

  function onPreview(r: CmsPageLite) {
    const url = adminGetPublicPageUrl(r.slug);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const pinned = useMemo(() => rows.find((x) => x.slug === pinnedSlug) || null, [rows]);

  return (
    <div className="x-wrap">
      <div className="x-topbar">
        <div>
          <div className="x-title-row">
            <h1 className="x-title">Quản lý CMS</h1>
            <span className="x-pill x-pill-info">Trang nội dung</span>
            <span className="x-pill">Hiển thị: {shown}/{total}</span>
          </div>
          <p className="x-subtitle">Quản lý trang CMS theo bố cục đồng bộ với các trang quản trị khác.</p>
        </div>
        <button className="x-btn" onClick={load} disabled={loading}>
          {loading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      {pinned ? (
        <div className="x-card x-card-pin">
          <div className="x-pin-left">
            <span className="x-pin-icon">📌</span>
            <div>
              <div className="x-pin-title">
                <span>Trang ghim</span>
                <span className="x-badge x-badge-landing">Landing</span>
              </div>
              <div className="muted" style={{ marginTop: 8 }}>
                <code className="x-code">{pinned.slug}</code> • {pinned.title}
              </div>
            </div>
          </div>
          <div className="x-row x-row-wrap">
            <button className="x-btn" type="button" onClick={() => onPreview(pinned)}>
              Xem public
            </button>
            <Link className="x-btn x-btn-primary" to={`/cms/pages/${encodeURIComponent(pinned.slug)}`}>
              Sửa landing
            </Link>
          </div>
        </div>
      ) : null}

      <div className="x-card">
        <div className="x-toolbar">
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

          <label className="x-check">
            <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} />
            <span>Chỉ Active</span>
          </label>

          <div className="x-row x-row-wrap x-sort">
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
        </div>

        <div className="x-table-wrap">
          <table className="x-table">
            <thead>
              <tr>
                <th style={{ width: 210 }} onClick={() => toggleSort("slug")} className="x-th-sort">
                  Slug {sortKey === "slug" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </th>
                <th onClick={() => toggleSort("title")} className="x-th-sort">
                  Title {sortKey === "title" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </th>
                <th style={{ width: 120 }}>Status</th>
                <th style={{ width: 220 }} onClick={() => toggleSort("updatedAt")} className="x-th-sort">
                  Updated {sortKey === "updatedAt" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </th>
                <th style={{ width: 360, textAlign: "right" }}>Quick actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td>
                        <div className="sk sk1" />
                      </td>
                      <td>
                        <div className="sk sk2" />
                      </td>
                      <td>
                        <div className="sk sk3" />
                      </td>
                      <td>
                        <div className="sk sk4" />
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="sk skBtn" />
                      </td>
                    </tr>
                  ))}
                </>
              ) : (
                <>
                  {paged.map((r) => {
                    const active = (r.isActive ?? true) === true;
                    const isLanding = r.slug === pinnedSlug;

                    return (
                      <tr key={r.slug}>
                        <td>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <code className="x-code">{r.slug}</code>
                            {isLanding ? <span className="x-badge x-badge-landing-sm">Landing</span> : null}
                          </div>
                        </td>

                        <td className="x-title-cell">
                          <div className="x-t1">{r.title}</div>
                          <div className="x-t2 muted">/{r.slug} • {active ? "Public" : "Hidden"}</div>
                        </td>

                        <td>
                          <span className={`x-badge ${active ? "x-badge-ok" : "x-badge-off"}`}>{active ? "ACTIVE" : "DISABLED"}</span>
                        </td>

                        <td className="muted">{fmtDate(r.updatedAt)}</td>

                        <td style={{ textAlign: "right" }}>
                          <div className="x-row x-row-wrap" style={{ justifyContent: "flex-end", gap: 8 }}>
                            {/* <button className="x-btn" type="button" onClick={() => onPreview(r)}>
                              Preview
                            </button>

                            <button
                              className="x-btn"
                              type="button"
                              onClick={() => onDuplicate(r)}
                              disabled={busyId === r.id}
                              title="Duplicate page"
                            >
                              {busyId === r.id ? "…" : "Duplicate"}
                            </button>

                            <button
                              className="x-btn"
                              type="button"
                              onClick={() => onToggleActive(r)}
                              disabled={busyId === r.id}
                              title="Toggle active"
                            >
                              {active ? "Disable" : "Enable"}
                            </button> */}

                            <Link className="x-btn x-btn-primary" to={`/cms/pages/${encodeURIComponent(r.slug)}`}>
                              Edit
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {!paged.length ? (
                    <tr>
                      <td colSpan={5}>
                        <div className="x-empty">
                          <div className="x-empty-title">Không có dữ liệu phù hợp.</div>
                          <div className="x-empty-desc muted">
                            {total === 0
                              ? "Chưa có page nào hoặc endpoint trả về rỗng."
                              : "Thử xoá filter/search hoặc bấm Refresh."}
                          </div>
                          <div style={{ marginTop: 12 }}>
                            <button className="x-btn" onClick={load}>
                              Refresh
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="x-pager">
          <div className="muted">
            Page <b>{pageClamped}</b> / {totalPages} • Showing{" "}
            <b>{shown === 0 ? 0 : start + 1}</b>–<b>{Math.min(start + pageSize, shown)}</b> of {shown}
          </div>

          <div className="x-row x-row-wrap" style={{ gap: 12 }}>
            <div className="x-row" style={{ gap: 8 }}>
              <span className="muted">Rows:</span>
              <select
                className="x-select"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="x-row" style={{ gap: 8 }}>
              <button className="x-btn" onClick={() => setPage(1)} disabled={pageClamped <= 1}>
                ⟪
              </button>
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
              <button className="x-btn" onClick={() => setPage(totalPages)} disabled={pageClamped >= totalPages}>
                ⟫
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .x-wrap{ display:grid; gap:14px; }
        .x-topbar{
          border-radius:18px;
          border:1px solid rgba(148,163,184,.2);
          background: linear-gradient(180deg, rgba(255,255,255,.94), rgba(248,250,252,.9));
          box-shadow: 0 18px 40px rgba(15,23,42,.09);
          padding: 16px;
          display:flex;
          align-items:flex-end;
          justify-content:space-between;
          gap:12px;
          flex-wrap:wrap;
        }
        .x-title-row{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
        .x-title{ margin:0; font-size:26px; font-weight:900; color:#0f172a; }
        .x-subtitle{ margin:6px 0 0; color:#64748b; }

        .x-pill{ display:inline-flex; align-items:center; gap:8px; padding:8px 12px; border-radius:999px; border:1px solid rgba(148,163,184,.26); background:#fff; color:#334155; font-size:12px; font-weight:700; }
        .x-pill-info{ border-color: rgba(59,130,246,.25); color:#1d4ed8; background: rgba(239,246,255,.9); }

        .x-btn{ border:1px solid rgba(148,163,184,.3); background:#fff; color:#0f172a; border-radius:12px; padding:9px 12px; font-weight:700; cursor:pointer; }
        .x-btn:hover{ background:#f8fafc; }
        .x-btn:disabled{ opacity:.6; cursor:not-allowed; }
        .x-btn-primary{ border-color:#2563eb; background:#2563eb; color:#fff; }
        .x-btn-primary:hover{ background:#1d4ed8; }

        .x-card{ border-radius:18px; border:1px solid rgba(148,163,184,.22); background:#fff; box-shadow: 0 14px 34px rgba(15,23,42,.08); overflow:hidden; }
        .x-card-pin{ padding:14px; display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; }
        .x-pin-left{ display:flex; gap:10px; align-items:flex-start; }
        .x-pin-icon{ font-size:18px; }
        .x-pin-title{ display:flex; align-items:center; gap:8px; font-weight:800; color:#0f172a; }

        .x-row{ display:flex; align-items:center; }
        .x-row-wrap{ flex-wrap:wrap; }

        .x-toolbar{ padding:12px; display:flex; gap:10px; align-items:center; flex-wrap:wrap; border-bottom:1px solid rgba(148,163,184,.18); }
        .x-search{ position:relative; min-width:260px; flex:1 1 320px; display:flex; align-items:center; }
        .x-search-icon{ position:absolute; left:12px; opacity:.55; }
        .x-input{
          width:100%;
          padding: 11px 36px;
          border-radius:14px;
          border:1px solid rgba(148,163,184,.3);
          background: #fff;
          color: #0f172a;
          outline:none;
        }
        .x-input:focus{ border-color: rgba(99,102,241,.55); box-shadow: 0 0 0 4px rgba(99,102,241,.15); }
        .x-search-clear{
          position:absolute; right:10px;
          border:1px solid rgba(148,163,184,.3); background:#fff; color:#334155;
          border-radius:999px; padding:4px 8px; cursor:pointer;
        }

        .x-check{ display:flex; align-items:center; gap:8px; color:#0f172a; font-weight:700; }
        .x-sort{ gap:8px; }
        .x-chip{
          padding:8px 10px; border-radius:999px;
          border:1px solid rgba(148,163,184,.24);
          background: #fff;
          color: #334155;
          cursor:pointer;
          font-weight:700; font-size:12px;
        }
        .x-chip-on{ border-color: rgba(37,99,235,.35); color:#1d4ed8; background: rgba(239,246,255,.8); }

        .x-table-wrap{ width:100%; overflow:auto; }
        .x-table{ width:100%; border-collapse: collapse; }
        .x-table thead th{
          position:sticky; top:0;
          background: #f8fafc;
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(148,163,184,.24);
          padding: 12px;
          text-align:left;
          font-size:12px;
          text-transform: uppercase;
          letter-spacing:.09em;
          color:#475569;
        }
        .x-th-sort{ cursor:pointer; user-select:none; }
        .x-table tbody td{
          padding: 12px;
          border-bottom: 1px solid rgba(148,163,184,.2);
          vertical-align: middle;
          color:#0f172a;
        }
        .x-table tbody tr:hover td{ background: #f8fafc; }

        .x-code{
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid rgba(148,163,184,.3);
          background: #f8fafc;
          display:inline-block;
          color:#334155;
        }

        .x-badge{
          display:inline-flex; align-items:center;
          padding: 6px 10px; border-radius: 999px;
          font-size: 12px; font-weight: 950; letter-spacing: .06em;
          border: 1px solid rgba(148,163,184,.2);
          background: #fff;
        }
        .x-badge-ok{ border-color: rgba(22,163,74,.35); color:#166534; background: rgba(220,252,231,.9); }
        .x-badge-off{ border-color: rgba(239,68,68,.35); color:#991b1b; background: rgba(254,226,226,.9); }
        .x-badge-landing{ border-color: rgba(79,70,229,.35); color:#4338ca; background: rgba(238,242,255,.9); }
        .x-badge-landing-sm{ border-color: rgba(79,70,229,.3); color:#4338ca; background: rgba(238,242,255,.8); font-size:11px; padding:4px 8px; }

        .x-title-cell .x-t1{ font-weight:800; }
        .x-title-cell .x-t2{ margin-top:4px; font-size:12px; }

        .x-pager{
          padding: 12px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:12px;
          flex-wrap:wrap;
          background: #f8fafc;
          border-top: 1px solid rgba(148,163,184,.2);
        }
        .x-select{
          border-radius: 12px;
          border:1px solid rgba(148,163,184,.25);
          background: #fff;
          color: #0f172a;
          padding: 9px 10px;
          outline:none;
        }

        .x-empty{ padding: 26px 12px; text-align:center; }
        .x-empty-title{ font-weight: 900; font-size: 16px; color:#0f172a; }
        .x-empty-desc{ margin-top:6px; }

        .sk{
          height: 12px; border-radius: 999px;
          background: rgba(148,163,184,.14);
          overflow:hidden; position:relative;
        }
        .sk:after{
          content:""; position:absolute; inset:0;
          transform: translateX(-60%);
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.10), transparent);
          animation: shimmer 1.1s linear infinite;
        }
        .sk1{ width: 120px; }
        .sk2{ width: 280px; }
        .sk3{ width: 90px; }
        .sk4{ width: 160px; }
        .skBtn{ width: 220px; height: 34px; border-radius: 12px; margin-left:auto; }

        @keyframes shimmer { to { transform: translateX(60%); } }

        @media (max-width: 680px){
          .x-title{ font-size:22px; }
          .x-search{ min-width: 220px; }
        }
      `}</style>
    </div>
  );
}
