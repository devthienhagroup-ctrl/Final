import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createAdminCategory,
  deleteAdminCategory,
  fetchAdminCategories,
  fetchAdminProducts,
  fetchCatalogLanguages,
  updateAdminCategory,
} from "../api/productAdmin.api";
import type { AdminLanguage, ProductAdminItem, ProductCategory } from "../types/productAdmin";

function classNames(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(" ");
}

export function ProductAdminListPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductAdminItem[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [languages, setLanguages] = useState<AdminLanguage[]>([]);
  const [activeLang, setActiveLang] = useState("vi");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft">("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [openCategoryModal, setOpenCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState<ProductCategory>({ id: "new", translations: [] });
  const [categoryTab, setCategoryTab] = useState<"list" | "detail">("list");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categoryDraft, setCategoryDraft] = useState<ProductCategory | null>(null);

  const categoryMap = useMemo(
      () =>
          Object.fromEntries(
              categories.map((item) => [
                item.id,
                item.translations.find((t) => t.lang === activeLang)?.name || item.translations[0]?.name || "",
              ]),
          ),
      [categories, activeLang],
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const langs = await fetchCatalogLanguages();
      const [productResponse, categoryList] = await Promise.all([
        fetchAdminProducts({
          search,
          status: statusFilter,
          categoryId: categoryFilter,
          page,
          pageSize,
        }),
        fetchAdminCategories(),
      ]);

      setLanguages(langs);
      setProducts(productResponse.items);
      setTotal(productResponse.total);
      setTotalPages(productResponse.totalPages);
      setCategories(categoryList);
      setActiveLang((prev) => langs.find((x) => x.code === prev)?.code || langs[0]?.code || "vi");
      setNewCategory({
        id: "new",
        translations: langs.map((lang) => ({ lang: lang.code, name: "", description: "" })),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [search, statusFilter, categoryFilter, page, pageSize]);

  // Inject FontAwesome CDN once (if not already on the page)
  useEffect(() => {
    const id = "fa-cdn-6";
    if (document.getElementById(id)) return;

    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css";
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
  }, []);

  const onCreateProduct = () => {
    navigate("/catalog/products/new");
  };

  const viOrActiveName = (product: ProductAdminItem) =>
      product.translations.find((item) => item.lang === activeLang)?.name ||
      product.translations.find((item) => item.lang === "vi")?.name ||
      "(chưa đặt tên)";

  const openCategoryEditor = (category: ProductCategory) => {
    setSelectedCategoryId(category.id);
    setCategoryDraft(JSON.parse(JSON.stringify(category)) as ProductCategory);
    setCategoryTab("detail");
  };

  const openCategoryCreator = () => {
    const draft = JSON.parse(JSON.stringify(newCategory)) as ProductCategory;
    setSelectedCategoryId("new");
    setCategoryDraft(draft);
    setCategoryTab("detail");
  };

  const closeCategoryModal = () => {
    setOpenCategoryModal(false);
    setCategoryTab("list");
    setSelectedCategoryId(null);
    setCategoryDraft(null);
  };

  return (
      <div className="x-wrap">
        <style>{styles}</style>

        {/* Top modern header */}
        <div className="x-topbar">
          <div className="x-topbar-left">
            <div className="x-title-row">
              <div className="x-title">Quản lý sản phẩm</div>
              <span className="x-pill x-pill-info">
              <i className="fa-solid fa-list" /> Danh sách
            </span>
              <span className="x-pill">
              <i className="fa-solid fa-box" /> Tổng: {total}
            </span>
            </div>
            <div className="x-subrow">
            <span className="x-chip">
              <i className="fa-solid fa-language" /> {activeLang.toUpperCase()}
            </span>
              <span
                  className={classNames(
                      "x-pill",
                      statusFilter === "active" ? "x-pill-ok" : statusFilter === "draft" ? "x-pill-warn" : "x-pill-muted",
                  )}
              >
              <i
                  className={
                    statusFilter === "active"
                        ? "fa-solid fa-check"
                        : statusFilter === "draft"
                            ? "fa-solid fa-pen"
                            : "fa-solid fa-circle-info"
                  }
              />{" "}
                {statusFilter === "all" ? "Tất cả" : statusFilter}
            </span>
              {categoryFilter ? (
                  <span className="x-chip">
                <i className="fa-solid fa-layer-group" /> {categoryMap[categoryFilter] || categoryFilter}
              </span>
              ) : null}
            </div>
          </div>

          <div className="x-topbar-actions">
            <button className="x-btn x-btn-primary" onClick={onCreateProduct}>
              <i className="fa-solid fa-plus" /> <span>Thêm sản phẩm</span>
            </button>
            <button
                className="x-btn"
                onClick={() => {
                  setOpenCategoryModal(true);
                  setCategoryTab("list");
                  setSelectedCategoryId(null);
                  setCategoryDraft(null);
                }}
            >
              <i className="fa-solid fa-folder-tree" /> <span>Quản lý category</span>
            </button>
          </div>
        </div>

        {/* Language selector + status filter */}
        <div className="x-toolbar">
          <div className="x-tabs" style={{ justifyContent: "space-between" }}>
            <div className="x-row x-row-wrap" style={{ gap: 8 }}>
              <button
                  className={classNames("x-tab", statusFilter === "all" && "x-tab-active")}
                  onClick={() => {
                    setPage(1);
                    setStatusFilter("all");
                  }}
              >
                <i className="fa-solid fa-list" /> <span>Tất cả</span>
              </button>
              <button
                  className={classNames("x-tab", statusFilter === "active" && "x-tab-active")}
                  onClick={() => {
                    setPage(1);
                    setStatusFilter("active");
                  }}
              >
                <i className="fa-solid fa-check" /> <span>Active</span>
              </button>
              <button
                  className={classNames("x-tab", statusFilter === "draft" && "x-tab-active")}
                  onClick={() => {
                    setPage(1);
                    setStatusFilter("draft");
                  }}
              >
                <i className="fa-solid fa-pen" /> <span>Draft</span>
              </button>
            </div>
          </div>
          <div className="x-langbar">
            <div className="x-toolbar-label">
              <i className="fa-solid fa-globe" /> Ngôn ngữ
            </div>
            <div className="x-lang-pills">
              {languages.map((l) => (
                  <button
                      key={l.code}
                      className={classNames("x-pill-btn", activeLang === l.code && "x-pill-btn-active")}
                      onClick={() => setActiveLang(l.code)}
                  >
                    <span className="x-pill-btn-dot" />
                    {l.label}
                    {activeLang === l.code ? <i className="fa-solid fa-check" /> : <i className="fa-regular fa-circle" />}
                  </button>
              ))}
            </div>
          </div>
        </div>

        <div className="x-content">

          {/* Filters */}
          <div className="x-card">
            <div className="x-grid2">
              <div className="x-field">
                <div className="x-label">Tìm kiếm</div>
                <div className="x-row" style={{ gap: 8 }}>
                  <input
                      className="x-input"
                      placeholder="Nhập SKU hoặc tên sản phẩm"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                  />
                  <button
                      className="x-btn"
                      onClick={() => {
                        setPage(1);
                        setSearch(searchInput.trim());
                      }}
                  >
                    <i className="fa-solid fa-magnifying-glass" /> <span>Tìm</span>
                  </button>
                </div>
                <div className="x-help">Mẹo: tìm theo SKU nhanh nhất.</div>
              </div>

              <label className="x-field">
                <div className="x-label">Category</div>
                <select
                    className="x-input"
                    value={categoryFilter}
                    onChange={(e) => {
                      setPage(1);
                      setCategoryFilter(e.target.value);
                    }}
                >
                  <option value="">Tất cả category</option>
                  {categories.map((item) => (
                      <option key={item.id} value={item.id}>
                        {categoryMap[item.id] || item.id}
                      </option>
                  ))}
                </select>
                <div className="x-help">Lọc theo danh mục để dễ kiểm soát.</div>
              </label>
            </div>
          </div>

          {/* List */}
          <div className="x-card">
            {loading ? (
                <div className="x-stack" style={{ marginTop: 0 }}>
                  <div className="x-skeleton-card" />
                  <div className="x-skeleton-card" />
                </div>
            ) : (
                <div className="x-prod-table" role="table" aria-label="Danh sách sản phẩm">
                  <div className="x-prod-thead" role="rowgroup">
                    <div className="x-prod-tr x-prod-tr-head" role="row">
                      <div className="x-prod-cell" role="columnheader">
                        SKU
                      </div>
                      <div className="x-prod-cell" role="columnheader">
                        Tên ({activeLang.toUpperCase()})
                      </div>
                      <div className="x-prod-cell" role="columnheader">
                        Category
                      </div>
                      <div className="x-prod-cell x-right" role="columnheader">
                        Giá
                      </div>
                      <div className="x-prod-cell" role="columnheader">
                        Trạng thái
                      </div>
                      <div className="x-prod-cell x-right" role="columnheader">
                        Hành động
                      </div>
                    </div>
                  </div>

                  <div className="x-prod-tbody" role="rowgroup">
                    {products.map((product) => (
                        <div key={product.id} className="x-prod-tr" role="row">
                          <div className="x-prod-cell" role="cell" data-label="SKU">
                      <span className="x-chip">
                        <i className="fa-solid fa-barcode" /> {product.sku}
                      </span>
                          </div>

                          <div className="x-prod-cell" role="cell" data-label={`Tên (${activeLang.toUpperCase()})`}>
                            <div style={{ fontWeight: 800 }}>{viOrActiveName(product)}</div>
                            <div className="x-help" style={{ marginTop: 4 }}>
                              ID: {product.id}
                            </div>
                          </div>

                          <div className="x-prod-cell" role="cell" data-label="Category">
                      <span className="x-chip">
                        <i className="fa-solid fa-layer-group" /> {categoryMap[product.categoryId] || "-"}
                      </span>
                          </div>

                          <div className="x-prod-cell x-right" role="cell" data-label="Giá">
                            <span className="x-pill x-pill-info">{product.price.toLocaleString("vi-VN")} đ</span>
                          </div>

                          <div className="x-prod-cell" role="cell" data-label="Trạng thái">
                      <span className={classNames("x-pill", product.status === "active" ? "x-pill-ok" : "x-pill-muted")}>
                        <i className={product.status === "active" ? "fa-solid fa-check" : "fa-solid fa-pen"} /> {product.status}
                      </span>
                          </div>

                          <div className="x-prod-cell x-right" role="cell" data-label="Hành động">
                            <Link className="x-btn" to={`/catalog/products/${product.id}`}>
                              <i className="fa-solid fa-pen-to-square" /> <span>Chỉnh sửa</span>
                            </Link>
                          </div>
                        </div>
                    ))}
                  </div>
                </div>
            )}

            <div className="x-row x-row-wrap" style={{ justifyContent: "space-between", marginTop: 12 }}>
              <div className="x-chip">
                <i className="fa-solid fa-file" /> Trang {page} / {totalPages}
              </div>
              <div className="x-row x-row-wrap" style={{ gap: 8 }}>
                <select
                    className="x-input"
                    style={{ width: 140 }}
                    value={pageSize}
                    onChange={(e) => {
                      setPage(1);
                      setPageSize(Number(e.target.value));
                    }}
                >
                  {[10, 20, 50].map((size) => (
                      <option key={size} value={size}>
                        {size}/trang
                      </option>
                  ))}
                </select>
                <button className="x-btn" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
                  <i className="fa-solid fa-arrow-left" /> <span>Trước</span>
                </button>
                <button
                    className="x-btn"
                    disabled={page >= totalPages}
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                >
                  <span>Sau</span> <i className="fa-solid fa-arrow-right" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Category modal */}
        {openCategoryModal ? (
            <div className="x-dialog-backdrop" onClick={closeCategoryModal}>
              <div className="x-dialog x-modal" onClick={(e) => e.stopPropagation()}>
                <div className="x-row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div className="x-dialog-title">
                      <i className="fa-solid fa-folder-tree" /> Quản lý category đa ngôn ngữ
                    </div>
                    <div className="x-help">Sửa theo ngôn ngữ đang chọn. Các nhãn khác chỉ để đối chiếu.</div>
                  </div>
                  <button className="x-icon-btn" onClick={closeCategoryModal} title="Đóng">
                    <i className="fa-solid fa-xmark" />
                  </button>
                </div>

                <div className="x-langbar" style={{ marginTop: 12 }}>
                  <div className="x-toolbar-label">
                    <i className="fa-solid fa-globe" /> Ngôn ngữ
                  </div>
                  <div className="x-lang-pills">
                    {languages.map((l) => (
                        <button
                            key={l.code}
                            className={classNames("x-pill-btn", activeLang === l.code && "x-pill-btn-active")}
                            onClick={() => setActiveLang(l.code)}
                        >
                          <span className="x-pill-btn-dot" />
                          {l.label}
                          {activeLang === l.code ? <i className="fa-solid fa-check" /> : <i className="fa-regular fa-circle" />}
                        </button>
                    ))}
                  </div>
                </div>

                {/* Tabs */}
                <div className="x-row" style={{ marginTop: 12, gap: 8 }}>
                  <button
                      className={classNames("x-tab-btn", categoryTab === "list" && "x-tab-btn-active")}
                      onClick={() => setCategoryTab("list")}
                  >
                    <i className="fa-solid fa-list" /> <span>Danh sách</span>
                  </button>
                  <button
                      className={classNames("x-tab-btn", categoryTab === "detail" && "x-tab-btn-active")}
                      onClick={() => setCategoryTab("detail")}
                      disabled={!categoryDraft}
                      title={!categoryDraft ? "Chọn một category ở tab Danh sách" : ""}
                  >
                    <i className="fa-solid fa-pen-to-square" /> <span>Chi tiết</span>
                  </button>
                  <div style={{ flex: 1 }} />
                  <button className="x-btn x-btn-primary" onClick={openCategoryCreator}>
                    <i className="fa-solid fa-plus" /> <span>Tạo mới</span>
                  </button>
                </div>

                {/* Tab: List */}
                {categoryTab === "list" ? (
                    <div className="x-card x-card-inner" style={{ marginTop: 12, padding: 12 }}>
                      <div className="x-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                        <div className="x-section-title" style={{ marginBottom: 0 }}>
                          <i className="fa-solid fa-folder-open" /> Danh sách category
                        </div>
                        <div className="x-help" style={{ marginTop: 0 }}>
                          Nhấn <strong>Sửa</strong> để qua tab Chi tiết.
                        </div>
                      </div>

                      <div className="x-stack" style={{ marginTop: 10 }}>
                        {categories.map((c) => {
                          const name =
                              c.translations.find((t) => t.lang === activeLang)?.name ||
                              c.translations[0]?.name ||
                              "(chưa đặt tên)";

                          return (
                              <div key={c.id} className="x-cat-row">
                                <div className="x-cat-main">
                                  <div className="x-cat-name">{name}</div>
                                  <div className="x-cat-meta">ID: {c.id}</div>
                                </div>
                                <button className="x-btn" onClick={() => openCategoryEditor(c)}>
                                  <i className="fa-solid fa-pen" /> <span>Sửa</span>
                                </button>
                              </div>
                          );
                        })}
                      </div>
                    </div>
                ) : null}

                {/* Tab: Detail */}
                {categoryTab === "detail" ? (
                    <div className="x-card x-card-inner" style={{ marginTop: 12, padding: 12 }}>
                      {!categoryDraft ? (
                          <div className="x-empty">
                            <i className="fa-regular fa-folder-open" /> Chọn một category ở tab <strong>Danh sách</strong>
                          </div>
                      ) : (
                          <>
                            <div className="x-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                              <div className="x-section-title" style={{ marginBottom: 0 }}>
                                <i className="fa-solid fa-pen-to-square" />
                                {selectedCategoryId === "new" ? "Tạo category" : `Sửa category #${selectedCategoryId}`}
                              </div>
                              {selectedCategoryId !== "new" ? (
                                  <button
                                      className="x-btn x-btn-danger"
                                      onClick={async () => {
                                        if (!selectedCategoryId) return;
                                        await deleteAdminCategory(selectedCategoryId);
                                        await loadData();
                                        setCategoryTab("list");
                                        setSelectedCategoryId(null);
                                        setCategoryDraft(null);
                                      }}
                                  >
                                    <i className="fa-solid fa-trash" /> <span>Xóa</span>
                                  </button>
                              ) : null}
                            </div>

                            <div className="x-grid2" style={{ marginTop: 10 }}>
                              <label className="x-field">
                                <div className="x-label">Tên ({activeLang.toUpperCase()})</div>
                                <input
                                    className="x-input"
                                    placeholder={`Tên category (${activeLang})`}
                                    value={categoryDraft.translations.find((t) => t.lang === activeLang)?.name || ""}
                                    onChange={(e) =>
                                        setCategoryDraft((prev) =>
                                            prev
                                                ? {
                                                  ...prev,
                                                  translations: prev.translations.map((row) =>
                                                      row.lang === activeLang ? { ...row, name: e.target.value } : row,
                                                  ),
                                                }
                                                : prev,
                                        )
                                    }
                                />
                              </label>
                              <label className="x-field">
                                <div className="x-label">Mô tả ({activeLang.toUpperCase()})</div>
                                <input
                                    className="x-input"
                                    placeholder={`Mô tả (${activeLang})`}
                                    value={
                                        categoryDraft.translations.find((t) => t.lang === activeLang)?.description || ""
                                    }
                                    onChange={(e) =>
                                        setCategoryDraft((prev) =>
                                            prev
                                                ? {
                                                  ...prev,
                                                  translations: prev.translations.map((row) =>
                                                      row.lang === activeLang
                                                          ? { ...row, description: e.target.value }
                                                          : row,
                                                  ),
                                                }
                                                : prev,
                                        )
                                    }
                                />
                              </label>
                            </div>

                            <div className="x-row x-row-wrap" style={{ gap: 8, marginTop: 10 }}>
                              {languages.map((lang) => {
                                const t = categoryDraft.translations.find((item) => item.lang === lang.code);
                                return (
                                    <span key={lang.code} className="x-chip">
                                      <strong>{lang.code.toUpperCase()}:</strong> {t?.name || "-"}
                                    </span>
                                );
                              })}
                            </div>

                            <div className="x-row" style={{ marginTop: 12, justifyContent: "space-between" }}>
                              <button
                                  className="x-btn"
                                  onClick={() => {
                                    setCategoryTab("list");
                                  }}
                              >
                                <i className="fa-solid fa-arrow-left" /> <span>Quay lại</span>
                              </button>
                              <button
                                  className="x-btn x-btn-primary"
                                  disabled={!categoryDraft.translations.some((row) => row.name.trim())}
                                  onClick={async () => {
                                    if (!categoryDraft.translations.some((row) => row.name.trim())) return;
                                    if (selectedCategoryId === "new") {
                                      await createAdminCategory(categoryDraft);
                                      setNewCategory({
                                        id: "new",
                                        translations: languages.map((lang) => ({ lang: lang.code, name: "", description: "" })),
                                      });
                                    } else {
                                      await updateAdminCategory(categoryDraft);
                                    }
                                    await loadData();
                                    setCategoryTab("list");
                                    setSelectedCategoryId(null);
                                    setCategoryDraft(null);
                                  }}
                              >
                                <i className="fa-solid fa-floppy-disk" /> <span>Lưu</span>
                              </button>
                            </div>
                          </>
                      )}
                    </div>
                ) : null}
              </div>
            </div>
        ) : null}
      </div>
  );
}

// Reuse the admin detail page style tokens (duplicated intentionally for consistency)
const styles = `
/* ===== Light Admin Theme ===== */
*, *::before, *::after {
  box-sizing: border-box;
}

.x-wrap{
  --bg: #f8fafc;
  --panel: rgba(0,0,0,0.02);
  --panel2: rgba(0,0,0,0.04);
  --stroke: rgba(0,0,0,0.08);
  --text: #0f172a;
  --muted: #475569;

  --brand1: #6d5efc;
  --brand2: #00008B;
  --ok: #10b981;
  --warn: #f59e0b;
  --danger: #ef4444;
  --info: #3b82f6;

  font-size: 13px;
  line-height: 1.4;
  color: var(--text);
  background: linear-gradient(145deg, #ffffff, #f1f5f9);
  min-height: 100vh;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.x-topbar{
  position: sticky;
  top: 0;
  z-index: 30;
  background: rgba(255,255,255,0.8);
  border: 1px solid var(--stroke);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 12px 12px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  min-height: 68px;
}

.x-topbar-left{ display: grid; gap: 6px; min-width: 260px; }
.x-title-row{ display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
.x-title{ font-size: 16px; font-weight: 800; letter-spacing: 0.2px; color: var(--text); }
.x-subrow{ display:flex; gap:8px; flex-wrap:wrap; }
.x-chip{
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--panel);
  border: 1px solid var(--stroke);
  color: var(--muted);
  display:inline-flex;
  gap: 8px;
  align-items:center;
}

.x-topbar-actions{ display:flex; gap: 8px; align-items:center; flex-wrap:wrap; }

.x-toolbar{
  border: 1px solid var(--stroke);
  background: rgba(255,255,255,0.6);
  border-radius: 16px;
  padding: 10px;
  display: flex;
    justify-content: space-between;
    align-items: center;
}

.x-langbar{
  display:flex;
  gap: 10px;
  align-items: flex-start;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.x-toolbar-label{
  color: var(--muted);
  display:flex;
  gap:8px;
  align-items:center;
  padding-top: 6px;
  white-space: nowrap;
}

.x-lang-pills{ display:flex; gap: 8px; flex-wrap: wrap; }

.x-pill-btn{
  border: 1px solid var(--stroke);
  background: var(--panel);
  color: var(--text);
  border-radius: 999px;
  padding: 7px 10px;
  display:inline-flex;
  gap: 8px;
  align-items:center;
  cursor:pointer;
  transition: transform .12s ease, background .12s ease, border-color .12s ease;
}
.x-pill-btn:hover{ transform: translateY(-1px); background: rgba(0,0,0,0.02); }
.x-pill-btn:active{ transform: translateY(0px) scale(0.98); }
.x-pill-btn-active{
  border-color: var(--brand2);
  background: linear-gradient(135deg, rgba(109,94,252,0.08), rgba(43,213,255,0.08));
}

.x-pill-btn-dot{
  width:8px; height:8px; border-radius:999px;
  background: var(--muted);
  box-shadow: 0 0 0 3px rgba(0,0,0,0.04);
}

.x-tabs{ display:flex; gap: 8px; flex-wrap: wrap; }
.x-tab{
  border: 1px solid var(--stroke);
  background: var(--panel);
  color: var(--muted);
  border-radius: 12px;
  padding: 8px 10px;
  display:inline-flex;
  gap: 8px;
  align-items:center;
  cursor:pointer;
  transition: transform .12s ease, background .12s ease, color .12s ease;
}
.x-tab:hover{ transform: translateY(-1px); background: rgba(0,0,0,0.02); color: var(--text); }
.x-tab:active{ transform: translateY(0px) scale(0.98); }
.x-tab-active{
  color: var(--text);
  border-color: var(--brand1);
  background: linear-gradient(135deg, rgba(109,94,252,0.12), rgba(43,213,255,0.08));
}

.x-content{ display:grid; gap: 12px; }

.x-card{
  border: 1px solid var(--stroke);
  background: #ffffff;
  border-radius: 16px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
}

.x-card-inner{
  background: var(--panel);
  border-radius: 14px;
  border: 1px solid var(--stroke);
}

.x-section-title{
  font-weight: 800;
  display:flex;
  gap: 10px;
  align-items:center;
  margin-bottom: 10px;
  letter-spacing: 0.2px;
  color: var(--text);
}

.x-help{ color: var(--muted); margin-top: 4px; line-height: 1.35; }
.x-warn{
  margin-top: 8px;
  color: var(--warn);
  background: rgba(245,158,11,0.08);
  border: 1px solid rgba(245,158,11,0.22);
  border-radius: 12px;
  padding: 8px 10px;
  display:inline-flex;
  gap: 8px;
  align-items:center;
}

.x-grid2{
  display:grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
@media (max-width: 860px){ .x-grid2{ grid-template-columns: 1fr; } }

.x-stack{ display:grid; gap: 10px; margin-top: 10px; }

.x-field{ display:grid; gap: 6px; }
.x-label{ color: var(--muted); font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.3px; }
.x-input{
  width: 100%;
  border-radius: 12px;
  border: 1px solid var(--stroke);
  background: #ffffff;
  color: var(--text);
  padding: 10px 10px;
  outline: none;
  transition: border-color .12s ease, transform .12s ease, background .12s ease;
}
.x-input:focus{
  border-color: var(--brand2);
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(43,213,255,0.1);
}

.x-row{ display:flex; gap: 10px; align-items:center; }
.x-row-wrap{ flex-wrap: wrap; }

.x-btn{
  border: 1px solid var(--stroke);
  background: var(--panel);
  color: var(--text);
  border-radius: 12px;
  padding: 9px 12px;
  display:inline-flex;
  gap: 8px;
  align-items:center;
  cursor:pointer;
  transition: transform .12s ease, background .12s ease, border-color .12s ease, box-shadow .12s ease;
  font-weight: 500;
  text-decoration: none;
}
.x-btn:hover{ transform: translateY(-1px); background: rgba(0,0,0,0.02); }
.x-btn:active{ transform: translateY(0px) scale(0.98); }
.x-btn:disabled{ opacity: 0.55; cursor:not-allowed; transform:none; }

.x-btn-primary{
  border-color: var(--brand1);
  background: linear-gradient(135deg, var(--brand1), var(--brand2));
  color: white;
  box-shadow: 0 4px 10px rgba(109,94,252,0.2);
}
.x-btn-primary:hover{ color: var(--brand1); box-shadow: 0 6px 14px rgba(43,213,255,0.25); }
.x-btn-danger{
  border-color: var(--danger);
  background: linear-gradient(135deg, var(--danger), #f87171);
  color: white;
}

.x-btn-danger:hover{ color: var(--danger); box-shadow: 0 6px 14px rgba(239,68,68,0.25); }

.x-icon-btn{
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: 1px solid var(--stroke);
  background: var(--panel);
  color: var(--text);
  display:inline-flex;
  align-items:center;
  justify-content:center;
  cursor:pointer;
  transition: transform .12s ease, background .12s ease, border-color .12s ease;
}
.x-icon-btn:hover{ transform: translateY(-1px); background: rgba(0,0,0,0.02); }
.x-icon-btn:active{ transform: translateY(0px) scale(0.98); }
.x-icon-btn:disabled{ opacity:0.55; cursor:not-allowed; transform:none; }

.x-pill{
  border-radius: 999px;
  padding: 6px 10px;
  border: 1px solid var(--stroke);
  background: var(--panel);
  color: var(--muted);
  display:inline-flex;
  gap: 8px;
  align-items:center;
  font-weight: 700;
  font-size: 12px;
}
.x-pill-ok{ border-color: var(--ok); background: rgba(16,185,129,0.1); color: var(--ok); }
.x-pill-warn{ border-color: var(--warn); background: rgba(245,158,11,0.1); color: var(--warn); }
.x-pill-info{ border-color: var(--info); background: rgba(59,130,246,0.1); color: var(--info); }
.x-pill-muted{ color: var(--muted); }

.x-right{ text-align:right; display:flex; justify-content:flex-end; }

.x-dialog-backdrop{
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 60%);
  z-index: 80;
  display:flex;
  align-items:center;
  justify-content:center;
  padding: 14px;
  backdrop-filter: blur(8px);
}
.x-dialog{
  width: min(520px, 100%);
  border-radius: 18px;
  border: 1px solid var(--stroke);
  background: #ffffff;
  box-shadow: 0 12px 30px rgba(0,0,0,0.08);
  padding: 14px;
  animation: xdialog .14s ease-out;
}
@keyframes xdialog{ from{ transform: translateY(6px); opacity:0.0;} to{ transform: translateY(0); opacity:1.0;} }
.x-dialog-title{ font-weight: 950; display:flex; gap: 10px; align-items:center; font-size: 14px; color: var(--text); }

.x-skeleton-card{
  border-radius: 16px;
  border: 1px solid var(--stroke);
  background: linear-gradient(90deg, var(--panel), var(--panel2), var(--panel));
  background-size: 200% 100%;
  animation: xsheen 1.1s ease-in-out infinite;
  height: 120px;
}
@keyframes xsheen{ 0%{ background-position: 0% 0%; } 100%{ background-position: 200% 0%; } }

/* ===== List page extras ===== */
.x-modal{ width: min(980px, 100%); max-height: 90vh; overflow:auto; }

.x-tab-btn{
  border: 1px solid var(--stroke);
  background: var(--panel);
  color: var(--muted);
  padding: 10px 12px;
  border-radius: 14px;
  display:inline-flex;
  align-items:center;
  gap: 8px;
  cursor:pointer;
  font-weight: 900;
  transition: transform .12s ease, background .12s ease, border-color .12s ease;
}
.x-tab-btn:hover{color: var(--brand1); transform: translateY(-1px); background: rgba(0,0,0,0.02); }
.x-tab-btn:active{color: var(--brand1); transform: translateY(0px) scale(0.98); }
.x-tab-btn:disabled{ opacity:0.55; cursor:not-allowed; transform:none; }
.x-tab-btn-active{
  color: #ffffff;
  border-color: rgba(109,94,252,0.55);
  background: linear-gradient(135deg, var(--brand1), var(--brand2));
  box-shadow: 0 6px 14px rgba(109,94,252,0.18);
}

.x-cat-row{
  display:flex;
  align-items:center;
  justify-content: space-between;
  gap: 10px;
  border: 1px solid var(--stroke);
  background: #ffffff;
  border-radius: 14px;
  padding: 10px 12px;
}
.x-cat-main{ min-width: 0; display:grid; gap: 2px; }
.x-cat-name{ font-weight: 950; color: var(--text); }
.x-cat-meta{ font-size: 12px; color: var(--muted); }

.x-empty{
  border: 1px dashed rgba(0,0,0,0.15);
  background: rgba(0,0,0,0.02);
  border-radius: 14px;
  padding: 14px;
  color: var(--muted);
  display:flex;
  align-items:center;
  gap: 10px;
  font-weight: 800;
}

.x-prod-table{ display:grid; gap: 10px; }
.x-prod-tr{
  display:grid;
  grid-template-columns: 160px 1.4fr 1fr 140px 120px 160px;
  gap: 10px;
  align-items: center;
  border: 1px solid var(--stroke);
  background: #ffffff;
  border-radius: 14px;
  padding: 10px;
}
.x-prod-tr-head{
  background: var(--panel);
  font-weight: 900;
  color: var(--muted);
}
.x-prod-cell{ min-width: 0; }

@media (max-width: 860px){
  .x-prod-thead{ display:none; }
  .x-prod-tr{
    grid-template-columns: 1fr;
    gap: 8px;
  }
  .x-prod-cell{
    display:flex;
    justify-content: space-between;
    gap: 10px;
    align-items:center;
  }
  .x-prod-cell::before{
    content: attr(data-label);
    color: var(--muted);
    font-weight: 900;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
}
`;
