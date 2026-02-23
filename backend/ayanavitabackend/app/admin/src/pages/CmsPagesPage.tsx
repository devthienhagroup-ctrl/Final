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
    <div className="aya-page">
      {/* Header */}
      <div className="aya-top">
        <div className="title">
          <div className="h1">CMS Pages</div>
          <div className="sub muted">Quick actions • pin landing • pagination • preview public.</div>
        </div>

        <div className="actions">
          <div className="pill">
            <span className="dot" />
            <span className="muted">
              Hiển thị: <b>{shown}</b> / {total}
            </span>
          </div>

          <button className="btn" onClick={load} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* Pinned Landing */}
      {pinned ? (
        <div className="card glass pinned">
          <div className="pinnedRow">
            <div className="pinLeft">
              <span className="pinIcon" aria-hidden="true">
                📌
              </span>
              <div>
                <div className="pinTitle">
                  <span className="h2">Pinned</span>
                  <span className="tagLanding">Landing</span>
                </div>
                <div className="muted" style={{ marginTop: 6 }}>
                  <code className="code">{pinned.slug}</code> • {pinned.title}
                </div>
              </div>
            </div>

            <div className="pinActions">
              <button className="btn" type="button" onClick={() => onPreview(pinned)}>
                Open public preview
              </button>
              <Link className="btn btn-primary" to={`/cms/pages/${encodeURIComponent(pinned.slug)}`}>
                Edit landing
              </Link>
              <button
                className="btn"
                type="button"
                onClick={() => onToggleActive(pinned)}
                disabled={busyId === pinned.id}
                title="Toggle Active"
              >
                {((pinned.isActive ?? true) === true) ? "Disable" : "Enable"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* List */}
      <div className="card glass">
        <div className="toolbar">
          <div className="search">
            <span className="icon" aria-hidden="true">
              ⌕
            </span>
            <input
              className="input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo slug hoặc title…"
            />
            {q ? (
              <button className="x" type="button" onClick={() => setQ("")} aria-label="Clear">
                ✕
              </button>
            ) : null}
          </div>

          <label className="check">
            <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} />
            <span>Chỉ Active</span>
          </label>

          <div className="sort">
            <span className="muted">Sort:</span>
            <button className={`chip ${sortKey === "updatedAt" ? "on" : ""}`} onClick={() => toggleSort("updatedAt")}>
              Updated {sortKey === "updatedAt" ? (sortDir === "asc" ? "↑" : "↓") : ""}
            </button>
            <button className={`chip ${sortKey === "slug" ? "on" : ""}`} onClick={() => toggleSort("slug")}>
              Slug {sortKey === "slug" ? (sortDir === "asc" ? "↑" : "↓") : ""}
            </button>
            <button className={`chip ${sortKey === "title" ? "on" : ""}`} onClick={() => toggleSort("title")}>
              Title {sortKey === "title" ? (sortDir === "asc" ? "↑" : "↓") : ""}
            </button>
          </div>
        </div>

        <div className="sep" />

        {/* Table */}
        <div className="tableWrap">
          <table className="table nice">
            <thead>
              <tr>
                <th style={{ width: 210 }} onClick={() => toggleSort("slug")} className="thSort">
                  Slug {sortKey === "slug" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </th>
                <th onClick={() => toggleSort("title")} className="thSort">
                  Title {sortKey === "title" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </th>
                <th style={{ width: 120 }}>Status</th>
                <th style={{ width: 220 }} onClick={() => toggleSort("updatedAt")} className="thSort">
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
                            <code className="code">{r.slug}</code>
                            {isLanding ? <span className="tagLandingSm">Landing</span> : null}
                          </div>
                        </td>

                        <td className="titleCell">
                          <div className="t1">{r.title}</div>
                          <div className="t2 muted">/{r.slug} • {active ? "Public" : "Hidden"}</div>
                        </td>

                        <td>
                          <span className={`badge ${active ? "ok" : "off"}`}>{active ? "ACTIVE" : "DISABLED"}</span>
                        </td>

                        <td className="muted">{fmtDate(r.updatedAt)}</td>

                        <td style={{ textAlign: "right" }}>
                          <div className="qActions">
                            <button className="btn" type="button" onClick={() => onPreview(r)}>
                              Preview
                            </button>

                            <button
                              className="btn"
                              type="button"
                              onClick={() => onDuplicate(r)}
                              disabled={busyId === r.id}
                              title="Duplicate page"
                            >
                              {busyId === r.id ? "…" : "Duplicate"}
                            </button>

                            <button
                              className="btn"
                              type="button"
                              onClick={() => onToggleActive(r)}
                              disabled={busyId === r.id}
                              title="Toggle active"
                            >
                              {active ? "Disable" : "Enable"}
                            </button>

                            <Link className="btn btn-primary" to={`/cms/pages/${encodeURIComponent(r.slug)}`}>
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
                        <div className="empty">
                          <div className="e1">Không có dữ liệu phù hợp.</div>
                          <div className="e2 muted">
                            {total === 0
                              ? "Chưa có page nào hoặc endpoint trả về rỗng."
                              : "Thử xoá filter/search hoặc bấm Refresh."}
                          </div>
                          <div style={{ marginTop: 12 }}>
                            <button className="btn" onClick={load}>
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
        <div className="pager">
          <div className="muted">
            Page <b>{pageClamped}</b> / {totalPages} • Showing{" "}
            <b>{shown === 0 ? 0 : start + 1}</b>–<b>{Math.min(start + pageSize, shown)}</b> of {shown}
          </div>

          <div className="pagerRight">
            <div className="size">
              <span className="muted">Rows:</span>
              <select
                className="select"
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

            <div className="pagerBtns">
              <button className="btn" onClick={() => setPage(1)} disabled={pageClamped <= 1}>
                ⟪
              </button>
              <button className="btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pageClamped <= 1}>
                Prev
              </button>
              <button
                className="btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={pageClamped >= totalPages}
              >
                Next
              </button>
              <button className="btn" onClick={() => setPage(totalPages)} disabled={pageClamped >= totalPages}>
                ⟫
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .aya-page{ display:grid; gap:14px; }
        .aya-top{ display:flex; align-items:flex-end; justify-content:space-between; gap:12px; flex-wrap:wrap; }
        .aya-top .h1{ font-size:28px; font-weight:950; letter-spacing:.2px; }
        .aya-top .sub{ margin-top:6px; opacity:.78; }
        .actions{ display:flex; align-items:center; gap:10px; }

        .pill{
          display:flex; align-items:center; gap:10px;
          padding:10px 12px; border-radius:999px;
          border:1px solid rgba(148,163,184,.18);
          background: rgba(2,6,23,.25);
        }
        .pill .dot{ width:9px; height:9px; border-radius:999px; background: rgba(34,211,238,.95); box-shadow:0 0 0 6px rgba(34,211,238,.12); }

        .card.glass{
          border-radius:18px;
          border:1px solid rgba(148,163,184,.18);
          background: linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.04));
          box-shadow: 0 22px 60px rgba(0,0,0,.35);
          overflow:hidden;
        }

        .card.glass.pinned{
          padding: 12px;
        }
        .pinnedRow{
          display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;
        }
        .pinLeft{ display:flex; gap:10px; align-items:flex-start; }
        .pinIcon{ font-size: 18px; }
        .pinTitle{ display:flex; align-items:center; gap:10px; }
        .h2{ font-weight: 950; font-size: 16px; }
        .tagLanding{
          display:inline-flex; align-items:center;
          padding: 6px 10px; border-radius: 999px;
          font-weight: 950; letter-spacing: .06em; font-size: 12px;
          border:1px solid rgba(99,102,241,.35);
          background: rgba(99,102,241,.14);
        }
        .tagLandingSm{
          display:inline-flex; align-items:center;
          padding: 4px 8px; border-radius: 999px;
          font-weight: 950; letter-spacing: .06em; font-size: 11px;
          border:1px solid rgba(99,102,241,.30);
          background: rgba(99,102,241,.12);
          opacity:.95;
        }

        .pinActions{ display:flex; gap:10px; align-items:center; flex-wrap:wrap; }

        .toolbar{ padding:12px; display:flex; gap:10px; align-items:center; flex-wrap:wrap; }

        .search{ position:relative; min-width: 260px; flex: 1 1 320px; display:flex; align-items:center; }
        .search .icon{ position:absolute; left:12px; opacity:.65; font-weight:900; }
        .search .input{
          width:100%;
          padding: 12px 38px 12px 36px;
          border-radius:14px;
          border:1px solid rgba(148,163,184,.18);
          background: rgba(2,6,23,.22);
          color: inherit;
          outline:none;
        }
        .search .input:focus{ border-color: rgba(99,102,241,.55); box-shadow: 0 0 0 4px rgba(99,102,241,.18); }
        .search .x{
          position:absolute; right:10px;
          border:1px solid rgba(148,163,184,.16);
          background: rgba(255,255,255,.06);
          color: inherit; border-radius:999px;
          padding:6px 10px; cursor:pointer; opacity:.85;
        }

        .check{ display:flex; align-items:center; gap:8px; font-weight:800; opacity:.9; }
        .check input{ width:16px; height:16px; }

        .sort{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
        .chip{
          padding:8px 10px; border-radius:999px;
          border:1px solid rgba(148,163,184,.16);
          background: rgba(255,255,255,.05);
          color: inherit; cursor:pointer;
          font-weight:850; font-size:12px; opacity:.9;
        }
        .chip.on{ border-color: rgba(99,102,241,.35); background: rgba(99,102,241,.14); }

        .tableWrap{ width:100%; overflow:auto; }
        .table.nice{ width:100%; border-collapse: collapse; }
        .table.nice thead th{
          position:sticky; top:0;
          background: rgba(2,6,23,.35);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(148,163,184,.18);
          padding: 12px;
          text-align:left;
          font-size:12px;
          text-transform: uppercase;
          letter-spacing:.09em;
          opacity:.85;
        }
        .thSort{ cursor:pointer; user-select:none; }
        .table.nice tbody td{
          padding: 12px;
          border-bottom: 1px solid rgba(148,163,184,.12);
          vertical-align: middle;
        }
        .table.nice tbody tr:hover td{ background: rgba(255,255,255,.03); }

        .code{
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid rgba(148,163,184,.14);
          background: rgba(2,6,23,.22);
          display:inline-block;
        }

        .badge{
          display:inline-flex; align-items:center;
          padding: 6px 10px; border-radius: 999px;
          font-size: 12px; font-weight: 950; letter-spacing: .06em;
          border: 1px solid rgba(148,163,184,.14);
          background: rgba(255,255,255,.04);
        }
        .badge.ok{ border-color: rgba(34,197,94,.25); background: rgba(34,197,94,.10); }
        .badge.off{ border-color: rgba(239,68,68,.25); background: rgba(239,68,68,.10); }

        .titleCell .t1{ font-weight: 900; }
        .titleCell .t2{ margin-top:4px; font-size:12px; opacity:.75; }

        .qActions{
          display:inline-flex;
          gap:10px;
          align-items:center;
          justify-content:flex-end;
          flex-wrap:wrap;
        }

        .pager{
          padding: 12px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:12px;
          flex-wrap:wrap;
          background: rgba(2,6,23,.18);
          border-top: 1px solid rgba(148,163,184,.12);
        }
        .pagerRight{ display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
        .pagerBtns{ display:flex; align-items:center; gap:8px; }
        .size{ display:flex; align-items:center; gap:8px; }
        .select{
          border-radius: 12px;
          border:1px solid rgba(148,163,184,.18);
          background: rgba(2,6,23,.22);
          color: inherit;
          padding: 10px 10px;
          outline:none;
        }

        .empty{ padding: 26px 12px; text-align:center; }
        .empty .e1{ font-weight: 950; font-size: 16px; }
        .empty .e2{ margin-top:6px; }

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

        @media (max-width: 860px){
          .qActions{ justify-content:flex-start; }
        }
        @media (max-width: 680px){
          .aya-top .h1{ font-size:24px; }
          .search{ min-width: 220px; }
        }
      `}</style>
    </div>
  );
}
