import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { http } from "../api/http";
import { MAX_COMPARE_PRODUCTS, MIN_COMPARE_PRODUCTS, readCompareProductIds, writeCompareProductIds } from "../services/compare.utils";

type CompareProduct = {
  id: string | number;
  sku: string;
  name: string;
  shortDescription?: string | null;
  price: number;
  image?: string | null;
  attributes?: Array<{ key?: string; name?: string; valueText?: string | null; valueNumber?: number | null; valueBoolean?: boolean | null }>;
};

type ProductListItem = {
  sku: string;
  id: string | number;
  name: string;
  image?: string | null;
  shortDescription?: string | null;
  price: number;
};

type CompareCmsData = {
  header: {
    eyebrow: string;
    title: string;
    subtitleTemplate: string;
    addButton: { text: string; iconClass: string };
  };
  table: {
    criteriaHeader: string;
    rowProductLabel: string;
    rowShortDescriptionLabel: string;
    rowPriceLabel: string;
    rowRatingLabel: string;
    ratingValueText: string;
  };
  modal: {
    title: string;
    closeText: string;
    searchPlaceholder: string;
    selectedSummary: {
      prefix: string;
      suffixTemplate: string;
    };
    applyText: string;
  };
  notices: {
    needMinProductsTemplate: string;
  };
  links: {
    backToProducts: { text: string; iconClass: string };
  };
  common: {
    dash: string;
    yesText: string;
    noText: string;
  };
};

// Default CMS data (used as the UI fallback, and also matches the structure returned from:
// GET /public/pages/global?lang=xx -> res.data?.sections[0]?.data
const defaultCmsData: CompareCmsData = {
  header: {
    eyebrow: "Compare",
    title: "So sánh sản phẩm",
    subtitleTemplate: "Chọn tối thiểu {min} và tối đa {max} sản phẩm để so sánh.",
    addButton: { text: "Thêm sản phẩm", iconClass: "fa-solid fa-plus" },
  },
  table: {
    criteriaHeader: "Tiêu chí",
    rowProductLabel: "Sản phẩm",
    rowShortDescriptionLabel: "Mô tả ngắn",
    rowPriceLabel: "Giá",
    rowRatingLabel: "Đánh giá",
    ratingValueText: "5.0★",
  },
  modal: {
    title: "Chọn sản phẩm so sánh",
    closeText: "Đóng",
    searchPlaceholder: "Tìm theo tên hoặc SKU",
    selectedSummary: {
      prefix: "Đã chọn:",
      suffixTemplate: "/ {max} (tối thiểu {min})",
    },
    applyText: "Áp dụng",
  },
  notices: {
    needMinProductsTemplate: "Vui lòng chọn ít nhất {min} sản phẩm để bắt đầu so sánh.",
  },
  links: {
    backToProducts: { text: "Quay lại danh sách sản phẩm", iconClass: "fa-solid fa-arrow-left" },
  },
  common: {
    dash: "—",
    yesText: "Có",
    noText: "Không",
  },
};

function tpl(text: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce((acc, [k, v]) => acc.split(`{${k}}`).join(String(v)), text);
}

function attributeValue(a: any, cmsData: CompareCmsData): string {
  if (a?.valueText) return String(a.valueText);
  if (typeof a?.valueNumber === "number") return String(a.valueNumber);
  if (typeof a?.valueBoolean === "boolean") return a.valueBoolean ? cmsData.common.yesText : cmsData.common.noText;
  return cmsData.common.dash;
}

export default function ComparePage() {
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => localStorage.getItem("preferred-language") || "vi");
  const [selectedSkus, setSelectedSkus] = useState<string[]>(() => readCompareProductIds());
  const [catalogItems, setCatalogItems] = useState<ProductListItem[]>([]);
  const [products, setProducts] = useState<CompareProduct[]>([]);
  const [cmsData, setCmsData] = useState<CompareCmsData>(() => defaultCmsData);
  const [openPicker, setOpenPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerSelected, setPickerSelected] = useState<string[]>([]);

  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => setCurrentLanguage(event.detail.language);
    const syncCompare = () => setSelectedSkus(readCompareProductIds());

    window.addEventListener("languageChange", handleLanguageChange as EventListener);
    window.addEventListener("aya_compare_changed", syncCompare as EventListener);
    return () => {
      window.removeEventListener("languageChange", handleLanguageChange as EventListener);
      window.removeEventListener("aya_compare_changed", syncCompare as EventListener);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await http.get(`/public/pages/compare?lang=${currentLanguage}`);
        const next = res.data?.sections?.[0]?.data;
        if (cancelled) return;
        setCmsData(next || defaultCmsData);
      } catch (error) {
        console.error("GET /public/pages/global failed on compare:", error);
        if (!cancelled) setCmsData(defaultCmsData);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentLanguage]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await http.get("/public/catalog/products", {
          params: { lang: currentLanguage, page: 1, pageSize: 100, sort: "nameAsc" },
        });
        if (cancelled) return;
        const rows = Array.isArray(res.data?.items) ? res.data.items : [];
        setCatalogItems(rows);
      } catch (error) {
        console.error("GET /public/catalog/products failed on compare:", error);
        if (!cancelled) setCatalogItems([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentLanguage]);

  useEffect(() => {
    let cancelled = false;
    const loadDetails = async () => {
      if (!selectedSkus.length) {
        setProducts([]);
        return;
      }

      try {
        const rows = await Promise.all(
            selectedSkus.map(async (sku) => {
              const res = await http.get(`/public/catalog/products/${sku}?lang=${currentLanguage}`);
              console.log("Loaded product for compare:", res.data);
              return res.data;
            })
        );
        if (!cancelled) setProducts(rows);
      } catch (error) {
        console.error("GET /public/catalog/products/:sku failed on compare:", error);
        if (!cancelled) setProducts([]);
      }
    };

    loadDetails();
    return () => {
      cancelled = true;
    };
  }, [selectedSkus, currentLanguage]);

  const filteredCatalog = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    if (!q) return catalogItems;
    return catalogItems.filter((p) => String(p.name).toLowerCase().includes(q) || String(p.sku).toLowerCase().includes(q));
  }, [catalogItems, pickerSearch]);

  const attributeRows = useMemo(() => {
    // key -> { key, name, count }
    const counters = new Map<string, { key: string; name: string; count: number }>();

    products.forEach((p) => {
      (p.attributes || []).forEach((a) => {
        const key = String(a?.key || a?.name || "").trim();
        if (!key) return;

        const name = String(a?.name || a?.key || key).trim();

        const prev = counters.get(key);
        if (prev) {
          prev.count += 1;
          // nếu muốn ưu tiên name "đẹp hơn" (ví dụ dài hơn) thì:
          if (!prev.name || prev.name === prev.key) prev.name = name;
        } else {
          counters.set(key, { key, name, count: 1 });
        }
      });
    });

    const all = Array.from(counters.values());
    all.sort((a, b) => (b.count === a.count ? a.name.localeCompare(b.name) : b.count - a.count));
    return all;
  }, [products]);

  function openModal() {
    setPickerSelected(selectedSkus.slice(0, MAX_COMPARE_PRODUCTS));
    setPickerSearch("");
    setOpenPicker(true);
  }

  function applyPicker() {
    if (pickerSelected.length < MIN_COMPARE_PRODUCTS || pickerSelected.length > MAX_COMPARE_PRODUCTS) return;
    writeCompareProductIds(pickerSelected);
    setSelectedSkus(pickerSelected);
    setOpenPicker(false);
  }

  function removeSku(sku: string) {
    const next = selectedSkus.filter((x) => x !== sku);
    writeCompareProductIds(next);
    setSelectedSkus(next);
  }

  return (
      <div className="text-slate-900">
        <main className="px-4 py-10">
          <div className="max-w-6xl mx-auto grid gap-4">
            <section className="card p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="text-xs font-extrabold text-slate-500">{cmsData.header.eyebrow}</div>
                  <h1 className="text-2xl font-extrabold">{cmsData.header.title}</h1>
                  <div className="mt-1 text-sm text-slate-600">
                    {tpl(cmsData.header.subtitleTemplate, { min: MIN_COMPARE_PRODUCTS, max: MAX_COMPARE_PRODUCTS })}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn" type="button" onClick={openModal}>
                    <i className={`${cmsData.header.addButton.iconClass} mr-2`} />
                    {cmsData.header.addButton.text}
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {selectedSkus.map((sku) => (
                    <span key={sku} className="chip">
                  {sku}
                      <button className="ml-2" onClick={() => removeSku(sku)}>
                    ✕
                  </button>
                </span>
                ))}
              </div>

              {products.length >= MIN_COMPARE_PRODUCTS ? (
                  <div className="mt-5 overflow-auto">
                    <table className="w-full min-w-[780px] text-sm">
                      <thead className="text-left text-slate-500">
                      <tr className="border-b border-slate-200">
                        <th className="py-3 pr-4">{cmsData.table.criteriaHeader}</th>
                        {products.map((p) => (
                            <th key={p.sku} className="py-3 pr-4">
                              {p.name}
                            </th>
                        ))}
                      </tr>
                      </thead>
                      <tbody className="text-slate-700">
                      <tr className="border-b border-slate-100">
                        <td className="py-3 pr-4 font-extrabold">{cmsData.table.rowProductLabel}</td>
                        {products.map((p) => (
                            <td key={p.sku} className="py-3 pr-4">
                              <div className="flex items-center gap-3">
                                <img className="h-14 w-14 rounded-xl object-cover ring-1 ring-slate-200" src={p.image || ""} alt={p.name} />
                                <div>
                                  <div className="font-extrabold">{p.name}</div>
                                  <div className="text-xs text-slate-500">{p.sku}</div>
                                </div>
                              </div>
                            </td>
                        ))}
                      </tr>

                      <tr className="border-b border-slate-100">
                        <td className="py-3 pr-4 font-extrabold">{cmsData.table.rowShortDescriptionLabel}</td>
                        {products.map((p) => (
                            <td key={p.sku} className="py-3 pr-4">
                              {p.shortDescription || cmsData.common.dash}
                            </td>
                        ))}
                      </tr>

                      <tr className="border-b border-slate-100">
                        <td className="py-3 pr-4 font-extrabold">{cmsData.table.rowPriceLabel}</td>
                        {products.map((p) => (
                            <td key={p.sku} className="py-3 pr-4">
                              {new Intl.NumberFormat(currentLanguage === "vi" ? "vi-VN" : "en-US", {
                                style: "currency",
                                currency: "VND",
                                maximumFractionDigits: 0,
                              }).format(Number(p.price || 0))}
                            </td>
                        ))}
                      </tr>

                      <tr className="border-b border-slate-100">
                        <td className="py-3 pr-4 font-extrabold">{cmsData.table.rowRatingLabel}</td>
                        {products.map((p) => (
                            <td key={p.sku} className="py-3 pr-4">
                              {cmsData.table.ratingValueText}
                            </td>
                        ))}
                      </tr>

                      {attributeRows.map((row) => (
                          <tr key={row.key} className="border-b border-slate-100">
                            <td className="py-3 pr-4 font-extrabold">{row.name || row.key}</td>
                            {products.map((p) => {
                              const matched = (p.attributes || []).find((a) => String(a?.key || a?.name) === row.key);
                              return (
                                  <td key={`${p.sku}-${row.key}`} className="py-3 pr-4">
                                    {matched ? attributeValue(matched, cmsData) : cmsData.common.dash}
                                  </td>
                              );
                            })}
                          </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>
              ) : (
                  <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-700">
                    {tpl(cmsData.notices.needMinProductsTemplate, { min: MIN_COMPARE_PRODUCTS })}
                  </div>
              )}

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <Link className="btn text-center" to="/products">
                  <i className={`${cmsData.links.backToProducts.iconClass} mr-2`} />
                  {cmsData.links.backToProducts.text}
                </Link>
              </div>
            </section>
          </div>
        </main>

        {openPicker ? (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4">
              <div className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-2xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-extrabold">{cmsData.modal.title}</h2>
                  <button className="btn" onClick={() => setOpenPicker(false)}>
                    {cmsData.modal.closeText}
                  </button>
                </div>

                <input
                    className="field mt-3"
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    placeholder={cmsData.modal.searchPlaceholder}
                />

                <div className="mt-3 max-h-[360px] overflow-auto space-y-2">
                  {filteredCatalog.map((p) => {
                    const checked = pickerSelected.includes(p.sku);
                    const disabled = !checked && pickerSelected.length >= MAX_COMPARE_PRODUCTS;
                    return (
                        <label key={p.sku} className={`flex items-center gap-3 rounded-xl border p-3 ${disabled ? "opacity-60" : ""}`}>
                          <input
                              type="checkbox"
                              checked={checked}
                              disabled={disabled}
                              onChange={() => {
                                if (checked) {
                                  setPickerSelected((prev) => prev.filter((x) => x !== p.sku));
                                  return;
                                }
                                if (pickerSelected.length >= MAX_COMPARE_PRODUCTS) return;
                                setPickerSelected((prev) => [...prev, p.sku]);
                              }}
                          />
                          <img className="h-12 w-12 rounded-lg object-cover ring-1 ring-slate-200" src={p.image || ""} alt={p.name} />
                          <div className="min-w-0">
                            <div className="font-semibold">{p.name}</div>
                            <div className="text-xs text-slate-500">{p.sku}</div>
                          </div>
                        </label>
                    );
                  })}
                </div>

                <div className="mt-4 flex items-center justify-between text-sm">
                  <div>
                    {cmsData.modal.selectedSummary.prefix} <b>{pickerSelected.length}</b>{" "}
                    {tpl(cmsData.modal.selectedSummary.suffixTemplate, { max: MAX_COMPARE_PRODUCTS, min: MIN_COMPARE_PRODUCTS })}
                  </div>
                  <button
                      className={`btn ${pickerSelected.length < MIN_COMPARE_PRODUCTS ? "opacity-60" : ""}`}
                      disabled={pickerSelected.length < MIN_COMPARE_PRODUCTS}
                      onClick={applyPicker}
                  >
                    {cmsData.modal.applyText}
                  </button>
                </div>
              </div>
            </div>
        ) : null}
      </div>
  );
}