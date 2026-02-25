import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createAdminCategory,
  createAdminProduct,
  deleteAdminCategory,
  fetchAdminCategories,
  fetchAdminProducts,
  updateAdminCategory
} from "../api/productAdmin.api";
import type { ProductAdminItem, ProductCategory } from "../types/productAdmin";


type CategoryRowProps = {
  category: ProductCategory;
  onSave: (category: ProductCategory) => void;
  onDelete: (categoryId: string) => void;
};

function CategoryRow({ category, onSave, onDelete }: CategoryRowProps) {
  const [draft, setDraft] = useState(category);

  useEffect(() => {
    setDraft(category);
  }, [category]);

  return (
    <div className="grid gap-2 rounded-xl border border-slate-200 p-3 md:grid-cols-[1fr_1fr_auto_auto]">
      <input
        className="rounded-lg border border-slate-300 px-3 py-2"
        value={draft.name}
        onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
      />
      <input
        className="rounded-lg border border-slate-300 px-3 py-2"
        value={draft.description || ""}
        onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
      />
      <button onClick={() => onSave(draft)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold">
        Lưu
      </button>
      <button onClick={() => onDelete(category.id)} className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600">
        Xóa
      </button>
    </div>
  );
}

export default function ProductAdminListPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductAdminItem[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCategoryModal, setOpenCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });

  const categoryMap = useMemo(() => Object.fromEntries(categories.map((item) => [item.id, item.name])), [categories]);

  const loadData = async () => {
    setLoading(true);
    const [productList, categoryList] = await Promise.all([fetchAdminProducts(), fetchAdminCategories()]);
    setProducts(productList);
    setCategories(categoryList);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onCreateProduct = async () => {
    const created = await createAdminProduct();
    navigate(`/admin/products/${created.id}`);
  };

  const onCreateCategory = async () => {
    if (!newCategory.name.trim()) return;
    await createAdminCategory(newCategory.name.trim(), newCategory.description.trim());
    setNewCategory({ name: "", description: "" });
    loadData();
  };

  const onInlineEditCategory = async (category: ProductCategory) => {
    await updateAdminCategory(category);
    loadData();
  };

  const onDeleteCategory = async (categoryId: string) => {
    await deleteAdminCategory(categoryId);
    loadData();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-800">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-indigo-600">Quản lý sản phẩm</p>
          <h1 className="mt-1 text-2xl font-bold">Danh sách sản phẩm</h1>
          <p className="mt-2 text-sm text-slate-500">Giao diện sáng, tách trang danh sách và trang chi tiết để chỉnh sửa dễ hơn.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={onCreateProduct} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
              + Thêm sản phẩm
            </button>
            <button onClick={() => setOpenCategoryModal(true)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-100">
              Quản lý category
            </button>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">Đang tải dữ liệu...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-3 py-3">SKU</th>
                    <th className="px-3 py-3">Tên (VI)</th>
                    <th className="px-3 py-3">Category</th>
                    <th className="px-3 py-3">Giá</th>
                    <th className="px-3 py-3">Tồn kho</th>
                    <th className="px-3 py-3">Trạng thái</th>
                    <th className="px-3 py-3">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const viName = product.translations.find((item) => item.lang === "vi")?.name || "(chưa đặt tên)";
                    return (
                      <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-3 py-3 font-mono text-xs">{product.sku}</td>
                        <td className="px-3 py-3 font-semibold">{viName}</td>
                        <td className="px-3 py-3">{categoryMap[product.categoryId] || "-"}</td>
                        <td className="px-3 py-3">{product.price.toLocaleString("vi-VN")} đ</td>
                        <td className="px-3 py-3">{product.stock}</td>
                        <td className="px-3 py-3">
                          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${product.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                            {product.status === "active" ? "Đang bán" : "Nháp"}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <Link className="rounded-lg border border-indigo-200 px-3 py-1.5 font-semibold text-indigo-700 hover:bg-indigo-50" to={`/admin/products/${product.id}`}>
                            Sửa chi tiết
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {openCategoryModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Category chung</h2>
              <button className="text-slate-500 hover:text-slate-700" onClick={() => setOpenCategoryModal(false)}>
                Đóng
              </button>
            </div>

            <div className="grid gap-2 rounded-xl border border-slate-200 p-4 md:grid-cols-[1fr_1fr_auto]">
              <input
                className="rounded-lg border border-slate-300 px-3 py-2"
                placeholder="Tên category"
                value={newCategory.name}
                onChange={(e) => setNewCategory((prev) => ({ ...prev, name: e.target.value }))}
              />
              <input
                className="rounded-lg border border-slate-300 px-3 py-2"
                placeholder="Mô tả"
                value={newCategory.description}
                onChange={(e) => setNewCategory((prev) => ({ ...prev, description: e.target.value }))}
              />
              <button onClick={onCreateCategory} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
                Thêm
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {categories.map((category) => (
                <CategoryRow
                  key={category.id}
                  category={category}
                  onSave={onInlineEditCategory}
                  onDelete={onDeleteCategory}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
