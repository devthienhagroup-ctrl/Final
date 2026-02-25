import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createAttribute,
  createIngredient,
  fetchAdminCategories,
  fetchAdminProductById,
  updateAdminProduct,
  upsertTranslation
} from "../api/productAdmin.api";
import { LANGUAGES, type LanguageCode, type ProductAdminItem, type ProductCategory } from "../types/productAdmin";

export default function ProductAdminDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductAdminItem | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [activeLang, setActiveLang] = useState<LanguageCode>("vi");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!productId) return;
      const [detail, categoryList] = await Promise.all([fetchAdminProductById(productId), fetchAdminCategories()]);
      setProduct(detail);
      setCategories(categoryList);
    };
    load();
  }, [productId]);

  const translation = useMemo(() => product?.translations.find((item) => item.lang === activeLang), [product, activeLang]);

  const onSave = async () => {
    if (!product) return;
    setSaving(true);
    await updateAdminProduct(product);
    setSaving(false);
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Không tìm thấy sản phẩm.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-800">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-indigo-600">Chi tiết sản phẩm</p>
              <h1 className="text-2xl font-bold">{translation?.name || "Sản phẩm mới"}</h1>
              <p className="text-sm text-slate-500">{product.sku}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => navigate("/admin/products")} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold">
                Quay lại danh sách
              </button>
              <button onClick={onSave} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70" disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-semibold">SKU</span>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={product.sku}
              onChange={(e) => setProduct((prev) => (prev ? { ...prev, sku: e.target.value } : prev))}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-semibold">Category</span>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={product.categoryId}
              onChange={(e) => setProduct((prev) => (prev ? { ...prev, categoryId: e.target.value } : prev))}
            >
              <option value="">-- Chọn category --</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-semibold">Giá</span>
            <input
              type="number"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={product.price}
              onChange={(e) => setProduct((prev) => (prev ? { ...prev, price: Number(e.target.value) } : prev))}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-semibold">Tồn kho</span>
            <input
              type="number"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={product.stock}
              onChange={(e) => setProduct((prev) => (prev ? { ...prev, stock: Number(e.target.value) } : prev))}
            />
          </label>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setActiveLang(lang.code)}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${activeLang === lang.code ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"}`}
              >
                {lang.label}
              </button>
            ))}
            <span className="ml-auto text-xs text-slate-500">Tab chỉnh sửa đa ngôn ngữ</span>
          </div>

          <div className="grid gap-3">
            <label className="space-y-1 text-sm">
              <span className="font-semibold">Tên sản phẩm</span>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                value={translation?.name || ""}
                onChange={(e) =>
                  setProduct((prev) =>
                    prev
                      ? { ...prev, translations: upsertTranslation(prev.translations, activeLang, { name: e.target.value }) }
                      : prev
                  )
                }
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-semibold">Mô tả ngắn</span>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                value={translation?.shortDescription || ""}
                onChange={(e) =>
                  setProduct((prev) =>
                    prev
                      ? { ...prev, translations: upsertTranslation(prev.translations, activeLang, { shortDescription: e.target.value }) }
                      : prev
                  )
                }
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-semibold">Mô tả chi tiết</span>
              <textarea
                rows={4}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                value={translation?.description || ""}
                onChange={(e) =>
                  setProduct((prev) =>
                    prev
                      ? { ...prev, translations: upsertTranslation(prev.translations, activeLang, { description: e.target.value }) }
                      : prev
                  )
                }
              />
            </label>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold">CRUD thành phần</h3>
              <button
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold"
                onClick={() => setProduct((prev) => (prev ? { ...prev, ingredients: [...prev.ingredients, createIngredient()] } : prev))}
              >
                + Thêm
              </button>
            </div>
            <div className="space-y-2">
              {product.ingredients.map((item) => (
                <div key={item.id} className="grid gap-2 rounded-lg border border-slate-200 p-3">
                  <input
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Tên thành phần"
                    value={item.name}
                    onChange={(e) =>
                      setProduct((prev) =>
                        prev
                          ? {
                              ...prev,
                              ingredients: prev.ingredients.map((row) => (row.id === item.id ? { ...row, name: e.target.value } : row))
                            }
                          : prev
                      )
                    }
                  />
                  <input
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Ghi chú"
                    value={item.note}
                    onChange={(e) =>
                      setProduct((prev) =>
                        prev
                          ? {
                              ...prev,
                              ingredients: prev.ingredients.map((row) => (row.id === item.id ? { ...row, note: e.target.value } : row))
                            }
                          : prev
                      )
                    }
                  />
                  <button
                    className="justify-self-end text-sm font-semibold text-rose-600"
                    onClick={() =>
                      setProduct((prev) =>
                        prev ? { ...prev, ingredients: prev.ingredients.filter((row) => row.id !== item.id) } : prev
                      )
                    }
                  >
                    Xóa
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold">CRUD thuộc tính</h3>
              <button
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold"
                onClick={() => setProduct((prev) => (prev ? { ...prev, attributes: [...prev.attributes, createAttribute()] } : prev))}
              >
                + Thêm
              </button>
            </div>
            <div className="space-y-2">
              {product.attributes.map((item) => (
                <div key={item.id} className="grid gap-2 rounded-lg border border-slate-200 p-3">
                  <input
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Tên thuộc tính"
                    value={item.key}
                    onChange={(e) =>
                      setProduct((prev) =>
                        prev
                          ? {
                              ...prev,
                              attributes: prev.attributes.map((row) => (row.id === item.id ? { ...row, key: e.target.value } : row))
                            }
                          : prev
                      )
                    }
                  />
                  <input
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Giá trị"
                    value={item.value}
                    onChange={(e) =>
                      setProduct((prev) =>
                        prev
                          ? {
                              ...prev,
                              attributes: prev.attributes.map((row) => (row.id === item.id ? { ...row, value: e.target.value } : row))
                            }
                          : prev
                      )
                    }
                  />
                  <button
                    className="justify-self-end text-sm font-semibold text-rose-600"
                    onClick={() =>
                      setProduct((prev) =>
                        prev ? { ...prev, attributes: prev.attributes.filter((row) => row.id !== item.id) } : prev
                      )
                    }
                  >
                    Xóa
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="pb-6 text-right text-sm">
          <Link to="/admin/products" className="font-semibold text-indigo-600 hover:underline">
            ← Về trang danh sách
          </Link>
        </div>
      </div>
    </div>
  );
}
