import { useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createAdminProduct,
  createAttribute,
  createIngredient,
  deleteAdminProduct,
  deleteProductImage,
  fetchAdminCategories,
  fetchAdminProductById,
  fetchCatalogLanguages,
  slugify,
  updateAdminProduct,
  updateProductImage,
  uploadProductImage,
  upsertTranslation,
} from "../api/productAdmin.api";
import type { AdminLanguage, ProductAdminItem, ProductCategory } from "../types/productAdmin";

type PendingImageFileMap = Record<string, File>;
type ActiveTab = "general" | "translations" | "images" | "meta";

const isTempImageId = (id: string) => id.startsWith("temp-");

function deepClone<T>(value: T): T {
  const sc = (globalThis as any)?.structuredClone as undefined | ((v: any) => any);
  if (typeof sc === "function") return sc(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

function stableStringify(value: unknown): string {
  const seen = new WeakSet<object>();
  const helper = (v: any): any => {
    if (v === null) return null;
    if (typeof v === "bigint") return v.toString();
    if (typeof v !== "object") return v;
    if (v instanceof Date) return v.toISOString();

    if (Array.isArray(v)) return v.map(helper);

    if (seen.has(v)) return "[Circular]";
    seen.add(v);

    const keys = Object.keys(v).sort();
    const out: Record<string, any> = {};
    for (const k of keys) {
      const next = v[k];
      if (typeof next === "undefined") continue;
      out[k] = helper(next);
    }
    return out;
  };

  return JSON.stringify(helper(value));
}

function normalizeImageSortOrder(images: ProductAdminItem["images"]) {
  // normalize to 0..n-1 based on current array order
  return images.map((img, idx) => ({ ...img, sortOrder: idx }));
}

function normalizeStepOrders(steps: { order: number; content: string }[]) {
  return steps.map((s, idx) => ({ ...s, order: idx + 1 }));
}


function classNames(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(" ");
}

type ValidationErrors = {
  sku?: boolean;
  categoryId?: boolean;
  price?: boolean;
  translationNameByLang: Record<string, boolean>;
  translationSlugByLang: Record<string, boolean>;
};

const createEmptyProduct = (langs: AdminLanguage[]): ProductAdminItem => {
  const nextLangs = langs.length ? langs : [{ code: "vi", label: "Tiếng Việt" }];
  const now = new Date().toISOString();
  const baseSku = `AYA-${Date.now().toString(36).toUpperCase()}`;
  return {
    id: "new",
    sku: baseSku,
    categoryId: "",
    price: 0,
    stock: 0,
    status: "draft",
    translations: nextLangs.map((lang) => ({
      lang: lang.code,
      name: "",
      slug: `new-${lang.code}-${Date.now().toString(36)}`,
      shortDescription: "",
      description: "",
      guideContent: { intro: "", steps: [] },
    })),
    ingredients: [],
    attributes: [],
    images: [],
    updatedAt: now,
  };
};


const buildSlugEditedMap = (current: ProductAdminItem | null, original: ProductAdminItem | null): Record<string, boolean> => {
  if (!current) return {};
  return Object.fromEntries(
      current.translations.map((row) => {
        const originalSlug = original?.translations.find((item) => item.lang === row.lang)?.slug?.trim() || "";
        return [row.lang, Boolean(originalSlug) && row.slug.trim() !== originalSlug];
      }),
  );
};

export function ProductAdminDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState<ProductAdminItem | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [languages, setLanguages] = useState<AdminLanguage[]>([]);
  const [activeLang, setActiveLang] = useState("vi");
  const [activeTab, setActiveTab] = useState<ActiveTab>("general");

  const [isLoading, setIsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [pendingImageFiles, setPendingImageFiles] = useState<PendingImageFileMap>({});
  const [deletedPersistedImageIds, setDeletedPersistedImageIds] = useState<string[]>([]);
  const [showValidation, setShowValidation] = useState(false);
  const [slugEditedByLang, setSlugEditedByLang] = useState<Record<string, boolean>>({});

  const originalRef = useRef<ProductAdminItem | null>(null);

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

  const MySwal = useMemo(() => withReactContent(Swal), []);

  const swal = useMemo(
      () =>
          MySwal.mixin({
            background: "#ffffff",
            color: "#0f172a",
            buttonsStyling: false,
            customClass: {
              popup: "x-swal-popup",
              title: "x-swal-title",
              htmlContainer: "x-swal-text",
              actions: "x-swal-actions",
              confirmButton: "x-swal-btn x-swal-btn--confirm",
              cancelButton: "x-swal-btn x-swal-btn--cancel",
            },
          }),
      [MySwal],
  );

  const toast = useMemo(
      () =>
          swal.mixin({
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 2200,
            timerProgressBar: true,
          }),
      [swal],
  );

  const showNotice = (title: string, message = "") => {
    void toast.fire({
      icon: "success",
      title,
      text: message || undefined,
    });
  };

  const cleanupTempObjectUrls = (p: ProductAdminItem | null) => {
    if (!p) return;
    for (const img of p.images) {
      if (isTempImageId(img.id)) {
        try {
          URL.revokeObjectURL(img.imageUrl);
        } catch {
          // ignore
        }
      }
    }
  };

  const load = async () => {
    if (!productId) return;

    setIsLoading(true);
    try {
      const langs = await fetchCatalogLanguages();
      const categoryList = await fetchAdminCategories();
      const nextLang = langs.find((x) => x.code === activeLang)?.code || langs[0]?.code || "vi";

      let detail: ProductAdminItem | null;
      if (productId === "new") {
        detail = createEmptyProduct(langs);
      } else {
        detail = await fetchAdminProductById(productId);
      }

      cleanupTempObjectUrls(product);

      setProduct(detail);
      setCategories(categoryList);
      setLanguages(langs);
      setActiveLang(nextLang);

      originalRef.current = deepClone(detail);
      setSlugEditedByLang(buildSlugEditedMap(detail, detail));
      setPendingImageFiles({});
      setDeletedPersistedImageIds([]);
      setShowValidation(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Không thể tải dữ liệu";
      void swal.fire({ icon: "error", title: "Lỗi tải trang", text: msg });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const translation = useMemo(
      () => product?.translations.find((item) => item.lang === activeLang),
      [product, activeLang],
  );

  const isDirty = useMemo(() => {
    if (!product || !originalRef.current) return false;
    const a = stableStringify(product);
    const b = stableStringify(originalRef.current);
    if (a !== b) return true;
    if (Object.keys(pendingImageFiles).length > 0) return true;
    if (deletedPersistedImageIds.length > 0) return true;
    return false;
  }, [product, pendingImageFiles, deletedPersistedImageIds]);

  const validationErrors = useMemo<ValidationErrors>(() => {
    if (!product) {
      return {
        sku: false,
        categoryId: false,
        price: false,
        translationNameByLang: {},
        translationSlugByLang: {},
      };
    }

    const translationNameByLang: Record<string, boolean> =
        Object.fromEntries(
            product.translations.map((row) => [
              row.lang,
              !row.name.trim(),
            ]),
        );

    const translationSlugByLang: Record<string, boolean> =
        Object.fromEntries(
            product.translations.map((row) => [
              row.lang,
              !row.slug.trim(),
            ]),
        );

    return {
      sku: !product.sku.trim(),
      categoryId: !product.categoryId,
      price: Number.isNaN(product.price) || product.price <= 0,
      translationNameByLang,
      translationSlugByLang,
    };
  }, [product]);
  const hasValidationError = useMemo(
      () =>
          Boolean(validationErrors.sku || validationErrors.categoryId || validationErrors.price) ||
          Object.values(validationErrors.translationNameByLang).some(Boolean) ||
          Object.values(validationErrors.translationSlugByLang).some(Boolean),
      [validationErrors],
  );

  const statusText = saving ? "Đang lưu..." : isDirty ? "Có thay đổi" : "Đã lưu";
  const statusTone = saving ? "info" : isDirty ? "warn" : "ok";

  const resetChanges = async () => {
    if (!originalRef.current) return;

    const doReset = () => {
      cleanupTempObjectUrls(product);
      setProduct(deepClone(originalRef.current));
      setPendingImageFiles({});
      setDeletedPersistedImageIds([]);
      showNotice("Đã hoàn tác thay đổi");
    };

    if (!isDirty) return doReset();

    void (async () => {
      const res = await swal.fire({
        icon: "warning",
        title: "Hoàn tác thay đổi?",
        text: "Mọi chỉnh sửa chưa lưu sẽ bị mất.",
        showCancelButton: true,
        confirmButtonText: "Hoàn tác",
        cancelButtonText: "Hủy",
        reverseButtons: true,
        focusCancel: true,
      });
      if (res.isConfirmed) doReset();
    })();
  };

  const setPrimaryImage = (imageId: string) => {
    setProduct((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        images: prev.images.map((img) => ({ ...img, isPrimary: img.id === imageId })),
      };
    });
  };

  const moveImage = (imageId: string, dir: -1 | 1) => {
    setProduct((prev) => {
      if (!prev) return prev;
      const idx = prev.images.findIndex((x) => x.id === imageId);
      if (idx < 0) return prev;

      const nextIdx = idx + dir;
      if (nextIdx < 0 || nextIdx >= prev.images.length) return prev;

      const next = [...prev.images];
      const [picked] = next.splice(idx, 1);
      next.splice(nextIdx, 0, picked);

      return { ...prev, images: normalizeImageSortOrder(next) };
    });
  };

  const onAddImages = (files: FileList | null) => {
    if (!files || !files.length) return;

    const selectedFiles = Array.from(files);

    setProduct((prev) => {
      if (!prev) return prev;

      const startOrder = prev.images.length;
      const hasPrimary = prev.images.some((x) => x.isPrimary);

      const draftImages = selectedFiles.map((file, index) => {
        const id = `temp-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`;
        const url = URL.createObjectURL(file);
        return {
          id,
          imageUrl: url,
          isPrimary: !hasPrimary && index === 0,
          sortOrder: startOrder + index,
          file,
        };
      });

      setPendingImageFiles((prevFiles) => ({
        ...prevFiles,
        ...Object.fromEntries(draftImages.map((item) => [item.id, item.file])),
      }));

      const merged = [
        ...prev.images,
        ...draftImages.map((d) => ({
          id: d.id,
          imageUrl: d.imageUrl,
          isPrimary: d.isPrimary,
          sortOrder: d.sortOrder,
        })),
      ];

      return { ...prev, images: normalizeImageSortOrder(merged) };
    });

    showNotice("Đã thêm ảnh", "Ảnh mới sẽ được lưu khi bạn bấm Lưu.");
  };

  const onDeleteImage = (imageId: string) => {
    setProduct((prev) => {
      if (!prev) return prev;

      const target = prev.images.find((x) => x.id === imageId);

      if (!isTempImageId(imageId)) {
        setDeletedPersistedImageIds((old) => (old.includes(imageId) ? old : [...old, imageId]));
      } else {
        if (target?.imageUrl) {
          try {
            URL.revokeObjectURL(target.imageUrl);
          } catch {
            // ignore
          }
        }
        setPendingImageFiles((old) => {
          const next = { ...old };
          delete next[imageId];
          return next;
        });
      }

      const nextImages = prev.images.filter((img) => img.id !== imageId);
      const normalized = normalizeImageSortOrder(nextImages);

      if (normalized.length > 0 && !normalized.some((x) => x.isPrimary)) {
        normalized[0] = { ...normalized[0], isPrimary: true };
      }

      return { ...prev, images: normalized };
    });

    showNotice("Đã xóa ảnh", "Thay đổi sẽ có hiệu lực sau khi bấm Lưu.");
  };

  const copyFromViToActive = () => {
    if (!product) return;
    const vi = product.translations.find((t) => t.lang === "vi");
    if (!vi) return showNotice("Không tìm thấy bản dịch VI để copy");

    setProduct((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        translations: upsertTranslation(prev.translations, activeLang, {
          name: vi.name || "",
          shortDescription: vi.shortDescription || "",
          description: vi.description || "",
          guideContent: vi.guideContent
              ? {
                intro: vi.guideContent.intro || "",
                steps: (vi.guideContent.steps || []).map((s) => ({ order: s.order, content: s.content })),
              }
              : { intro: "", steps: [] },
        }),
      };
    });

    showNotice("Đã copy nội dung từ VI");
  };

  const onSave = async () => {
    if (!product) return;
    setShowValidation(true);
    if (hasValidationError) {
      showNotice("Thiếu dữ liệu bắt buộc", "Vui lòng nhập đầy đủ tất cả trường bắt buộc (SKU, category, giá, tên và slug theo từng ngôn ngữ).");
      return;
    }

    setSaving(true);
    try {
      let savedProduct = product;
      let savedProductId = product.id;

      if (productId === "new") {
        const created = await createAdminProduct(product);
        savedProduct = { ...product, id: created.id, updatedAt: created.updatedAt };
        savedProductId = created.id;

        // The create endpoint only persists core product fields,
        // so we need to persist ingredients/attributes in a follow-up update.
        await updateAdminProduct(savedProduct);
      } else {
        await updateAdminProduct(savedProduct);
      }

      for (const imageId of deletedPersistedImageIds) {
        await deleteProductImage(savedProductId, imageId);
      }

      for (const image of savedProduct.images) {
        if (isTempImageId(image.id)) {
          const file = pendingImageFiles[image.id];
          if (!file) continue;
          await uploadProductImage(savedProductId, file, image.isPrimary, image.sortOrder);
          try {
            URL.revokeObjectURL(image.imageUrl);
          } catch {
            // ignore
          }
        } else {
          await updateProductImage(savedProductId, image);
        }
      }

      if (productId === "new") {
        showNotice("Đã tạo sản phẩm mới", "Bạn có thể tiếp tục cập nhật thông tin SEO (slug) sau khi tạo.");
        navigate(`/catalog/products/${savedProductId}`);
        return;
      }

      await load();
      showNotice("Đã lưu thay đổi", "Dữ liệu sản phẩm đã được cập nhật thành công.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể lưu thay đổi";
      void swal.fire({ icon: "error", title: "Lưu thất bại", text: message });
    } finally {
      setSaving(false);
    }
  };

  const onDeleteProduct = async () => {
    if (!product) return;

    void (async () => {
      const res = await swal.fire({
        icon: "warning",
        title: "Xóa sản phẩm?",
        text: "Thao tác này không thể hoàn tác.",
        showCancelButton: true,
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy",
        reverseButtons: true,
        focusCancel: true,
      });
      if (!res.isConfirmed) return;
      try {
        await deleteAdminProduct(product.id);
        void toast.fire({ icon: "success", title: "Đã xóa sản phẩm" });
        navigate("/catalog/products");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Không thể xóa sản phẩm";
        void swal.fire({
          icon: "error",
          title: "Không thể xóa",
          text: `${message}\n\nGợi ý: nếu sản phẩm đang được tham chiếu, hãy tắt trạng thái hoạt động.`,
        });
      }
    })();
  };

  const langStatus = (code: string) => {
    const t = product?.translations.find((x) => x.lang === code);
    const ok = Boolean(t?.name && t.name.trim().length > 0);
    return ok ? "ok" : "warn";
  };

  const categoryLabel = (c: ProductCategory) =>
      c.translations.find((x) => x.lang === activeLang)?.name || c.translations[0]?.name || c.id;

  const renderGeneralTab = () => {
    if (!product) return null;

    return (
        <div className="x-card">
          <div className="x-section-title">
            <i className="fa-solid fa-sliders" /> <span>Tổng quan</span>
          </div>

          <div className="x-grid2">
            <label className="x-field">
              <div className="x-label">SKU</div>
              <input
                  className={classNames("x-input", showValidation && validationErrors.sku && "x-input-invalid")}
                  value={product.sku}
                  onChange={(e) => setProduct((prev) => (prev ? { ...prev, sku: e.target.value } : prev))}
                  placeholder="VD: SPA-001"
              />
            </label>

            <label className="x-field">
              <div className="x-label">Category</div>
              <select
                  className={classNames("x-input", showValidation && validationErrors.categoryId && "x-input-invalid")}
                  value={product.categoryId}
                  onChange={(e) => setProduct((prev) => (prev ? { ...prev, categoryId: e.target.value } : prev))}
              >
                <option value="">-- Chọn category --</option>
                {categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {categoryLabel(item)}
                    </option>
                ))}
              </select>
            </label>

            <label className="x-field">
              <div className="x-label">Giá</div>
              <div className="x-input-prefix">
                <span className="x-prefix">₫</span>
                <input
                    type="number"
                    className={classNames("x-input x-input-inner", showValidation && validationErrors.price && "x-input-invalid")}
                    value={product.price}
                    onChange={(e) => setProduct((prev) => (prev ? { ...prev, price: Number(e.target.value) } : prev))}
                />
              </div>
            </label>

            <div className="x-field">
              <div className="x-label">Trạng thái</div>
              <div className="x-row">
                <button
                    type="button"
                    className={classNames("x-switch", product.status === "active" && "x-switch-on")}
                    onClick={() =>
                        setProduct((prev) => (prev ? { ...prev, status: prev.status === "active" ? "draft" : "active" } : prev))
                    }
                    aria-pressed={product.status === "active"}
                    title="Bật/tắt"
                >
                  <span className="x-switch-thumb" />
                </button>
                <span className={classNames("x-pill", product.status === "active" ? "x-pill-ok" : "x-pill-muted")}>
                {product.status === "active" ? "Active" : "Draft"}
              </span>
              </div>
            </div>
          </div>
        </div>
    );
  };

  const renderTranslationsTab = () => {
    if (!product) return null;

    return (
        <div className="x-card">
          <div className="x-section-title">
            <i className="fa-solid fa-language" /> <span>Nội dung (đa ngôn ngữ)</span>
          </div>

          <div className="x-row x-row-wrap" style={{ justifyContent: "space-between" }}>
            <div className="x-row x-row-wrap" style={{ gap: 8 }}>
            <span className={classNames("x-pill", langStatus(activeLang) === "ok" ? "x-pill-ok" : "x-pill-warn")}>
              {langStatus(activeLang) === "ok" ? "Đủ nội dung" : "Thiếu tên sản phẩm"}
            </span>
            </div>

            {activeLang !== "vi" && (
                <button className="x-btn x-btn-ghost" onClick={copyFromViToActive}>
                  <i className="fa-solid fa-copy" /> <span>Copy từ VI</span>
                </button>
            )}
          </div>

          <div className="x-stack">
            <label className="x-field">
              <div className="x-label">Tên sản phẩm</div>
              <input
                  className={classNames("x-input", showValidation && validationErrors.translationNameByLang[activeLang] && "x-input-invalid")}
                  value={translation?.name || ""}
                  onChange={(e) => {
                    const nextName = e.target.value;
                    setProduct((prev) => {
                      if (!prev) return prev;
                      const nextSlugPatch =
                          productId === "new" && !slugEditedByLang[activeLang]
                              ? { slug: slugify(nextName || `${prev.sku}-${activeLang}`) }
                              : {};
                      return {
                        ...prev,
                        translations: upsertTranslation(prev.translations, activeLang, { name: nextName, ...nextSlugPatch }),
                      };
                    });
                  }}
                  placeholder="Nhập tên theo ngôn ngữ đang chọn…"
              />
              {showValidation && validationErrors.translationNameByLang[activeLang] && <div className="x-error-text">Tên sản phẩm là bắt buộc.</div>}
            </label>

            <label className="x-field">
              <div className="x-label">Slug</div>
              <input
                  className={classNames("x-input", showValidation && validationErrors.translationSlugByLang[activeLang] && "x-input-invalid")}
                  value={translation?.slug || ""}
                  onChange={(e) => {
                    const rawSlug = e.target.value;
                    const nextSlug = rawSlug ? slugify(rawSlug) : "";
                    setProduct((prev) =>
                        prev
                            ? { ...prev, translations: upsertTranslation(prev.translations, activeLang, { slug: nextSlug }) }
                            : prev,
                    );
                    if (productId === "new") {
                      setSlugEditedByLang((prev) => ({ ...prev, [activeLang]: Boolean(rawSlug.trim()) }));
                    } else {
                      const originalSlug = originalRef.current?.translations.find((item) => item.lang === activeLang)?.slug?.trim() || "";
                      setSlugEditedByLang((prev) => ({ ...prev, [activeLang]: Boolean(originalSlug) && nextSlug !== originalSlug }));
                    }
                  }}
                  placeholder="vi-du-slug"
              />
              {showValidation && validationErrors.translationSlugByLang[activeLang] && <div className="x-error-text">Slug là bắt buộc.</div>}
              {productId !== "new" && slugEditedByLang[activeLang] && (
                  <div className="x-help x-help-warn">Hạn chế sửa slug vì có thể ảnh hưởng SEO và các liên kết hiện có.</div>
              )}
              {productId === "new" && (
                  <div className="x-help">Slug tự sinh theo tên sản phẩm, bạn vẫn có thể chỉnh sửa thủ công.</div>
              )}
            </label>

            <label className="x-field">
              <div className="x-label">Mô tả ngắn</div>
              <input
                  className="x-input"
                  value={translation?.shortDescription || ""}
                  onChange={(e) =>
                      setProduct((prev) =>
                          prev
                              ? { ...prev, translations: upsertTranslation(prev.translations, activeLang, { shortDescription: e.target.value }) }
                              : prev,
                      )
                  }
                  placeholder="Tóm tắt ngắn gọn…"
              />
            </label>

            <label className="x-field">
              <div className="x-label">Mô tả chi tiết</div>
              <textarea
                  rows={5}
                  className="x-input x-textarea"
                  value={translation?.description || ""}
                  onChange={(e) =>
                      setProduct((prev) =>
                          prev ? { ...prev, translations: upsertTranslation(prev.translations, activeLang, { description: e.target.value }) } : prev,
                      )
                  }
                  placeholder="Nội dung chi tiết…"
              />
            </label>

            <div className="x-card x-card-inner">
              <div className="x-row" style={{ justifyContent: "space-between" }}>
                <div>
                  <div className="x-subtitle">
                    <i className="fa-solid fa-book-open" /> Hướng dẫn sử dụng
                  </div>
                  <div className="x-help">Danh sách bước: dùng mũi tên để đổi thứ tự (1..n tự cập nhật).</div>
                </div>

                <button
                    className="x-btn x-btn-ghost"
                    onClick={() =>
                        setProduct((prev) => {
                          if (!prev) return prev;
                          const current = prev.translations.find((item) => item.lang === activeLang)?.guideContent;
                          const steps = current?.steps || [];
                          const nextSteps = normalizeStepOrders([...steps, { order: steps.length + 1, content: "" }]);
                          return {
                            ...prev,
                            translations: upsertTranslation(prev.translations, activeLang, {
                              guideContent: { intro: current?.intro || "", steps: nextSteps },
                            }),
                          };
                        })
                    }
                >
                  <i className="fa-solid fa-plus" /> <span>Thêm bước</span>
                </button>
              </div>

              <div className="x-stack" style={{ marginTop: 10 }}>
                <label className="x-field">
                  <div className="x-label">Giới thiệu</div>
                  <textarea
                      rows={3}
                      className="x-input x-textarea"
                      value={translation?.guideContent?.intro || ""}
                      onChange={(e) =>
                          setProduct((prev) => {
                            if (!prev) return prev;
                            return {
                              ...prev,
                              translations: upsertTranslation(prev.translations, activeLang, {
                                guideContent: {
                                  intro: e.target.value,
                                  steps: translation?.guideContent?.steps || [],
                                },
                              }),
                            };
                          })
                      }
                      placeholder="Giới thiệu ngắn về cách dùng…"
                  />
                </label>

                <div className="x-steps">
                  {(translation?.guideContent?.steps || []).length === 0 ? (
                      <div className="x-empty">
                        <i className="fa-regular fa-face-smile" /> Chưa có bước nào.
                      </div>
                  ) : (
                      (translation?.guideContent?.steps || []).map((step, idx) => (
                          <div key={`${step.order}-${idx}`} className="x-step-row">
                            <div className="x-step-index">#{idx + 1}</div>

                            <input
                                className="x-input x-step-input"
                                value={step.content}
                                placeholder="Nội dung bước…"
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
                                          guideContent: { intro: current?.intro || "", steps: normalizeStepOrders(steps) },
                                        }),
                                      };
                                    })
                                }
                            />

                            <div className="x-step-actions">
                              <button
                                  className="x-icon-btn"
                                  disabled={idx === 0}
                                  title="Lên"
                                  onClick={() =>
                                      setProduct((prev) => {
                                        if (!prev) return prev;
                                        const current = prev.translations.find((item) => item.lang === activeLang)?.guideContent;
                                        const steps = [...(current?.steps || [])];
                                        if (idx <= 0) return prev;
                                        const [picked] = steps.splice(idx, 1);
                                        steps.splice(idx - 1, 0, picked);
                                        return {
                                          ...prev,
                                          translations: upsertTranslation(prev.translations, activeLang, {
                                            guideContent: { intro: current?.intro || "", steps: normalizeStepOrders(steps) },
                                          }),
                                        };
                                      })
                                  }
                              >
                                <i className="fa-solid fa-arrow-up" />
                              </button>

                              <button
                                  className="x-icon-btn"
                                  disabled={idx === (translation?.guideContent?.steps || []).length - 1}
                                  title="Xuống"
                                  onClick={() =>
                                      setProduct((prev) => {
                                        if (!prev) return prev;
                                        const current = prev.translations.find((item) => item.lang === activeLang)?.guideContent;
                                        const steps = [...(current?.steps || [])];
                                        if (idx >= steps.length - 1) return prev;
                                        const [picked] = steps.splice(idx, 1);
                                        steps.splice(idx + 1, 0, picked);
                                        return {
                                          ...prev,
                                          translations: upsertTranslation(prev.translations, activeLang, {
                                            guideContent: { intro: current?.intro || "", steps: normalizeStepOrders(steps) },
                                          }),
                                        };
                                      })
                                  }
                              >
                                <i className="fa-solid fa-arrow-down" />
                              </button>

                              <button
                                  className="x-icon-btn x-icon-danger"
                                  title="Xóa bước"
                                  onClick={() =>
                                      setProduct((prev) => {
                                        if (!prev) return prev;
                                        const current = prev.translations.find((item) => item.lang === activeLang)?.guideContent;
                                        const steps = (current?.steps || []).filter((_, rowIdx) => rowIdx !== idx);
                                        return {
                                          ...prev,
                                          translations: upsertTranslation(prev.translations, activeLang, {
                                            guideContent: { intro: current?.intro || "", steps: normalizeStepOrders(steps) },
                                          }),
                                        };
                                      })
                                  }
                              >
                                <i className="fa-solid fa-trash" />
                              </button>
                            </div>
                          </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
    );
  };

  const renderImagesTab = () => {
    if (!product) return null;

    const primaryMissing = product.images.length > 0 && !product.images.some((x) => x.isPrimary);

    return (
        <div className="x-card">
          <div className="x-row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div className="x-section-title" style={{ marginBottom: 6 }}>
                <i className="fa-regular fa-images" /> <span>Hình ảnh sản phẩm</span>
              </div>
              <div className="x-help">
                • Bấm <i className="fa-solid fa-thumbtack" /> để chọn ảnh chính • Hover để hiện mũi tên đổi thứ tự • Bấm{" "}
                <i className="fa-solid fa-trash" /> để xóa
              </div>
              {primaryMissing && (
                  <div className="x-warn">
                    <i className="fa-solid fa-triangle-exclamation" /> Chưa có ảnh chính. Hãy ghim 1 ảnh.
                  </div>
              )}
            </div>

            <label className="x-btn x-btn-primary" style={{ cursor: "pointer", userSelect: "none" }}>
              <i className="fa-solid fa-cloud-arrow-up" /> <span>Tải ảnh</span>
              <input
                  type="file"
                  multiple
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    onAddImages(e.target.files);
                    e.currentTarget.value = "";
                  }}
              />
            </label>
          </div>

          {product.images.length === 0 ? (
              <div className="x-empty" style={{ marginTop: 14 }}>
                <i className="fa-regular fa-image" /> Chưa có ảnh cho sản phẩm này.
              </div>
          ) : (
              <div className="x-image-grid">
                {product.images.map((img, idx) => {
                  const pinned = img.isPrimary;

                  return (
                      <div key={img.id} className="x-img-card">
                        <img className="x-img" src={img.imageUrl} alt={`Product ${idx + 1}`} />

                        {/* Pin (top-left) */}
                        <button
                            type="button"
                            className={classNames("x-img-pin", pinned && "x-img-pin-active")}
                            onClick={() => setPrimaryImage(img.id)}
                            title={pinned ? "Ảnh chính" : "Đặt làm ảnh chính"}
                        >
                          <i className="fa-solid fa-thumbtack" />
                        </button>

                        {/* Trash (top-right) */}
                        <button
                            type="button"
                            className="x-img-trash"
                            onClick={() => onDeleteImage(img.id)}
                            title="Xóa ảnh"
                        >
                          <i className="fa-solid fa-trash" />
                        </button>

                        {/* Hover reorder arrows */}
                        <div className="x-img-reorder">
                          <button
                              type="button"
                              className="x-img-arrow"
                              disabled={idx === 0}
                              onClick={() => moveImage(img.id, -1)}
                              title="Lên trước"
                          >
                            <i className="fa-solid fa-arrow-up" />
                          </button>
                          <button
                              type="button"
                              className="x-img-arrow"
                              disabled={idx === product.images.length - 1}
                              onClick={() => moveImage(img.id, 1)}
                              title="Xuống sau"
                          >
                            <i className="fa-solid fa-arrow-down" />
                          </button>
                        </div>

                        {/* Footer info */}
                        <div className="x-img-footer">
                    <span className={classNames("x-pill", "x-pill-muted")} title="Thứ tự hiển thị">
                      <i className="fa-solid fa-arrow-down-wide-short" /> {img.sortOrder}
                    </span>
                          {isTempImageId(img.id) && (
                              <span className={classNames("x-pill", "x-pill-info")} title="Chưa lưu">
                        <i className="fa-solid fa-clock" /> Temp
                      </span>
                          )}
                          {pinned && (
                              <span className={classNames("x-pill", "x-pill-ok")} title="Ảnh chính">
                        <i className="fa-solid fa-star" /> Primary
                      </span>
                          )}
                        </div>
                      </div>
                  );
                })}
              </div>
          )}
        </div>
    );
  };

  const renderMetaTab = () => {
    if (!product) return null;

    return (
        <div className="x-grid2" style={{ alignItems: "start" }}>
          {/* Ingredients */}
          <div className="x-card">
            <div className="x-row" style={{ justifyContent: "space-between" }}>
              <div className="x-section-title">
                <i className="fa-solid fa-flask" /> <span>Thành phần</span>
              </div>
              <button
                  className="x-icon-btn x-icon-primary"
                  title="Thêm thành phần"
                  onClick={() => setProduct((prev) => (prev ? { ...prev, ingredients: [...prev.ingredients, createIngredient()] } : prev))}
              >
                <i className="fa-solid fa-plus" />
              </button>
            </div>

            <div className="x-table">
              <div className="x-thead">
                <div>Tên ({activeLang})</div>
                <div>Ghi chú</div>
                <div className="x-right">Action</div>
              </div>

              {product.ingredients.length === 0 ? (
                  <div className="x-empty" style={{ marginTop: 10 }}>
                    <i className="fa-regular fa-circle-xmark" /> Chưa có thành phần.
                  </div>
              ) : (
                  product.ingredients.map((item) => (
                      <div key={item.id} className="x-tr">
                        <input
                            className="x-input"
                            placeholder={`Tên (${activeLang})`}
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
                            className="x-input"
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
                        <div className="x-right">
                          <button
                              className="x-icon-btn x-icon-danger"
                              title="Xóa"
                              onClick={() =>
                                  setProduct((prev) => (prev ? { ...prev, ingredients: prev.ingredients.filter((row) => row.id !== item.id) } : prev))
                              }
                          >
                            <i className="fa-solid fa-trash" />
                          </button>
                        </div>
                      </div>
                  ))
              )}
            </div>
          </div>

          {/* Attributes */}
          <div className="x-card">
            <div className="x-row" style={{ justifyContent: "space-between" }}>
              <div className="x-section-title">
                <i className="fa-solid fa-tags" /> <span>Thuộc tính</span>
              </div>
              <button
                  className="x-icon-btn x-icon-primary"
                  title="Thêm thuộc tính"
                  onClick={() => setProduct((prev) => (prev ? { ...prev, attributes: [...prev.attributes, createAttribute()] } : prev))}
              >
                <i className="fa-solid fa-plus" />
              </button>
            </div>

            <div className="x-table">
              <div className="x-thead">
                <div>Tên ({activeLang})</div>
                <div>Giá trị</div>
                <div className="x-right">Action</div>
              </div>

              {product.attributes.length === 0 ? (
                  <div className="x-empty" style={{ marginTop: 10 }}>
                    <i className="fa-regular fa-circle-xmark" /> Chưa có thuộc tính.
                  </div>
              ) : (
                  product.attributes.map((item) => (
                      <div key={item.id} className="x-tr">
                        <input
                            className="x-input"
                            placeholder={`Tên (${activeLang})`}
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
                            className="x-input"
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
                        <div className="x-right">
                          <button
                              className="x-icon-btn x-icon-danger"
                              title="Xóa"
                              onClick={() =>
                                  setProduct((prev) => (prev ? { ...prev, attributes: prev.attributes.filter((row) => row.id !== item.id) } : prev))
                              }
                          >
                            <i className="fa-solid fa-trash" />
                          </button>
                        </div>
                      </div>
                  ))
              )}
            </div>
          </div>
        </div>
    );
  };

  if (!product && isLoading) {
    // lightweight loading shell
    return (
        <div className="x-wrap">
          <style>{styles}</style>
          <div className="x-skeleton-header" />
          <div className="x-skeleton-card" />
          <div className="x-skeleton-card" />
        </div>
    );
  }

  if (!product) {
    return (
        <div className="x-wrap">
          <style>{styles}</style>
          <div className="x-card">
            <div className="x-section-title">
              <i className="fa-solid fa-circle-xmark" /> <span>Không tìm thấy sản phẩm</span>
            </div>
            <div className="x-help">Hãy kiểm tra lại đường dẫn hoặc quyền truy cập.</div>
            <div style={{ marginTop: 12 }}>
              <button className="x-btn x-btn-ghost" onClick={() => navigate("/catalog/products")}>
                <i className="fa-solid fa-arrow-left" /> <span>Về danh sách</span>
              </button>
            </div>
          </div>
        </div>
    );
  }

  const pageTitle = translation?.name || "Sản phẩm mới";

  return (
      <div className="x-wrap">
        <style>{styles}</style>

        {/* Top modern header */}
        <div className="x-topbar">
          <div className="x-topbar-left">
            <div className="x-title-row">
              <div className="x-title">{pageTitle}</div>
              <span className={classNames("x-pill", statusTone === "ok" ? "x-pill-ok" : statusTone === "warn" ? "x-pill-warn" : "x-pill-info")}>
              {saving ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin" /> {statusText}
                  </>
              ) : (
                  <>
                    <i className={statusTone === "ok" ? "fa-solid fa-check" : statusTone === "warn" ? "fa-solid fa-pen" : "fa-solid fa-circle-info"} />{" "}
                    {statusText}
                  </>
              )}
            </span>
            </div>

            <div className="x-subrow">
            <span className="x-chip">
              <i className="fa-solid fa-barcode" /> {product.sku || "—"}
            </span>
              <span className="x-chip">
              <i className="fa-solid fa-layer-group" />{" "}
                {product.categoryId
                    ? categoryLabel(categories.find((c) => c.id === product.categoryId) || categories[0] || { id: product.categoryId, translations: [] as any })
                    : "Chưa chọn category"}
            </span>
            </div>
          </div>

          <div className="x-topbar-actions">
            <button className="x-icon-btn" title="Về danh sách" onClick={() => navigate("/catalog/products")}>
              <i className="fa-solid fa-arrow-left" />
            </button>

            <button className="x-icon-btn" title="Hoàn tác" onClick={() => void resetChanges()} disabled={!isDirty || saving}>
              <i className="fa-solid fa-rotate-left" />
            </button>

            <button className="x-btn x-btn-primary" title="Lưu thay đổi" onClick={onSave} disabled={!isDirty || saving}>
              <i className="fa-solid fa-floppy-disk" /> <span>{saving ? "Đang lưu" : "Lưu"}</span>
            </button>

            <button
                className="x-icon-btn x-icon-danger"
                title="Xóa sản phẩm"
                onClick={() => void onDeleteProduct()}
                disabled={saving}
            >
              <i className="fa-solid fa-trash" />
            </button>
          </div>
        </div>

        {/* Language selector ABOVE tabs (global) */}
        <div className="x-toolbar">
          <div className="x-langbar">
            <div className="x-toolbar-label">
              <i className="fa-solid fa-globe" /> Ngôn ngữ
            </div>
            <div className="x-lang-pills">
              {languages.map((l) => (
                  <button
                      key={l.code}
                      className={classNames("x-pill-btn", activeLang === l.code && "x-pill-btn-active", langStatus(l.code) === "warn" && "x-pill-btn-warn")}
                      onClick={() => setActiveLang(l.code)}
                      title={langStatus(l.code) === "warn" ? "Thiếu tên sản phẩm" : "Đã có nội dung"}
                  >
                    <span className="x-pill-btn-dot" />
                    {l.label}
                    {langStatus(l.code) === "warn" ? <i className="fa-solid fa-triangle-exclamation" /> : <i className="fa-solid fa-check" />}
                  </button>
              ))}
            </div>
          </div>

          <div className="x-tabs">
            <button className={classNames("x-tab", activeTab === "general" && "x-tab-active")} onClick={() => setActiveTab("general")}>
              <i className="fa-solid fa-sliders" /> <span>Tổng quan</span>
            </button>
            <button
                className={classNames("x-tab", activeTab === "translations" && "x-tab-active")}
                onClick={() => setActiveTab("translations")}
            >
              <i className="fa-solid fa-language" /> <span>Nội dung</span>
            </button>
            <button className={classNames("x-tab", activeTab === "images" && "x-tab-active")} onClick={() => setActiveTab("images")}>
              <i className="fa-regular fa-images" /> <span>Hình ảnh</span>
            </button>
            <button className={classNames("x-tab", activeTab === "meta" && "x-tab-active")} onClick={() => setActiveTab("meta")}>
              <i className="fa-solid fa-tags" /> <span>Thuộc tính</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={classNames("x-content", (isLoading || saving) && "x-dim")}>
          {activeTab === "general" && renderGeneralTab()}
          {activeTab === "translations" && renderTranslationsTab()}
          {activeTab === "images" && renderImagesTab()}
          {activeTab === "meta" && renderMetaTab()}
        </div>

        {/* Footer */}
        <div className="x-footer">
          <Link to="/catalog/products" className="x-btn x-btn-ghost">
            <i className="fa-solid fa-arrow-left" /> <span>Về danh sách</span>
          </Link>
        </div>

        {/* Loading overlay */}
        {(isLoading || saving) && (
            <div className="x-overlay" aria-hidden="true">
              <div className="x-loader">
                <div className="x-spinner" />
                <div className="x-loader-text">{saving ? "Đang lưu thay đổi…" : "Đang tải dữ liệu…"}</div>
              </div>
            </div>
        )}
      </div>
  );
}

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
  display: grid;
  gap: 10px;
}

.x-langbar{
  display:flex;
  gap: 10px;
  align-items: flex-start;
  justify-content: space-between;
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
.x-pill-btn-warn{ border-color: var(--warn); }

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
.x-dim{ opacity: 0.7; pointer-events: none; }

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

.x-subtitle{ font-weight: 800; display:flex; gap:8px; align-items:center; color: var(--text); }
.x-help{ color: var(--muted); margin-top: 4px; line-height: 1.35; }
.x-help-warn{ color: #b45309; font-weight: 600; }
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
.x-textarea{ resize: vertical; min-height: 110px; }

.x-input-prefix{
  display:flex;
  align-items: stretch;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--stroke);
  background: #ffffff;
}
.x-prefix{
  display:flex;
  align-items:center;
  padding: 0 10px;
  color: var(--muted);
  border-right: 1px solid var(--stroke);
  background: var(--panel);
}
.x-input-inner{ border: 0; background: transparent; border-radius: 0; }
.x-input-inner:focus{ outline:none; }

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
.x-btn-primary:hover{color: var(--brand1); box-shadow: 0 6px 14px rgba(43,213,255,0.25); }
.x-btn-danger{
  border-color: var(--danger);
  background: linear-gradient(135deg, var(--danger), #f87171);
  color: white;
}
.x-btn-ghost{
  background: transparent;
  border-color: transparent;
}
.x-btn-ghost:hover{
  background: var(--panel);
  border-color: var(--stroke);
}

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

.x-icon-primary{ border-color: var(--brand1); color: var(--brand1); }
.x-icon-danger{ border-color: var(--danger); color: var(--danger); }

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

.x-switch{
  width: 46px;
  height: 26px;
  border-radius: 999px;
  border: 1px solid var(--stroke);
  background: var(--panel);
  display:inline-flex;
  align-items:center;
  padding: 2px;
  cursor:pointer;
  transition: background .12s ease, border-color .12s ease, transform .12s ease;
}
.x-switch:hover{ transform: translateY(-1px); }
.x-switch:active{ transform: translateY(0px) scale(0.98); }
.x-switch-thumb{
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: var(--muted);
  transform: translateX(0px);
  transition: transform .16s ease;
}
.x-switch-on{
  background: rgba(16,185,129,0.15);
  border-color: var(--ok);
}
.x-switch-on .x-switch-thumb{ transform: translateX(20px); background: var(--ok); }

.x-steps{ display:grid; gap: 8px; }
.x-step-row{
  display:grid;
  grid-template-columns: 64px 1fr auto;
  gap: 8px;
  align-items:center;
}
@media (max-width: 860px){ .x-step-row{ grid-template-columns: 52px 1fr; } .x-step-actions{ justify-content:flex-start; } }
.x-step-index{ color: var(--muted); font-weight: 900; }
.x-step-input{ min-height: 38px; }
.x-step-actions{ display:flex; gap: 6px; justify-content:flex-end; }
.x-right{ text-align:right; display:flex; justify-content:flex-end; }

.x-table{ margin-top: 10px; display:grid; gap: 8px; }
.x-thead{
  display:grid;
  grid-template-columns: 1fr 1fr 80px;
  gap: 8px;
  color: var(--muted);
  font-weight: 900;
  font-size: 12px;
}
.x-tr{
  display:grid;
  grid-template-columns: 1fr 1fr 80px;
  gap: 8px;
  align-items:center;
}

.x-image-grid{
  margin-top: 12px;
  display:grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
}
.x-img-card{
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--stroke);
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
  transition: transform .14s ease, border-color .14s ease;
}
.x-img-card:hover{
  transform: translateY(-2px);
  border-color: var(--brand2);
}
.x-img{ width:100%; height: 160px; object-fit: cover; display:block; }

.x-img-pin, .x-img-trash{
  position:absolute;
  top: 10px;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: 1px solid var(--stroke);
  background: rgba(255,255,255,0.8);
  color: var(--text);
  display:flex;
  align-items:center;
  justify-content:center;
  cursor:pointer;
  transition: transform .12s ease, background .12s ease, border-color .12s ease;
  backdrop-filter: blur(6px);
}
.x-img-pin{ left: 10px; transform: rotate(-20deg); }
.x-img-trash{ right: 10px; }
.x-img-pin:hover, .x-img-trash:hover{ transform: translateY(-1px) rotate(-20deg); background: rgba(255,255,255,0.95); }
.x-img-trash:hover{ transform: translateY(-1px); }
.x-img-pin-active{
  border-color: var(--ok);
  background: rgba(16,185,129,0.2);
  color: var(--ok);
}

.x-img-reorder{
  position:absolute;
  height: fit-content;
  inset: 0;
  display:flex;
  align-items:center;
  justify-content: space-between;
  padding: 0 10px;
  opacity: 0;
  pointer-events: none;
  transition: opacity .12s ease;
    top: 120px;
}
.x-img-card:hover .x-img-reorder{ opacity: 1; pointer-events: auto; }
.x-img-arrow{
  width: 34px;
  height: 34px;
  border-radius: 12px;
  border: 1px solid var(--stroke);
  background: rgba(255,255,255,0.8);
  color: var(--text);
  display:flex;
  align-items:center;
  justify-content:center;
  cursor:pointer;
  backdrop-filter: blur(6px);
  transition: transform .12s ease, background .12s ease;
}
.x-img-arrow:hover{ transform: translateY(-1px); background: rgba(255,255,255,0.95); }
.x-img-arrow:disabled{ opacity:0.45; cursor:not-allowed; }

.x-img-footer{
  padding: 10px 10px;
  display:flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items:center;
  justify-content:flex-start;
  background: linear-gradient(180deg, rgba(0,0,0,0.0), var(--panel));
}

.x-empty{
  color: var(--muted);
  border: 1px dashed var(--stroke);
  background: var(--panel);
  border-radius: 14px;
  padding: 14px;
  display:flex;
  gap: 10px;
  align-items:center;
}

.x-footer{
  display:flex;
  justify-content: space-between;
  flex-wrap: wrap;
}

.x-overlay{
  position: fixed;
  inset: 0;
  background: rgba(255,255,255,0.6);
  display:flex;
  align-items:center;
  justify-content:center;
  z-index: 60;
  backdrop-filter: blur(6px);
}
.x-loader{
  border: 1px solid var(--stroke);
  background: #ffffff;
  border-radius: 16px;
  padding: 14px 16px;
  display:flex;
  gap: 12px;
  align-items:center;
  box-shadow: 0 8px 20px rgba(0,0,0,0.05);
}
.x-spinner{
  width: 18px; height: 18px;
  border-radius: 999px;
  border: 2px solid var(--stroke);
  border-top-color: var(--brand2);
  animation: xspin .8s linear infinite;
}
@keyframes xspin{ to{ transform: rotate(360deg);} }
.x-loader-text{ color: var(--text); font-weight: 800; }

.x-input-invalid{ border-color: #ef4444 !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.15); }
.x-error-text{ margin-top: 4px; color: #dc2626; font-size: 12px; font-weight: 700; }

.x-dialog-backdrop{
  position: fixed;
  inset: 0;
  background: rgba(255,255,255,0.6);
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
.x-dialog-msg{ margin-top: 10px; color: var(--muted); white-space: pre-wrap; line-height: 1.45; }
.x-dialog-actions{ margin-top: 14px; display:flex; gap: 8px; justify-content:flex-end; flex-wrap: wrap; }

.x-skeleton-header, .x-skeleton-card{
  border-radius: 16px;
  border: 1px solid var(--stroke);
  background: linear-gradient(90deg, var(--panel), var(--panel2), var(--panel));
  background-size: 200% 100%;
  animation: xsheen 1.1s ease-in-out infinite;
}
.x-skeleton-header{ height: 74px; }
.x-skeleton-card{ height: 160px; }
@keyframes xsheen{ 0%{ background-position: 0% 0%; } 100%{ background-position: 200% 0%; } }
`;