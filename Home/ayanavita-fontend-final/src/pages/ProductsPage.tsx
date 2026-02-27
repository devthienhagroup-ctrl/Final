// src/pages/ProductsPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { http } from "../api/http";

import { CATEGORY_PRODUCTS, type SkinConcern, type ProductType } from "../data/productCategory.data";
import { ProductFilters, type PriceRange, type SortKey } from "../components/products/ProductFilters";
import { ProductCard } from "../components/products/ProductCard";
import { addCompareProductId } from "../services/compare.utils";

const defaultCmsData = {
  banner: {
    imageAlt: "banner",
    imageSrc: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1400&q=70",
    eyebrow: "Danh mục",
    title: "Chăm sóc da • Sức khoẻ • Spa at Home",
    subtitle: "Lọc nhanh theo loại da, vấn đề, giá và đánh giá.",
  },
  actions: {
    cartLabel: "Giỏ hàng",
    compareLabel: "So sánh",
  },
  badges: [
    { icon: "fa-solid fa-star", text: "Đánh giá thật" },
    { icon: "fa-solid fa-shield-halved", text: "Chính hãng" },
    { icon: "fa-solid fa-truck-fast", text: "Giao nhanh" },
  ],
  results: {
    label: "Hiển thị",
    unit: "sản phẩm",
  },
  emptyState: "Không có sản phẩm phù hợp bộ lọc.",
  pagination: {
    prev: "Trước",
    next: "Sau",
    pageLabel: "Trang",
  },
  footer: "© 2025 AYANAVITA • Prototype Category",
} as const;

function PaginationBar({ page, totalPages, onPrev, onNext, cmsData }: { page: number; totalPages: number; onPrev: () => void; onNext: () => void; cmsData: any }) {
  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <div className="mt-5 flex items-center justify-between">
      <button className={`btn ${prevDisabled ? "opacity-50" : ""}`} type="button" disabled={prevDisabled} onClick={onPrev}>
        {cmsData?.pagination?.prev}
      </button>
      <div className="chip">
        {cmsData?.pagination?.pageLabel} <span className="font-extrabold">{page}</span>/<span className="font-extrabold">{totalPages}</span>
      </div>
      <button className={`btn ${nextDisabled ? "opacity-50" : ""}`} type="button" disabled={nextDisabled} onClick={onNext}>
        {cmsData?.pagination?.next}
      </button>
    </div>
  );
}

function inRange(price: number, r: PriceRange) {
  if (r === "all") return true;
  if (r === "lt200") return price < 200_000;
  if (r === "200-400") return price >= 200_000 && price <= 400_000;
  if (r === "gt400") return price > 400_000;
  return true;
}

type ApiCatalogProduct = {
  id: string | number;
  sku: string;
  price: number;
  name: string;
  slug?: string ;
  shortDescription?: string | null;
  image?: string | null;
  category?: { id: string | number; slug?: string | null; name?: string | null } | null;
};

type ApiCategory = {
  id: string | number;
  code?: string;
  translations?: Array<{ languageCode?: string; name?: string | null }>;
};

function toPriceFilter(r: PriceRange): { minPrice?: number; maxPrice?: number } {
  if (r === "lt200") return { maxPrice: 200_000 };
  if (r === "200-400") return { minPrice: 200_000, maxPrice: 400_000 };
  if (r === "gt400") return { minPrice: 400_000 };
  return {};
}

function toApiSort(sort: SortKey): "newest" | "priceAsc" | "priceDesc" | "nameAsc" {
  if (sort === "new") return "newest";
  if (sort === "priceAsc") return "priceAsc";
  if (sort === "priceDesc") return "priceDesc";
  if (sort === "rating") return "nameAsc";
  return "newest";
}

function mapTypeFromCategoryName(raw: string): ProductType {
  const value = raw.toLowerCase();
  if (value.includes("serum")) return "serum";
  if (value.includes("cream") || value.includes("kem")) return "cream";
  if (value.includes("mask") || value.includes("mặt nạ")) return "mask";
  return "cleanser";
}

export default function ProductsPage() {
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
    return localStorage.getItem("preferred-language") || "vi";
  });

  const [compareToast, setCompareToast] = useState<{ open: boolean; message: string }>({ open: false, message: "" });

  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => {
      setCurrentLanguage(event.detail.language);
    };

    window.addEventListener("languageChange", handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener("languageChange", handleLanguageChange as EventListener);
    };
  }, []);

  const [productData, setProductData] = useState<any>(null);
  const [categoryOptions, setCategoryOptions] = useState<Array<[ProductType, string]>>([]);
  const [typeToCategoryIds, setTypeToCategoryIds] = useState<Record<string, number[]>>({});

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await http.get(`/public/pages/product?lang=${currentLanguage}`);
        if (!cancelled) setProductData(res.data);
      } catch (err) {
        console.error("GET /public/pages/product failed:", err);
        if (!cancelled) setProductData(null);
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
        const res = await http.get("/catalog/categories");
        const rows = Array.isArray(res.data) ? (res.data as ApiCategory[]) : [];
        if (cancelled) return;

        const grouped: Record<string, number[]> = {};
        const options: Array<[ProductType, string]> = [];

        rows.forEach((item) => {
          const translated = item.translations?.find((t) => t.languageCode === currentLanguage)?.name;
          const fallback = item.translations?.[0]?.name || item.code || `Category ${item.id}`;
          const label = translated || fallback;
          const mappedType = mapTypeFromCategoryName(String(item.code || label));
          const id = Number(item.id);

          if (!grouped[mappedType]) {
            grouped[mappedType] = [];
            options.push([mappedType, String(label)]);
          }
          if (Number.isFinite(id)) grouped[mappedType].push(id);
        });

        setCategoryOptions(options);
        setTypeToCategoryIds(grouped);
      } catch (error) {
        console.error("GET /catalog/categories failed:", error);
        if (!cancelled) {
          setCategoryOptions([]);
          setTypeToCategoryIds({});
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentLanguage]);

  const cmsData = useMemo(() => {
    return productData?.sections?.[2]?.data || defaultCmsData;
  }, [productData]);

  const [q, setQ] = useState("");
  const [types, setTypes] = useState<ProductType[]>([]);
  const [concern, setConcern] = useState<"all" | SkinConcern>("all");
  const [priceRange, setPriceRange] = useState<PriceRange>("all");
  const [sort, setSort] = useState<SortKey>("best");

  const [page, setPage] = useState(1);
  const pageSize = 6;

  const [apiItems, setApiItems] = useState<ApiCatalogProduct[]>([]);
  const [apiTotal, setApiTotal] = useState<number>(0);
  const [apiTotalPages, setApiTotalPages] = useState<number>(1);

  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      try {
        const priceFilter = toPriceFilter(priceRange);
        const categoryIdList = Array.from(new Set(types.flatMap((t) => typeToCategoryIds[t] || [])));
        const params: any = {
          lang: currentLanguage,
          page,
          pageSize,
          search: q || undefined,
          sort: toApiSort(sort),
          ...priceFilter,
          categoryIds: categoryIdList.length ? categoryIdList.join(",") : undefined,
        };

        const res = await http.get("/public/catalog/products", { params });
        if (cancelled) return;
        setApiItems(Array.isArray(res.data?.items) ? res.data.items : []);
        setApiTotal(Number(res.data?.total ?? 0));
        setApiTotalPages(Number(res.data?.totalPages ?? 1));
      } catch (error) {
        console.error("GET /public/catalog/products failed:", error);
        if (cancelled) {
          return;
        }
        const qq = q.trim().toLowerCase();
        let fallback = CATEGORY_PRODUCTS.filter((p) => {
          const okQ = !qq || p.name.toLowerCase().includes(qq) || p.id.toLowerCase().includes(qq);
          const okT = !types.length || types.includes(p.type);
          const okC = concern === "all" ? true : (p.concerns || []).includes(concern);
          const okP = inRange(p.price, priceRange);
          return okQ && okT && okC && okP;
        });

        if (sort === "best") fallback = fallback.slice().sort((a, b) => b.sold - a.sold);
        if (sort === "new") fallback = fallback.slice().sort((a, b) => (b.updated > a.updated ? 1 : -1));
        if (sort === "priceAsc") fallback = fallback.slice().sort((a, b) => a.price - b.price);
        if (sort === "priceDesc") fallback = fallback.slice().sort((a, b) => b.price - a.price);
        if (sort === "rating") fallback = fallback.slice().sort((a, b) => b.rating - a.rating);

        const start = (page - 1) * pageSize;
        const pageRows = fallback.slice(start, start + pageSize).map((p) => ({
          id: p.id,
          sku: p.sku,
          price: p.price,
          name: p.name,
          image: p.img,
          category: null,
        }));
        setApiItems(pageRows);
        setApiTotal(fallback.length);
        setApiTotalPages(Math.max(1, Math.ceil(fallback.length / pageSize)));
      }
    };

    fetchProducts();
    return () => {
      cancelled = true;
    };
  }, [currentLanguage, q, types, concern, priceRange, sort, page, typeToCategoryIds]);

  const list = useMemo(() => {
    return apiItems.map((item, idx) => ({
      sku: item.sku as any,
      id: String(item.id ?? item.sku),
      slug: item.slug,
      name: item.name,
      type: ((types[0] ?? "cleanser") as ProductType),
      concerns: concern === "all" ? [] : [concern],
      price: Number(item.price ?? 0),
      rating: 5,
      sold: 0,
      updated: new Date().toISOString().slice(0, 10),
      img: item.image || CATEGORY_PRODUCTS[idx % CATEGORY_PRODUCTS.length]?.img || "",
    }));
  }, [apiItems, types, concern]);

  const totalPages = useMemo(() => Math.max(1, apiTotalPages), [apiTotalPages]);
  const safePage = Math.min(page, totalPages);

  const pageItems = useMemo(() => list, [list]);

  function toggleType(t: ProductType) {
    setPage(1);
    setTypes((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  }

  function resetFilters() {
    setQ("");
    setTypes([]);
    setConcern("all");
    setPriceRange("all");
    setSort("best");
    setPage(1);
  }

  function handleCompareProduct(productId: string) {
    addCompareProductId(productId);
    setCompareToast({ open: true, message: "Đã thêm sản phẩm vào trang so sánh." });
    window.setTimeout(() => {
      setCompareToast({ open: false, message: "" });
    }, 3200);
  }

  return (
    <div className="text-slate-900">
      <main className="px-4 pb-10">
        <div className="max-w-6xl mx-auto card overflow-hidden">
          <div className="relative">
            <img className="h-44 w-full object-cover" alt={cmsData?.banner?.imageAlt} src={cmsData?.banner?.imageSrc} />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/55 to-indigo-700/20" />
            <div className="absolute inset-0 p-6 flex flex-col justify-end">
              <div className="text-xs font-extrabold text-white/80">{cmsData?.banner?.eyebrow}</div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white">{cmsData?.banner?.title}</h1>
              <div className="mt-1 text-sm text-white/80">{cmsData?.banner?.subtitle}</div>
            </div>
          </div>

          <div className="p-6 grid gap-4 lg:grid-cols-4">
            <aside className="lg:col-span-1">
              <ProductFilters
                cmsData={productData?.sections?.[0]?.data}
                q={q}
                onQ={(v) => {
                  setQ(v);
                  setPage(1);
                }}
                types={types}
                typeOptions={categoryOptions}
                onToggleType={toggleType}
                concern={concern}
                onConcern={(v) => {
                  setConcern(v);
                  setPage(1);
                }}
                priceRange={priceRange}
                onPriceRange={(v) => {
                  setPriceRange(v);
                  setPage(1);
                }}
                sort={sort}
                onSort={(v) => {
                  setSort(v);
                  setPage(1);
                }}
                onReset={resetFilters}
              />

              <div className="mt-3 flex flex-col gap-2 flex-wrap">
                <Link className="btn flex-1" to="/cart">
                  <i className="fa-solid fa-cart-shopping mr-2" />
                  {cmsData?.actions?.cartLabel}
                </Link>
                <Link className="btn flex-1" to="/compare">
                  <i className="fa-solid fa-scale-balanced mr-2" />
                  {cmsData?.actions?.compareLabel}
                </Link>
              </div>
            </aside>

            <section className="lg:col-span-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  {(cmsData?.badges || []).map((b: any) => (
                    <span key={`${b.icon}-${b.text}`} className="chip">
                      <i className={b.icon} />
                      <span className="ml-2">{b.text}</span>
                    </span>
                  ))}
                </div>
                <div className="text-sm text-slate-600">
                  {cmsData?.results?.label}: <b>{apiTotal}</b> {cmsData?.results?.unit}
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {pageItems.length ? (
                  pageItems.map((p) => (
                    <ProductCard
                      cmsData={productData?.sections?.[1]?.data}
                      key={p.id}
                      p={p}
                      detailTo={`/products/${encodeURIComponent(p.slug)}`}
                      onCompare={handleCompareProduct}
                    />
                  ))
                ) : (
                  <div className="text-slate-600 p-6">{cmsData?.emptyState}</div>
                )}
              </div>

              <PaginationBar
                cmsData={cmsData}
                page={safePage}
                totalPages={totalPages}
                onPrev={() => setPage((p) => Math.max(1, p - 1))}
                onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
              />
            </section>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-4 text-center text-sm text-slate-500">{cmsData?.footer}</div>
      </main>

      {compareToast.open ? (
        <div className="fixed bottom-4 right-4 z-[90] w-[min(420px,calc(100vw-32px))] rounded-2xl border border-white/10 bg-slate-900 p-3 text-white shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-extrabold">Thành công</div>
              <div className="mt-1 text-sm text-white/80">{compareToast.message}</div>
              <Link className="mt-2 inline-block text-sm text-emerald-300 hover:text-emerald-200" to="/compare">
                Đi đến trang so sánh →
              </Link>
            </div>
            <button className="opacity-80 hover:opacity-100" onClick={() => setCompareToast({ open: false, message: "" })}>
              ✕
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
