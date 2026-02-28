import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  adminCreateBlog,
  adminDeleteBlog,
  adminListBlogs,
  adminUpdateBlog,
  adminUploadCoverImage,
  clearBlogViewTracking,
  BlogAdminItem,
  BlogStatus,
} from "../api/blogAdmin.api";

const PAGE_CSS = `
.blog-admin {
  --bg: #ffffff;
  --text: #0f172a;
  --muted: #64748b;
  --border: rgba(15, 23, 42, 0.08);
  --shadow: 0 20px 45px rgba(2, 6, 23, 0.12);
  --shadow-soft: 0 12px 28px rgba(2, 6, 23, 0.08);
  --radius: 18px;
  --radius-sm: 12px;

  --grad: linear-gradient(135deg, #7c3aed, #06b6d4);
  --grad-2: linear-gradient(135deg, #22c55e, #06b6d4);
  --grad-warm: linear-gradient(135deg, #f97316, #ec4899);

  --ok: #16a34a;
  --warn: #f59e0b;
  --danger: #ef4444;
  --paid: #2563eb;

  --chip-bg: rgba(2, 6, 23, 0.04);
  --focus: 0 0 0 4px rgba(124, 58, 237, 0.18);

  min-height: 100vh;
  background-color: var(--bg);
  background-image: radial-gradient(1200px 600px at 20% -10%, rgba(124, 58, 237, 0.08), transparent 60%),
    radial-gradient(1200px 600px at 90% 0%, rgba(6, 182, 212, 0.08), transparent 55%);
  background-repeat: no-repeat;
  background-attachment: fixed;
  color: var(--text);
}

.blog-admin * { box-sizing: border-box; }

.blog-admin .app { display: grid; grid-template-columns: 1fr; min-height: 100%; }

.blog-admin .topbar {
  position: sticky;
  top: 0;
  z-index: 5;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--border);
}

.blog-admin .topbar-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.blog-admin .brand { display: flex; align-items: center; gap: 12px; }

.blog-admin .logo {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: var(--grad);
  box-shadow: 0 14px 28px rgba(124, 58, 237, 0.22);
  display: grid;
  place-items: center;
  color: white;
  font-weight: 900;
  letter-spacing: 0.5px;
}

.blog-admin .brand h1 { font-size: 16px; margin: 0; line-height: 1.1; }
.blog-admin .brand p { margin: 2px 0 0 0; font-size: 12px; color: var(--muted); }

.blog-admin .top-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }

.blog-admin .pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 10px 20px rgba(2, 6, 23, 0.06);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  cursor: pointer;
  user-select: none;
}

.blog-admin .pill:hover { transform: translateY(-1px); box-shadow: 0 14px 28px rgba(2, 6, 23, 0.08); }
.blog-admin .pill:active { transform: translateY(0); }

.blog-admin .pill .dot { width: 9px; height: 9px; border-radius: 999px; background: var(--grad-2); }

.blog-admin .loading {
  display: none;
  align-items: center;
  gap: 10px;
  color: var(--muted);
  font-size: 12px;
}
.blog-admin .loading.show { display: inline-flex; }

.blog-admin .spinner {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  border: 2px solid rgba(15, 23, 42, 0.15);
  border-top-color: rgba(124, 58, 237, 0.8);
  animation: blog-admin-spin 0.7s linear infinite;
}
@keyframes blog-admin-spin { to { transform: rotate(360deg); } }

.blog-admin .container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 18px;
  padding-bottom: 36px;
}

.blog-admin .page-title {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
  margin-top: 14px;
  margin-bottom: 18px;
}

.blog-admin .page-title h2 { margin: 0; font-size: 22px; letter-spacing: -0.02em; }
.blog-admin .page-title .hint { margin: 0; color: var(--muted); font-size: 13px; }

.blog-admin .stats {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.blog-admin .card {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: var(--shadow-soft);
}

.blog-admin .stat {
  grid-column: span 3;
  padding: 14px 14px 12px 14px;
  overflow: hidden;
  position: relative;
  transform: translateZ(0);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.blog-admin .stat:hover { transform: translateY(-2px); box-shadow: 0 18px 40px rgba(2, 6, 23, 0.11); }

.blog-admin .stat .bg {
  position: absolute;
  inset: -1px;
  opacity: 0.12;
  background: var(--grad);
  pointer-events: none;
}
.blog-admin .stat:nth-child(2) .bg { background: var(--grad-2); }
.blog-admin .stat:nth-child(3) .bg { background: var(--grad-warm); }
.blog-admin .stat:nth-child(4) .bg { background: linear-gradient(135deg, #2563eb, #7c3aed); }

.blog-admin .stat .row {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.blog-admin .stat .label { margin: 0 0 6px 0; font-size: 12px; color: var(--muted); }
.blog-admin .stat .value { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.03em; }

.blog-admin .badge-mini {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.85);
  font-size: 12px;
  color: rgba(15, 23, 42, 0.85);
  white-space: nowrap;
}
.blog-admin .badge-mini .spark { width: 10px; height: 10px; border-radius: 999px; background: var(--grad); }

.blog-admin .panel { padding: 14px; }

.blog-admin .panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.blog-admin .panel-head h3 { margin: 0; font-size: 14px; }
.blog-admin .panel-head .right { display: flex; align-items: center; gap: 10px; color: var(--muted); font-size: 12px; }

.blog-admin .filters {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 10px;
  align-items: end;
}

.blog-admin label { display: block; font-size: 12px; color: var(--muted); margin: 0 0 6px 2px; }

.blog-admin .input {
  width: 100%;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.9);
  padding: 10px 12px;
  outline: none;
  transition: box-shadow 0.15s ease, border-color 0.15s ease;
  font: inherit;
}
.blog-admin .input:focus { box-shadow: var(--focus); border-color: rgba(124, 58, 237, 0.45); }

.blog-admin textarea.input { min-height: 140px; resize: vertical; }

.blog-admin .actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px; flex-wrap: wrap; }

.blog-admin .btn {
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.9);
  color: var(--text);
  border-radius: 14px;
  padding: 10px 12px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  user-select: none;
  font: inherit;
  font-weight: 700;
}
.blog-admin .btn:hover { transform: translateY(-1px); box-shadow: 0 14px 28px rgba(2, 6, 23, 0.08); }
.blog-admin .btn:active { transform: translateY(0); }
.blog-admin .btn:disabled { opacity: 0.55; cursor: not-allowed; }

.blog-admin .btn.primary {
  border: none;
  color: white;
  background: var(--grad);
  box-shadow: 0 16px 32px rgba(124, 58, 237, 0.18);
}
.blog-admin .btn.ghost { background: rgba(2, 6, 23, 0.02); }
.blog-admin .btn.danger { color: #b91c1c; }

.blog-admin .tabs {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 10px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: var(--shadow-soft);
  margin: 14px 0 12px 0;
}

.blog-admin .tabs-left { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }

.blog-admin .tab {
  padding: 10px 12px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: rgba(2, 6, 23, 0.02);
  color: rgba(15, 23, 42, 0.86);
  font-size: 13px;
  cursor: pointer;
  user-select: none;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.blog-admin .tab:hover { transform: translateY(-1px); box-shadow: 0 14px 28px rgba(2, 6, 23, 0.08); }
.blog-admin .tab.active {
  background: rgba(124, 58, 237, 0.12);
  border-color: rgba(124, 58, 237, 0.35);
  box-shadow: 0 14px 30px rgba(124, 58, 237, 0.12);
}

.blog-admin .count {
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--border);
  font-size: 12px;
  color: rgba(15, 23, 42, 0.82);
}

.blog-admin .table-wrap { overflow: hidden; }
.blog-admin table { width: 100%; border-collapse: separate; border-spacing: 0; }

.blog-admin thead th {
  text-align: left;
  font-size: 12px;
  color: var(--muted);
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.9);
}

.blog-admin tbody td {
  padding: 14px 14px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  font-size: 13px;
  vertical-align: middle;
}

.blog-admin tbody tr { transition: background 0.15s ease; }
.blog-admin tbody tr:nth-child(odd) { background: rgba(2, 6, 23, 0.012); }
.blog-admin tbody tr:nth-child(even) { background: rgba(255, 255, 255, 0.9); }
.blog-admin tbody tr:hover { background: rgba(124, 58, 237, 0.05); }

.blog-admin .mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New",
    monospace;
  font-size: 12px;
}

.blog-admin .sub { color: var(--muted); font-size: 12px; margin-top: 4px; }

.blog-admin .status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 999px;
  padding: 8px 10px;
  font-size: 12px;
  border: 1px solid var(--border);
  background: var(--chip-bg);
  white-space: nowrap;
}
.blog-admin .status .s-dot { width: 9px; height: 9px; border-radius: 999px; background: rgba(15, 23, 42, 0.25); }
.blog-admin .status.draft .s-dot { background: var(--warn); }
.blog-admin .status.published .s-dot { background: var(--ok); }

.blog-admin .table-actions { display: flex; justify-content: flex-end; gap: 8px; }

.blog-admin .icon-btn {
  width: 38px;
  height: 38px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.blog-admin .icon-btn:hover { transform: translateY(-1px); box-shadow: 0 14px 28px rgba(2, 6, 23, 0.08); }
.blog-admin .icon-btn:active { transform: translateY(0); }

.blog-admin .pager {
  margin-top: 12px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: var(--shadow-soft);
}
.blog-admin .pager-left { color: var(--muted); font-size: 12px; }
.blog-admin .pager-right { display: flex; align-items: center; gap: 8px; }

.blog-admin .page-btn {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.95);
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  user-select: none;
}
.blog-admin .page-btn:hover { transform: translateY(-1px); box-shadow: 0 14px 28px rgba(2, 6, 23, 0.08); }
.blog-admin .page-btn:active { transform: translateY(0); }

.blog-admin .page-num {
  min-width: 44px;
  height: 40px;
  padding: 0 12px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: rgba(2, 6, 23, 0.02);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 800;
}

.blog-admin .alert {
  margin-bottom: 12px;
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  font-weight: 700;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: var(--shadow-soft);
}
.blog-admin .alert.ok { border-color: rgba(22, 163, 74, 0.22); background: rgba(22, 163, 74, 0.08); color: #166534; }
.blog-admin .alert.err { border-color: rgba(239, 68, 68, 0.22); background: rgba(239, 68, 68, 0.08); color: #991b1b; }

.blog-admin .overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.35);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
  z-index: 30;
}
.blog-admin .overlay.show { opacity: 1; pointer-events: auto; }

.blog-admin .drawer {
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  width: min(45%, 560px);
  max-width: 92vw;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-left: 1px solid var(--border);
  box-shadow: var(--shadow);
  transform: translateX(102%);
  transition: transform 0.26s cubic-bezier(0.2, 0.8, 0.2, 1);
  z-index: 35;
  display: flex;
  flex-direction: column;
}
.blog-admin .drawer.show { transform: translateX(0); }

.blog-admin .drawer-head {
  padding: 16px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.blog-admin .drawer-title { display: flex; flex-direction: column; gap: 2px; }
.blog-admin .drawer-title h4 { margin: 0; font-size: 14px; }
.blog-admin .drawer-title p { margin: 0; font-size: 12px; color: var(--muted); }

.blog-admin .drawer-body { padding: 16px; overflow: auto; }

.blog-admin .section {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: var(--shadow-soft);
  padding: 14px;
  margin-bottom: 12px;
}
.blog-admin .section h5 { margin: 0 0 10px 0; font-size: 13px; }

.blog-admin .split { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }

.blog-admin .divider { height: 1px; background: rgba(15, 23, 42, 0.06); margin: 10px 0; }

@media (max-width: 980px) {
  .blog-admin .stat { grid-column: span 6; }
  .blog-admin .filters { grid-template-columns: 1fr; }
  .blog-admin .drawer { width: 92vw; }
}

@media (max-width: 560px) {
  .blog-admin .stat { grid-column: span 12; }
  .blog-admin .split { grid-template-columns: 1fr; }
}
`;

const initialForm = {
  title: "",
  summary: "",
  content: "",
  tags: "",
  status: "DRAFT" as BlogStatus,
  coverImage: "",
};

export function BlogAdminPage() {
  const [items, setItems] = useState<BlogAdminItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | BlogStatus>("");

  const [editing, setEditing] = useState<BlogAdminItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [coverImageFile, setCoverImageFile] = useState<File | undefined>(undefined);
  const submitBtnRef = useRef<HTMLButtonElement | null>(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);
  const publishedCount = useMemo(() => items.filter((i) => i.status === "PUBLISHED").length, [items]);
  const draftCount = useMemo(() => items.filter((i) => i.status === "DRAFT").length, [items]);
  const viewSum = useMemo(() => items.reduce((s, it) => s + Number(it.views || 0), 0), [items]);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminListBlogs({ page, pageSize, q, status: statusFilter });
      setItems(res.items || []);
      setTotal(res.total || 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được danh sách blog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [page, pageSize, q, statusFilter]);

  useEffect(() => {
    if (!formOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFormOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onEsc);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onEsc);
    };
  }, [formOpen]);

  useEffect(() => {
    if (!formOpen) return;
    window.setTimeout(() => submitBtnRef.current?.focus(), 0);
  }, [formOpen]);

  const resetForm = () => {
    setEditing(null);
    setForm(initialForm);
    setCoverImageFile(undefined);
    setFormOpen(false);
  };

  const startCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setCoverImageFile(undefined);
    setFormOpen(true);
  };

  const startEdit = (item: BlogAdminItem) => {
    setEditing(item);
    setForm({
      title: item.title,
      summary: item.summary || "",
      content: item.content,
      tags: (item.tags || []).join(", "),
      status: item.status,
      coverImage: item.coverImage || "",
    });
    setCoverImageFile(undefined);
    setFormOpen(true);
  };

  const submitForm = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const payload = {
      title: form.title,
      summary: form.summary,
      content: form.content,
      tags: form.tags
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      status: form.status,
      coverImage: form.coverImage,
    };

    try {
      let blogId: number | null = null;

      if (editing) {
        const updated = await adminUpdateBlog(editing.id, payload);
        blogId = updated.id;
        setMessage("Đã cập nhật bài viết.");
      } else {
        const created = await adminCreateBlog(payload);
        blogId = created.id;
        setMessage("Đã tạo bài viết mới.");
      }

      if (coverImageFile && blogId) {
        try {
          const uploaded = await adminUploadCoverImage(blogId, coverImageFile);
          if (uploaded.coverImageUrl) {
            await adminUpdateBlog(blogId, { coverImage: uploaded.coverImageUrl });
          }
          setMessage((m) => (m ? m + " Đã upload cover." : "Đã upload cover."));
        } catch (e) {
          setError(e instanceof Error ? e.message : "Upload cover thất bại");
        }
      }

      resetForm();
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể lưu bài viết");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: BlogAdminItem) => {
    const ok = window.confirm(`Xóa bài "${item.title}"?`);
    if (!ok) return;
    setError("");
    setMessage("");
    try {
      await adminDeleteBlog(item.id);
      setMessage("Đã xóa bài viết.");
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xóa thất bại");
    }
  };

  const runCleanup = async () => {
    setError("");
    setMessage("");
    try {
      await clearBlogViewTracking();
      setMessage("Đã clear tracker blog views.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cleanup thất bại");
    }
  };

  const tabs = useMemo(
    () => [
      { key: "" as const, label: "Tất cả", count: total },
      { key: "DRAFT" as const, label: "Draft", count: draftCount },
      { key: "PUBLISHED" as const, label: "Published", count: publishedCount },
    ],
    [draftCount, publishedCount, total],
  );

  const pagerText = useMemo(() => {
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * pageSize;
    const showingFrom = total === 0 ? 0 : start + 1;
    const showingTo = Math.min(start + items.length, total);
    return `Hiển thị ${showingFrom}-${showingTo} / ${total} • Trang ${safePage}/${totalPages}`;
  }, [items.length, page, pageSize, total, totalPages]);

  return (
    <>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
      <style>{PAGE_CSS}</style>
      <div className="blog-admin">
        <div className="app">
          <div className="topbar">
            <div className="topbar-inner">
              <div className="brand">
                <div className="logo">AB</div>
                <div>
                  <h1>Admin • Quản lý bài viết</h1>
                  <p>UI đồng bộ theo trang quản lý đơn hàng (glass + gradient + drawer)</p>
                </div>
              </div>

              <div className="top-actions">
                <div className={`loading ${loading ? "show" : ""}`}>
                  <div className="spinner" />
                  Đang tải dữ liệu...
                </div>

                <div className="pill" title="Làm mới" onClick={() => void loadData()}>
                  <span className="dot" />
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Refresh</span>
                  <i className="fa-solid fa-rotate-right" style={{ opacity: 0.7 }} />
                </div>

                <div className="pill" title="Tạo bài viết" onClick={startCreate}>
                  <i className="fa-solid fa-pen-to-square" style={{ opacity: 0.85 }} />
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Tạo bài</span>
                </div>

                <div className="pill" title="Cleanup view tracker" onClick={() => void runCleanup()}>
                  <i className="fa-solid fa-broom" style={{ opacity: 0.85 }} />
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Clear tracker</span>
                </div>
              </div>
            </div>
          </div>

          <div className="container">
            <div className="page-title">
              <div>
                <h2>Quản lý bài viết</h2>
                <p className="hint">Tìm kiếm theo tiêu đề/slug, lọc trạng thái, tạo/sửa bằng drawer bên phải.</p>
              </div>
              <div className="pill" title="Demo export" onClick={() => setMessage("Export demo: bạn có thể map sang CSV/Excel sau.")}>
                <i className="fa-solid fa-file-arrow-down" style={{ opacity: 0.85 }} />
                <span style={{ fontSize: 13, fontWeight: 700 }}>Export</span>
              </div>
            </div>

            {message ? <div className="alert ok">{message}</div> : null}
            {error ? <div className="alert err">{error}</div> : null}

            <div className="stats">
              <div className="card stat">
                <div className="bg" />
                <p className="label">Tổng bài (theo API)</p>
                <div className="row">
                  <p className="value">{total}</p>
                  <span className="badge-mini">
                    <span className="spark" />
                    All
                  </span>
                </div>
              </div>

              <div className="card stat">
                <div className="bg" />
                <p className="label">Bài trên trang hiện tại</p>
                <div className="row">
                  <p className="value">{items.length}</p>
                  <span className="badge-mini">
                    <span className="spark" />
                    Page
                  </span>
                </div>
              </div>

              <div className="card stat">
                <div className="bg" />
                <p className="label">Đã xuất bản (trang hiện tại)</p>
                <div className="row">
                  <p className="value">{publishedCount}</p>
                  <span className="badge-mini">
                    <span className="spark" />
                    Published
                  </span>
                </div>
              </div>

              <div className="card stat">
                <div className="bg" />
                <p className="label">Tổng views (trang hiện tại)</p>
                <div className="row">
                  <p className="value">{viewSum}</p>
                  <span className="badge-mini">
                    <span className="spark" />
                    Views
                  </span>
                </div>
              </div>
            </div>

            <div className="card panel">
              <div className="panel-head">
                <h3>
                  <i className="fa-solid fa-filter" style={{ opacity: 0.8 }} /> Bộ lọc
                </h3>
                <div className="right">
                  <span>Tip:</span>
                  <span>gõ slug hoặc từ khoá trong tiêu đề</span>
                </div>
              </div>

              <div className="filters">
                <div>
                  <label>Tìm kiếm (tiêu đề, slug, tóm tắt)</label>
                  <input
                    className="input"
                    value={qInput}
                    onChange={(e) => setQInput(e.target.value)}
                    placeholder="VD: skincare / routine / slug-bai-viet"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setPage(1);
                        setQ(qInput.trim());
                      }
                    }}
                  />
                </div>
                <div>
                  <label>Trạng thái</label>
                  <select
                    className="input"
                    value={statusFilter}
                    onChange={(e) => {
                      setPage(1);
                      setStatusFilter(e.target.value as "" | BlogStatus);
                    }}
                  >
                    <option value="">Tất cả</option>
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                  </select>
                </div>
              </div>

              <div className="actions">
                <button
                  className="btn ghost"
                  type="button"
                  onClick={() => {
                    setQInput("");
                    setQ("");
                    setStatusFilter("");
                    setPage(1);
                    setMessage("Đã reset bộ lọc.");
                    setError("");
                  }}
                >
                  <i className="fa-solid fa-eraser" style={{ opacity: 0.85 }} /> Reset
                </button>

                <button
                  className="btn primary"
                  type="button"
                  onClick={() => {
                    setPage(1);
                    setQ(qInput.trim());
                  }}
                >
                  <i className="fa-solid fa-magnifying-glass" style={{ opacity: 0.95 }} /> Áp dụng
                </button>
              </div>
            </div>

            <div className="tabs">
              <div className="tabs-left">
                {tabs.map((t) => (
                  <div
                    key={t.key}
                    className={`tab ${t.key === statusFilter ? "active" : ""}`}
                    onClick={() => {
                      setPage(1);
                      setStatusFilter(t.key as "" | BlogStatus);
                      setMessage(`Đã lọc: ${t.label}`);
                      setError("");
                    }}
                  >
                    <i className="fa-solid fa-layer-group" style={{ opacity: 0.75 }} />
                    <span>{t.label}</span>
                    <span className="count">{t.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: "44%" }}>Bài viết</th>
                    <th style={{ width: "16%" }}>Trạng thái</th>
                    <th style={{ width: "12%" }}>Views</th>
                    <th style={{ width: "18%" }}>Cập nhật</th>
                    <th style={{ width: "10%", textAlign: "right" }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} style={{ padding: "26px 14px", color: "#64748b", background: "rgba(255,255,255,.9)" }}>
                        Đang tải...
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: "26px 14px", color: "#64748b", background: "rgba(255,255,255,.9)" }}>
                        Không có dữ liệu.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div style={{ fontWeight: 900 }}>{item.title}</div>
                          <div className="sub mono">{item.slug}</div>
                        </td>
                        <td>
                          <span className={`status ${item.status === "PUBLISHED" ? "published" : "draft"}`}>
                            <span className="s-dot" />
                            <span style={{ fontWeight: 800 }}>{item.status === "PUBLISHED" ? "Published" : "Draft"}</span>
                          </span>
                        </td>
                        <td>{item.views}</td>
                        <td>{new Date(item.updatedAt).toLocaleString("vi-VN")}</td>
                        <td style={{ textAlign: "right" }}>
                          <div className="table-actions">
                            <button className="icon-btn" title="Sửa" onClick={() => startEdit(item)}>
                              <i className="fa-solid fa-pen" />
                            </button>
                            <button className="icon-btn" title="Xóa" onClick={() => void handleDelete(item)}>
                              <i className="fa-solid fa-trash" style={{ color: "#b91c1c" }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="pager">
              <div className="pager-left">{pagerText}</div>
              <div className="pager-right">
                <button
                  className="page-btn"
                  title="Trang trước"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  style={{ opacity: page <= 1 ? 0.5 : 1, cursor: page <= 1 ? "not-allowed" : "pointer" }}
                >
                  <i className="fa-solid fa-chevron-left" />
                </button>

                <span className="page-num">{Math.min(Math.max(1, page), totalPages)}</span>

                <button
                  className="page-btn"
                  title="Trang sau"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  style={{ opacity: page >= totalPages ? 0.5 : 1, cursor: page >= totalPages ? "not-allowed" : "pointer" }}
                >
                  <i className="fa-solid fa-chevron-right" />
                </button>
              </div>
            </div>
          </div>

          <div className={`overlay ${formOpen ? "show" : ""}`} onClick={() => setFormOpen(false)} />

          <aside className={`drawer ${formOpen ? "show" : ""}`} aria-hidden={!formOpen}>
            <div className="drawer-head">
              <div className="drawer-title">
                <h4>{editing ? `Chỉnh sửa • #${editing.id}` : "Tạo bài viết mới"}</h4>
                <p>{editing ? `${editing.title}` : "Nhập nội dung và lưu (Draft/Published)"}</p>
              </div>
              <button className="icon-btn" title="Đóng" onClick={() => setFormOpen(false)}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="drawer-body">
              <form onSubmit={submitForm}>
                <div className="section">
                  <h5>
                    <i className="fa-solid fa-font" style={{ opacity: 0.8 }} /> Thông tin cơ bản
                  </h5>

                  <div style={{ marginBottom: 10 }}>
                    <label>Tiêu đề *</label>
                    <input
                      className="input"
                      value={form.title}
                      onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                      placeholder="VD: 5 bước skincare buổi tối"
                    />
                  </div>

                  <div className="split">
                    <div>
                      <label>Trạng thái</label>
                      <select className="input" value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value as BlogStatus }))}>
                        <option value="DRAFT">Draft</option>
                        <option value="PUBLISHED">Published</option>
                      </select>
                    </div>
                    <div>
                      <label>Tags (dấu phẩy)</label>
                      <input
                        className="input"
                        value={form.tags}
                        onChange={(e) => setForm((s) => ({ ...s, tags: e.target.value }))}
                        placeholder="vd: skincare, routine, tips"
                      />
                    </div>
                  </div>
                </div>

                <div className="section">
                  <h5>
                    <i className="fa-solid fa-align-left" style={{ opacity: 0.8 }} /> Nội dung
                  </h5>

                  <div style={{ marginBottom: 10 }}>
                    <label>Tóm tắt</label>
                    <textarea
                      className="input"
                      style={{ minHeight: 90 }}
                      value={form.summary}
                      onChange={(e) => setForm((s) => ({ ...s, summary: e.target.value }))}
                      placeholder="1-2 câu mô tả ngắn..."
                    />
                  </div>

                  <div>
                    <label>Nội dung *</label>
                    <textarea
                      className="input"
                      value={form.content}
                      onChange={(e) => setForm((s) => ({ ...s, content: e.target.value }))}
                      placeholder="Bạn có thể dùng Markdown/HTML tuỳ backend..."
                    />
                  </div>
                </div>

                <div className="section">
                  <h5>
                    <i className="fa-solid fa-image" style={{ opacity: 0.8 }} /> Cover
                  </h5>

                  <div className="split">
                    <div>
                      <label>Cover image URL</label>
                      <input
                        className="input"
                        value={form.coverImage}
                        onChange={(e) => setForm((s) => ({ ...s, coverImage: e.target.value }))}
                        placeholder="https://..."
                      />
                      <div className="sub">Nếu có file upload, URL có thể để trống.</div>
                    </div>
                    <div>
                      <label>Cover image file</label>
                      <input className="input" type="file" accept="image/*" onChange={(e) => setCoverImageFile(e.target.files?.[0])} />
                      <div className="sub">Chọn file sẽ gửi multipart theo API hiện tại.</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, paddingBottom: 8, flexWrap: "wrap" }}>
                  <button ref={submitBtnRef} className="btn primary" type="submit" disabled={saving}>
                    <i className="fa-solid fa-circle-check" style={{ opacity: 0.95 }} />
                    {saving ? "Đang lưu..." : editing ? "Cập nhật" : "Tạo bài"}
                  </button>
                  <button className="btn ghost" type="button" onClick={resetForm}>
                    <i className="fa-solid fa-ban" style={{ opacity: 0.85 }} /> Hủy
                  </button>
                </div>
              </form>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}