import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createAttribute,
  createIngredient,
  fetchAdminCategories,
  fetchAdminProductById,
  fetchCatalogLanguages,
  updateAdminProduct,
  upsertTranslation,
} from "../api/productAdmin.api";
import type { AdminLanguage, ProductAdminItem, ProductCategory } from "../types/productAdmin";

export function ProductAdminDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductAdminItem | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [languages, setLanguages] = useState<AdminLanguage[]>([]);
  const [activeLang, setActiveLang] = useState("vi");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!productId) return;
      const langs = await fetchCatalogLanguages();
      const [detail, categoryList] = await Promise.all([fetchAdminProductById(productId), fetchAdminCategories()]);
      setProduct(detail);
      setCategories(categoryList);
      setLanguages(langs);
      setActiveLang((prev) => (langs.find((x) => x.code === prev)?.code || langs[0]?.code || "vi"));
    };
    load();
  }, [productId]);

  const translation = useMemo(() => product?.translations.find((item) => item.lang === activeLang), [product, activeLang]);

  const onSave = async () => {
    if (!product) return;
    setSaving(true);
    const next = await updateAdminProduct(product);
    setProduct(next);
    setSaving(false);
  };

  if (!product) {
    return <div className="card">Không tìm thấy sản phẩm.</div>;
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <p className="muted" style={{ margin: 0 }}>Chi tiết sản phẩm</p>
            <h2 className="h1">{translation?.name || "Sản phẩm mới"}</h2>
            <p className="muted" style={{ margin: 0 }}>{product.sku}</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => navigate("/catalog/products")} className="btn">Quay lại danh sách</button>
            <button onClick={onSave} className="btn btn-primary" disabled={saving}>{saving ? "Đang lưu..." : "Lưu thay đổi"}</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="grid grid-2">
          <label>
            <div className="muted">SKU</div>
            <input className="input" value={product.sku} onChange={(e) => setProduct((prev) => (prev ? { ...prev, sku: e.target.value } : prev))} />
          </label>
          <label>
            <div className="muted">Category</div>
            <select
              className="select"
              value={product.categoryId}
              onChange={(e) => setProduct((prev) => (prev ? { ...prev, categoryId: e.target.value } : prev))}
            >
              <option value="">-- Chọn category --</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.translations.find((x) => x.lang === activeLang)?.name || item.translations[0]?.name || item.id}
                </option>
              ))}
            </select>
          </label>
          <label>
            <div className="muted">Giá</div>
            <input
              type="number"
              className="input"
              value={product.price}
              onChange={(e) => setProduct((prev) => (prev ? { ...prev, price: Number(e.target.value) } : prev))}
            />
          </label>
          <label>
            <div className="muted">Trạng thái</div>
            <select
              className="select"
              value={product.status}
              onChange={(e) => setProduct((prev) => (prev ? { ...prev, status: e.target.value as "active" | "draft" } : prev))}
            >
              <option value="draft">draft</option>
              <option value="active">active</option>
            </select>
          </label>
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          {languages.map((lang) => (
            <button key={lang.code} onClick={() => setActiveLang(lang.code)} className={`btn ${activeLang === lang.code ? "btn-primary" : ""}`}>
              {lang.label}
            </button>
          ))}
        </div>

        <div className="grid" style={{ gap: 8 }}>
          <label>
            <div className="muted">Tên sản phẩm</div>
            <input
              className="input"
              value={translation?.name || ""}
              onChange={(e) =>
                setProduct((prev) =>
                  prev ? { ...prev, translations: upsertTranslation(prev.translations, activeLang, { name: e.target.value }) } : prev,
                )
              }
            />
          </label>
          <label>
            <div className="muted">Mô tả ngắn</div>
            <input
              className="input"
              value={translation?.shortDescription || ""}
              onChange={(e) =>
                setProduct((prev) =>
                  prev
                    ? { ...prev, translations: upsertTranslation(prev.translations, activeLang, { shortDescription: e.target.value }) }
                    : prev,
                )
              }
            />
          </label>
          <label>
            <div className="muted">Mô tả chi tiết</div>
            <textarea
              rows={4}
              className="input"
              value={translation?.description || ""}
              onChange={(e) =>
                setProduct((prev) =>
                  prev ? { ...prev, translations: upsertTranslation(prev.translations, activeLang, { description: e.target.value }) } : prev,
                )
              }
            />
          </label>
          <label>
            <div className="muted">Hướng dẫn sử dụng - Giới thiệu</div>
            <textarea
              rows={3}
              className="input"
              value={translation?.guideContent?.intro || ""}
              onChange={(e) =>
                setProduct((prev) =>
                  prev
                    ? {
                        ...prev,
                        translations: upsertTranslation(prev.translations, activeLang, {
                          guideContent: {
                            intro: e.target.value,
                            steps: translation?.guideContent?.steps || [],
                          },
                        }),
                      }
                    : prev,
                )
              }
            />
          </label>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div className="muted">Hướng dẫn sử dụng - Các bước</div>
              <button
                className="btn"
                onClick={() =>
                  setProduct((prev) => {
                    if (!prev) return prev;
                    const current = prev.translations.find((item) => item.lang === activeLang)?.guideContent;
                    const steps = current?.steps || [];
                    return {
                      ...prev,
                      translations: upsertTranslation(prev.translations, activeLang, {
                        guideContent: {
                          intro: current?.intro || "",
                          steps: [...steps, { order: steps.length + 1, content: "" }],
                        },
                      }),
                    };
                  })
                }
              >
                + Thêm bước
              </button>
            </div>

            <div className="grid" style={{ gap: 8 }}>
              {(translation?.guideContent?.steps || []).map((step, idx) => (
                <div key={`${step.order}-${idx}`} className="card" style={{ padding: 10 }}>
                  <div className="grid grid-2">
                    <label>
                      <div className="muted">Thứ tự</div>
                      <input
                        type="number"
                        min={1}
                        className="input"
                        value={step.order}
                        onChange={(e) =>
                          setProduct((prev) => {
                            if (!prev) return prev;
                            const current = prev.translations.find((item) => item.lang === activeLang)?.guideContent;
                            const steps = (current?.steps || []).map((row, rowIdx) =>
                              rowIdx === idx ? { ...row, order: Number(e.target.value) || 1 } : row,
                            );
                            return {
                              ...prev,
                              translations: upsertTranslation(prev.translations, activeLang, {
                                guideContent: { intro: current?.intro || "", steps },
                              }),
                            };
                          })
                        }
                      />
                    </label>
                    <label>
                      <div className="muted">Nội dung bước</div>
                      <input
                        className="input"
                        value={step.content}
                        onChange={(e) =>
                          setProduct((prev) => {
                            if (!prev) return prev;
                            const current = prev.translations.find((item) => item.lang === activeLang)?.guideContent;
                            const steps = (current?.steps || []).map((row, rowIdx) =>
                              rowIdx === idx ? { ...row, content: e.target.value } : row,
                            );
                            return {
                              ...prev,
                              translations: upsertTranslation(prev.translations, activeLang, {
                                guideContent: { intro: current?.intro || "", steps },
                              }),
                            };
                          })
                        }
                      />
                    </label>
                  </div>
                  <button
                    className="btn btn-danger"
                    style={{ marginTop: 8 }}
                    onClick={() =>
                      setProduct((prev) => {
                        if (!prev) return prev;
                        const current = prev.translations.find((item) => item.lang === activeLang)?.guideContent;
                        const steps = (current?.steps || [])
                          .filter((_, rowIdx) => rowIdx !== idx)
                          .map((row, orderIdx) => ({ ...row, order: orderIdx + 1 }));
                        return {
                          ...prev,
                          translations: upsertTranslation(prev.translations, activeLang, {
                            guideContent: { intro: current?.intro || "", steps },
                          }),
                        };
                      })
                    }
                  >
                    Xóa bước
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 className="h2">CRUD thành phần</h3>
            <button className="btn" onClick={() => setProduct((prev) => (prev ? { ...prev, ingredients: [...prev.ingredients, createIngredient()] } : prev))}>+ Thêm</button>
          </div>
          <div className="grid" style={{ marginTop: 10 }}>
            {product.ingredients.map((item) => (
              <div key={item.id} className="card" style={{ padding: 10 }}>
                <input
                  className="input"
                  placeholder={`Tên thành phần (${activeLang})`}
                  value={item.nameByLang[activeLang] || ""}
                  onChange={(e) =>
                    setProduct((prev) =>
                      prev
                        ? {
                            ...prev,
                            ingredients: prev.ingredients.map((row) =>
                              row.id === item.id
                                ? { ...row, nameByLang: { ...row.nameByLang, [activeLang]: e.target.value } }
                                : row,
                            ),
                          }
                        : prev,
                    )
                  }
                />
                <input
                  className="input"
                  style={{ marginTop: 8 }}
                  placeholder="Ghi chú"
                  value={item.note}
                  onChange={(e) =>
                    setProduct((prev) =>
                      prev
                        ? {
                            ...prev,
                            ingredients: prev.ingredients.map((row) => (row.id === item.id ? { ...row, note: e.target.value } : row)),
                          }
                        : prev,
                    )
                  }
                />
                <button
                  className="btn btn-danger"
                  style={{ marginTop: 8 }}
                  onClick={() =>
                    setProduct((prev) => (prev ? { ...prev, ingredients: prev.ingredients.filter((row) => row.id !== item.id) } : prev))
                  }
                >
                  Xóa
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 className="h2">CRUD thuộc tính</h3>
            <button className="btn" onClick={() => setProduct((prev) => (prev ? { ...prev, attributes: [...prev.attributes, createAttribute()] } : prev))}>+ Thêm</button>
          </div>
          <div className="grid" style={{ marginTop: 10 }}>
            {product.attributes.map((item) => (
              <div key={item.id} className="card" style={{ padding: 10 }}>
                <input
                  className="input"
                  placeholder={`Tên thuộc tính (${activeLang})`}
                  value={item.keyByLang[activeLang] || ""}
                  onChange={(e) =>
                    setProduct((prev) =>
                      prev
                        ? {
                            ...prev,
                            attributes: prev.attributes.map((row) =>
                              row.id === item.id
                                ? { ...row, keyByLang: { ...row.keyByLang, [activeLang]: e.target.value } }
                                : row,
                            ),
                          }
                        : prev,
                    )
                  }
                />
                <input
                  className="input"
                  style={{ marginTop: 8 }}
                  placeholder="Giá trị"
                  value={item.value}
                  onChange={(e) =>
                    setProduct((prev) =>
                      prev
                        ? {
                            ...prev,
                            attributes: prev.attributes.map((row) => (row.id === item.id ? { ...row, value: e.target.value } : row)),
                          }
                        : prev,
                    )
                  }
                />
                <button
                  className="btn btn-danger"
                  style={{ marginTop: 8 }}
                  onClick={() =>
                    setProduct((prev) => (prev ? { ...prev, attributes: prev.attributes.filter((row) => row.id !== item.id) } : prev))
                  }
                >
                  Xóa
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <Link to="/catalog/products" className="btn">← Về trang danh sách</Link>
      </div>
    </div>
  );
}
