import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createAdminCategory,
  createAdminProduct,
  deleteAdminCategory,
  fetchAdminCategories,
  fetchAdminProducts,
  fetchCatalogLanguages,
  updateAdminCategory,
} from "../api/productAdmin.api";
import type { AdminLanguage, ProductAdminItem, ProductCategory } from "../types/productAdmin";
import { AppAlert } from "../components/AppAlert";

function CategoryRow({
  category,
  languages,
  activeLang,
  onSave,
  onDelete,
}: {
  category: ProductCategory;
  languages: AdminLanguage[];
  activeLang: string;
  onSave: (item: ProductCategory) => void;
  onDelete: (id: string) => void;
}) {
  const [draft, setDraft] = useState(category);

  useEffect(() => setDraft(category), [category]);

  const activeTranslation = draft.translations.find((item) => item.lang === activeLang);

  return (
    <div className="card" style={{ padding: 12 }}>
      <div className="grid" style={{ gap: 8 }}>
        <input
          className="input"
          placeholder={`Tên danh mục (${activeLang})`}
          value={activeTranslation?.name || ""}
          onChange={(e) =>
            setDraft((prev) => ({
              ...prev,
              translations: prev.translations.map((row) =>
                row.lang === activeLang ? { ...row, name: e.target.value } : row,
              ),
            }))
          }
        />
        <input
          className="input"
          placeholder={`Mô tả (${activeLang})`}
          value={activeTranslation?.description || ""}
          onChange={(e) =>
            setDraft((prev) => ({
              ...prev,
              translations: prev.translations.map((row) =>
                row.lang === activeLang ? { ...row, description: e.target.value } : row,
              ),
            }))
          }
        />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {languages.map((lang) => {
            const t = draft.translations.find((item) => item.lang === lang.code);
            return (
              <span key={lang.code} className="muted" style={{ fontSize: 12 }}>
                {lang.code.toUpperCase()}: {t?.name || "-"}
              </span>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary" onClick={() => onSave(draft)}>Lưu</button>
          <button className="btn btn-danger" onClick={() => onDelete(category.id)}>Xóa</button>
        </div>
      </div>
    </div>
  );
}

export function ProductAdminListPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductAdminItem[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [languages, setLanguages] = useState<AdminLanguage[]>([]);
  const [activeLang, setActiveLang] = useState("vi");
  const [loading, setLoading] = useState(true);
  const [openCategoryModal, setOpenCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState<ProductCategory>({ id: "new", translations: [] });

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
    const langs = await fetchCatalogLanguages();
    const [productList, categoryList] = await Promise.all([fetchAdminProducts(), fetchAdminCategories()]);

    setLanguages(langs);
    setProducts(productList);
    setCategories(categoryList);
    setActiveLang((prev) => (langs.find((x) => x.code === prev)?.code || langs[0]?.code || "vi"));
    setNewCategory({
      id: "new",
      translations: langs.map((lang) => ({ lang: lang.code, name: "", description: "" })),
    });
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onCreateProduct = async () => {
    const created = await createAdminProduct();
    navigate(`/catalog/products/${created.id}`);
  };

  const viOrActiveName = (product: ProductAdminItem) =>
    product.translations.find((item) => item.lang === activeLang)?.name ||
    product.translations.find((item) => item.lang === "vi")?.name ||
    "(chưa đặt tên)";

  const hasAnyCategoryName = newCategory.translations.some((row) => row.name.trim());

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card hero-card" style={{ marginBottom: 0 }}>
        <p className="muted" style={{ margin: 0, fontSize: 14 }}>Quản lý sản phẩm</p>
        <h2 className="h1">Danh sách sản phẩm</h2>
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <button onClick={onCreateProduct} className="btn btn-primary">+ Thêm sản phẩm</button>
          <button onClick={() => setOpenCategoryModal(true)} className="btn">Quản lý category</button>
          <div style={{ display: "inline-flex", padding: 4, borderRadius: 12, border: "1px solid #cbd5e1", background: "#fff", gap: 4 }}>
            {languages.map((lang) => (
              <button
                key={lang.code}
                className={`btn ${activeLang === lang.code ? "btn-primary" : ""}`}
                style={{ minHeight: 34, padding: "6px 10px", borderRadius: 9 }}
                onClick={() => setActiveLang(lang.code)}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AppAlert
        kind="warning"
        title="Lưu ý dữ liệu"
        message="Hãy chọn đúng ngôn ngữ trước khi chỉnh sửa để tránh ghi đè bản dịch ngoài ý muốn."
      />

      <div className="card">
        {loading ? (
          <div className="muted">Đang tải dữ liệu...</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Tên ({activeLang.toUpperCase()})</th>
                <th>Category</th>
                <th>Giá</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.sku}</td>
                  <td>{viOrActiveName(product)}</td>
                  <td>{categoryMap[product.categoryId] || "-"}</td>
                  <td>{product.price.toLocaleString("vi-VN")} đ</td>
                  <td>
                    <span className="pill" style={{ background: product.status === "active" ? "#ecfdf5" : "#f1f5f9", color: product.status === "active" ? "#047857" : "#475569", borderColor: product.status === "active" ? "#a7f3d0" : "#cbd5e1" }}>
                      {product.status}
                    </span>
                  </td>
                  <td>
                    <Link className="btn" to={`/catalog/products/${product.id}`}>Chỉnh sửa</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {openCategoryModal ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            display: "grid",
            placeItems: "center",
            zIndex: 60,
            padding: 18,
          }}
          onClick={() => setOpenCategoryModal(false)}
        >
          <div className="card" style={{ width: "min(980px, 100%)", maxHeight: "90vh", overflow: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <h3 className="h2">Quản lý category đa ngôn ngữ</h3>
              <button className="btn" onClick={() => setOpenCategoryModal(false)}>Đóng</button>
            </div>

            <div style={{ display: "inline-flex", padding: 4, borderRadius: 12, border: "1px solid #cbd5e1", background: "#fff", gap: 4, marginBottom: 10 }}>
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  className={`btn ${activeLang === lang.code ? "btn-primary" : ""}`}
                  style={{ minHeight: 34, padding: "6px 10px", borderRadius: 9 }}
                  onClick={() => setActiveLang(lang.code)}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            <div style={{ display: "grid", gap: 8, margin: "10px 0" }}>
              <input
                className="input"
                placeholder={`Tên category (${activeLang})`}
                value={newCategory.translations.find((item) => item.lang === activeLang)?.name || ""}
                onChange={(e) =>
                  setNewCategory((prev) => ({
                    ...prev,
                    translations: prev.translations.map((row) =>
                      row.lang === activeLang ? { ...row, name: e.target.value } : row,
                    ),
                  }))
                }
              />
              <input
                className="input"
                placeholder={`Mô tả (${activeLang})`}
                value={newCategory.translations.find((item) => item.lang === activeLang)?.description || ""}
                onChange={(e) =>
                  setNewCategory((prev) => ({
                    ...prev,
                    translations: prev.translations.map((row) =>
                      row.lang === activeLang ? { ...row, description: e.target.value } : row,
                    ),
                  }))
                }
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn btn-primary"
                  disabled={!hasAnyCategoryName}
                  onClick={async () => {
                    if (!hasAnyCategoryName) return;
                    await createAdminCategory(newCategory);
                    setNewCategory({
                      id: "new",
                      translations: languages.map((lang) => ({ lang: lang.code, name: "", description: "" })),
                    });
                    loadData();
                  }}
                >
                  + Tạo
                </button>
              </div>
            </div>

            <div className="grid" style={{ gap: 8 }}>
              {categories.map((category) => (
                <CategoryRow
                  key={category.id}
                  category={category}
                  languages={languages}
                  activeLang={activeLang}
                  onSave={async (item) => {
                    await updateAdminCategory(item);
                    loadData();
                  }}
                  onDelete={async (id) => {
                    await deleteAdminCategory(id);
                    loadData();
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
