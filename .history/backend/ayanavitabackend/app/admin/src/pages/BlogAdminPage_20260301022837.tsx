import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  adminCleanupViewTrackers,
  adminCreateBlog,
  adminDeleteBlog,
  adminListBlogs,
  adminUpdateBlog,
  BlogAdminItem,
  BlogStatus,
} from "../api/blogAdmin.api";

const initialForm = {
  title: "",
  summary: "",
  content: "",
  tags: "",
  status: "DRAFT" as BlogStatus,
  coverImage: "",
};

const PAGE_CSS = `
.blog-admin {
  --bg: #ffffff;
  --text: #0f172a;
  --muted: #64748b;
  --border: rgba(15, 23, 42, 0.1);
  --shadow: 0 20px 45px rgba(2, 6, 23, 0.12);
  --shadow-soft: 0 12px 28px rgba(2, 6, 23, 0.08);
  --radius: 18px;
  --radius-sm: 12px;
  --grad: linear-gradient(135deg, #7c3aed, #06b6d4);
  --ok: #16a34a;
  --warn: #f59e0b;
  --focus: 0 0 0 4px rgba(124, 58, 237, 0.18);
  color: var(--text);
}

.blog-admin .topbar {
  position: sticky;
  top: 0;
  z-index: 5;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--border);
}

.blog-admin .topbar-inner,
.blog-admin .container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 18px;
}

.blog-admin .topbar-inner { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
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
}
.blog-admin .brand h1 { font-size: 16px; margin: 0; }
.blog-admin .brand p { margin: 2px 0 0 0; font-size: 12px; color: var(--muted); }

.blog-admin .pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: #fff;
  box-shadow: var(--shadow-soft);
  padding: 10px 14px;
  font-weight: 700;
  cursor: pointer;
}

.blog-admin .container { padding-bottom: 30px; }
.blog-admin .page-title { margin-top: 12px; margin-bottom: 16px; }
.blog-admin .page-title h2 { margin: 0; font-size: 26px; }
.blog-admin .hint { margin: 6px 0 0 0; color: var(--muted); }

.blog-admin .stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

.blog-admin .card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-soft);
  padding: 14px;
}
.blog-admin .card h3 { margin: 0; font-size: 13px; color: var(--muted); }
.blog-admin .card .value { margin: 6px 0 0 0; font-size: 26px; font-weight: 800; }

.blog-admin .filters {
  display: grid;
  grid-template-columns: 2fr 1fr auto;
  gap: 10px;
  align-items: end;
  margin-bottom: 14px;
}
.blog-admin label { display: block; margin-bottom: 6px; color: var(--muted); font-size: 13px; }
.blog-admin input,
.blog-admin textarea,
.blog-admin select {
  width: 100%;
  border: 1px solid var(--border);
  background: #fff;
  border-radius: 12px;
  padding: 10px 12px;
  outline: none;
  font: inherit;
}
.blog-admin textarea { min-height: 120px; resize: vertical; }
.blog-admin input:focus,
.blog-admin textarea:focus,
.blog-admin select:focus { box-shadow: var(--focus); border-color: #7c3aed; }

.blog-admin .btn-row { display: flex; gap: 8px; }
.blog-admin .btn {
  border: 1px solid var(--border);
  border-radius: 12px;
  background: white;
  padding: 10px 12px;
  cursor: pointer;
  font-weight: 700;
}
.blog-admin .btn.primary { background: var(--grad); color: #fff; border: 0; }
.blog-admin .btn.danger { color: #b91c1c; }
.blog-admin .btn:disabled { opacity: 0.55; cursor: not-allowed; }

.blog-admin .table-wrap { overflow-x: auto; }
.blog-admin table { width: 100%; border-collapse: collapse; }
.blog-admin th,
.blog-admin td { padding: 10px; border-bottom: 1px solid var(--border); text-align: left; vertical-align: top; }
.blog-admin th { font-size: 12px; text-transform: uppercase; color: var(--muted); }

.blog-admin .status-pill { display: inline-flex; border-radius: 999px; padding: 5px 10px; font-size: 12px; font-weight: 700; }
.blog-admin .status-pill.draft { background: rgba(245, 158, 11, 0.18); color: #92400e; }
.blog-admin .status-pill.published { background: rgba(22, 163, 74, 0.18); color: #166534; }

.blog-admin .pagination { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; }
.blog-admin .alert { margin-bottom: 12px; border-radius: var(--radius-sm); padding: 10px 12px; font-weight: 600; }
.blog-admin .alert.ok { background: rgba(22, 163, 74, 0.12); color: #166534; }
.blog-admin .alert.err { background: rgba(239, 68, 68, 0.12); color: #991b1b; }

.blog-admin .overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.55);
  display: grid;
  place-items: center;
  z-index: 30;
  padding: 16px;
}

.blog-admin .modal {
  width: min(860px, 100%);
  max-height: calc(100vh - 40px);
  overflow: auto;
  background: #fff;
  border-radius: 20px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
  padding: 16px;
}
.blog-admin .modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.blog-admin .modal-head h3 { margin: 0; font-size: 20px; }
.blog-admin .form-grid { display: grid; gap: 10px; }
.blog-admin .split { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }

@media (max-width: 900px) {
  .blog-admin .stats { grid-template-columns: 1fr; }
  .blog-admin .filters,
  .blog-admin .split { grid-template-columns: 1fr; }
}
`;

export function BlogAdminPage() {
  const [items, setItems] = useState<BlogAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
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

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);
  const publishedCount = useMemo(() => items.filter((i) => i.status === "PUBLISHED").length, [items]);

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
      title: form.title.trim(),
      summary: form.summary.trim(),
      content: form.content.trim(),
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      status: form.status,
      coverImage: form.coverImage.trim() || undefined,
    };

    try {
      if (!payload.title || !payload.content) {
        throw new Error("Tiêu đề và nội dung là bắt buộc");
      }

      if (editing) {
        await adminUpdateBlog(editing.id, payload, coverImageFile);
        setMessage("Đã cập nhật bài viết");
      } else {
        await adminCreateBlog(payload, coverImageFile);
        setMessage("Đã tạo bài viết mới");
      }
      resetForm();
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lưu blog thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: BlogAdminItem) => {
    if (!confirm(`Xóa bài viết "${item.title}"?`)) return;
    try {
      await adminDeleteBlog(item.id);
      setMessage("Đã xóa bài viết");
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xóa blog thất bại");
    }
  };

  const runCleanup = async () => {
    try {
      await adminCleanupViewTrackers();
      setMessage("Đã chạy cleanup view tracker");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể cleanup tracker");
    }
  };

  return (
    <>
      <style>{PAGE_CSS}</style>
      <div className="blog-admin">
        <div className="topbar">
          <div className="topbar-inner">
            <div className="brand">
              <div className="logo">AB</div>
              <div>
                <h1>Admin • Quản lý bài viết</h1>
                <p>Thiết kế đồng bộ theo trang quản lý đơn hàng</p>
              </div>
            </div>
            <button className="pill" type="button" onClick={runCleanup}>Clear tracker</button>
          </div>
        </div>

        <div className="container">
          <div className="page-title">
            <h2>Blog Admin Dashboard</h2>
            <p className="hint">Quản lý nội dung, tối ưu trải nghiệm tạo/sửa bằng modal.</p>
          </div>

          {message ? <div className="alert ok">{message}</div> : null}
          {error ? <div className="alert err">{error}</div> : null}

          <div className="stats">
            <div className="card"><h3>Tổng bài viết</h3><p className="value">{total}</p></div>
            <div className="card"><h3>Đã xuất bản</h3><p className="value">{publishedCount}</p></div>
            <div className="card"><h3>Bản nháp</h3><p className="value">{Math.max(0, total - publishedCount)}</p></div>
          </div>

          <div className="card filters">
            <div>
              <label>Tìm kiếm</label>
              <input value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder="Tiêu đề, tóm tắt..." />
            </div>
            <div>
              <label>Trạng thái</label>
              <select
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
            <div className="btn-row">
              <button
                className="btn"
                onClick={() => {
                  setPage(1);
                  setQ(qInput.trim());
                }}
              >
                Lọc
              </button>
              <button className="btn primary" onClick={startCreate}>Tạo bài viết</button>
            </div>
          </div>

          <div className="card table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tiêu đề</th>
                  <th>Trạng thái</th>
                  <th>Views</th>
                  <th>Cập nhật</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5}>Đang tải...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={5}>Không có dữ liệu</td></tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.title}</strong>
                        <div style={{ color: "#64748b", fontSize: 12 }}>{item.slug}</div>
                      </td>
                      <td>
                        <span className={`status-pill ${item.status === "PUBLISHED" ? "published" : "draft"}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>{item.views}</td>
                      <td>{new Date(item.updatedAt).toLocaleString("vi-VN")}</td>
                      <td>
                        <div className="btn-row">
                          <button className="btn" onClick={() => startEdit(item)}>Sửa</button>
                          <button className="btn danger" onClick={() => void handleDelete(item)}>Xóa</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="pagination">
              <button className="btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Trang trước</button>
              <span>{page}/{totalPages}</span>
              <button className="btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Trang sau</button>
            </div>
          </div>
        </div>

        {formOpen ? (
          <div className="overlay" onClick={() => setFormOpen(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h3>{editing ? `Chỉnh sửa #${editing.id}` : "Tạo bài viết mới"}</h3>
                <button className="btn" onClick={() => setFormOpen(false)}>Đóng</button>
              </div>
              <form className="form-grid" onSubmit={submitForm}>
                <div>
                  <label>Tiêu đề</label>
                  <input value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} />
                </div>
                <div>
                  <label>Tóm tắt</label>
                  <textarea style={{ minHeight: 80 }} value={form.summary} onChange={(e) => setForm((s) => ({ ...s, summary: e.target.value }))} />
                </div>
                <div>
                  <label>Nội dung</label>
                  <textarea value={form.content} onChange={(e) => setForm((s) => ({ ...s, content: e.target.value }))} />
                </div>
                <div className="split">
                  <div>
                    <label>Tags (dấu phẩy)</label>
                    <input value={form.tags} onChange={(e) => setForm((s) => ({ ...s, tags: e.target.value }))} />
                  </div>
                  <div>
                    <label>Trạng thái</label>
                    <select value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value as BlogStatus }))}>
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label>Cover image URL</label>
                  <input value={form.coverImage} onChange={(e) => setForm((s) => ({ ...s, coverImage: e.target.value }))} />
                </div>
                <div>
                  <label>Cover image file</label>
                  <input type="file" accept="image/*" onChange={(e) => setCoverImageFile(e.target.files?.[0])} />
                </div>
                <div className="btn-row">
                  <button className="btn primary" type="submit" disabled={saving}>{saving ? "Đang lưu..." : editing ? "Cập nhật" : "Đăng bài"}</button>
                  <button className="btn" type="button" onClick={resetForm}>Hủy</button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
