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
  const [form, setForm] = useState(initialForm);
  const [coverImageFile, setCoverImageFile] = useState<File | undefined>(undefined);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

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

  const resetForm = () => {
    setEditing(null);
    setForm(initialForm);
    setCoverImageFile(undefined);
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
    if (!confirm(`Xóa bài viết \"${item.title}\"?`)) return;
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
    <div className="grid" style={{ gap: 14 }}>
      <section className="card hero-card" style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
        <div>
          <p className="muted" style={{ margin: 0 }}>Blog management</p>
          <h1 className="h1" style={{ marginTop: 8 }}>Quản lý đăng blog</h1>
          <p className="muted" style={{ marginBottom: 0 }}>
            Giao diện quản trị bài viết cho admin, dùng API `/blogs/admin` để tạo/sửa/xóa và lọc dữ liệu.
          </p>
        </div>
        <button className="btn" type="button" onClick={runCleanup}>Clear view tracker</button>
      </section>

      {message ? <div className="app-alert app-alert-success"><div className="app-alert-content">{message}</div></div> : null}
      {error ? <div className="app-alert app-alert-error"><div className="app-alert-content">{error}</div></div> : null}

      <section className="card">
        <div className="grid grid-3" style={{ alignItems: "end" }}>
          <div>
            <label className="muted">Tìm kiếm</label>
            <input
              className="input"
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              placeholder="Tiêu đề, tóm tắt..."
            />
          </div>
          <div>
            <label className="muted">Trạng thái</label>
            <select
              className="select"
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
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn"
              onClick={() => {
                setPage(1);
                setQ(qInput.trim());
              }}
            >
              Lọc
            </button>
            <button className="btn" onClick={resetForm}>Tạo mới</button>
          </div>
        </div>
      </section>

      <section className="grid grid-2" style={{ alignItems: "start" }}>
        <article className="card" style={{ overflowX: "auto" }}>
          <h2 className="h2" style={{ marginTop: 0 }}>Danh sách bài viết ({total})</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Status</th>
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
                      <div style={{ fontWeight: 700 }}>{item.title}</div>
                      <div className="muted" style={{ fontSize: 12 }}>{item.slug}</div>
                    </td>
                    <td>{item.status}</td>
                    <td>{item.views}</td>
                    <td>{new Date(item.updatedAt).toLocaleString("vi-VN")}</td>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn" onClick={() => startEdit(item)}>Sửa</button>
                        <button className="btn btn-danger" onClick={() => void handleDelete(item)}>Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
            <button className="btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Trang trước</button>
            <span className="muted">{page}/{totalPages}</span>
            <button className="btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Trang sau</button>
          </div>
        </article>

        <article className="card">
          <h2 className="h2" style={{ marginTop: 0 }}>{editing ? `Chỉnh sửa #${editing.id}` : "Tạo bài viết mới"}</h2>
          <form className="grid" onSubmit={submitForm}>
            <div>
              <label className="muted">Tiêu đề</label>
              <input className="input" value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} />
            </div>
            <div>
              <label className="muted">Tóm tắt</label>
              <textarea className="textarea" style={{ minHeight: 80 }} value={form.summary} onChange={(e) => setForm((s) => ({ ...s, summary: e.target.value }))} />
            </div>
            <div>
              <label className="muted">Nội dung</label>
              <textarea className="textarea" value={form.content} onChange={(e) => setForm((s) => ({ ...s, content: e.target.value }))} />
            </div>
            <div className="grid grid-2">
              <div>
                <label className="muted">Tags (phân tách dấu phẩy)</label>
                <input className="input" value={form.tags} onChange={(e) => setForm((s) => ({ ...s, tags: e.target.value }))} />
              </div>
              <div>
                <label className="muted">Trạng thái</label>
                <select className="select" value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value as BlogStatus }))}>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </div>
            </div>
            <div>
              <label className="muted">Cover image URL (nếu không upload file)</label>
              <input className="input" value={form.coverImage} onChange={(e) => setForm((s) => ({ ...s, coverImage: e.target.value }))} />
            </div>
            <div>
              <label className="muted">Cover image file</label>
              <input className="input" type="file" accept="image/*" onChange={(e) => setCoverImageFile(e.target.files?.[0])} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? "Đang lưu..." : editing ? "Cập nhật" : "Đăng bài"}</button>
              {editing ? <button className="btn" type="button" onClick={resetForm}>Hủy</button> : null}
            </div>
          </form>
        </article>
      </section>
    </div>
  );
}
