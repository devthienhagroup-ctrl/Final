// src/pages/ProductsPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";


import {http} from "../api/http";

import { CATEGORY_PRODUCTS, type SkinConcern, type ProductType } from "../data/productCategory.data";
import { ProductFilters, type PriceRange, type SortKey } from "../components/products/ProductFilters";
import { ProductCard } from "../components/products/ProductCard";

// NOTE: Tách nội dung tĩnh ra cmsData để dùng như CMS động.
// cmsData chỉ chứa nội dung (text, link, src...), không chứa style (màu/kích thước/className...).
// Ưu tiên thuộc tính đơn & mảng; hạn chế object lồng sâu; không nhét DB hay logic data vào đây.
const defaultCmsData = {
    banner: {
        imageAlt: "banner",
        imageSrc:
            "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1400&q=70",
        eyebrow: "Danh mục",
        title: "Chăm sóc da • Sức khoẻ • Spa at Home",
        subtitle: "Lọc nhanh theo loại da, vấn đề, giá và đánh giá.",
    },
    actions: {
        cartLabel: "Giỏ hàng",
        compareLabel: "So sánh",
        compareAlert: "So sánh (demo).",
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

// --- PaginationBar được đưa trực tiếp vào file ---
function PaginationBar({
                           page,
                           totalPages,
                           onPrev,
                           onNext,
                           cmsData,
                       }: {
    page: number;
    totalPages: number;
    onPrev: () => void;
    onNext: () => void;
    cmsData: any;
}) {
    const prevDisabled = page <= 1;
    const nextDisabled = page >= totalPages;

    return (
        <div className="mt-5 flex items-center justify-between">
            <button
                className={`btn ${prevDisabled ? "opacity-50" : ""}`}
                type="button"
                disabled={prevDisabled}
                onClick={onPrev}
            >
                {cmsData?.pagination?.prev}
            </button>
            <div className="chip">
                {cmsData?.pagination?.pageLabel} <span className="font-extrabold">{page}</span>/
                <span className="font-extrabold">{totalPages}</span>
            </div>
            <button
                className={`btn ${nextDisabled ? "opacity-50" : ""}`}
                type="button"
                disabled={nextDisabled}
                onClick={onNext}
            >
                {cmsData?.pagination?.next}
            </button>
        </div>
    );
}
// --- Kết thúc PaginationBar ---

function inRange(price: number, r: PriceRange) {
    if (r === "all") return true;
    if (r === "lt200") return price < 200_000;
    if (r === "200-400") return price >= 200_000 && price <= 400_000;
    if (r === "gt400") return price > 400_000;
    return true;
}

export default function ProductsPage() {
    // ====== language ======
    const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
        return localStorage.getItem("preferred-language") || "vi";
    });

    // Lắng nghe sự kiện thay đổi ngôn ngữ
    useEffect(() => {
        const handleLanguageChange = (event: CustomEvent) => {
            setCurrentLanguage(event.detail.language);
        };

        window.addEventListener("languageChange", handleLanguageChange as EventListener);
        return () => {
            window.removeEventListener("languageChange", handleLanguageChange as EventListener);
        };
    }, []);

    // ====== fetch CMS product page ======
    const [productData, setProductData] = useState<any>(null);

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

    // ghi đè cmsData bằng productData?.sections[2]?.data
    const cmsData = useMemo(() => {
        return productData?.sections?.[2]?.data || defaultCmsData;
    }, [productData]);

    // filters
    const [q, setQ] = useState("");
    const [types, setTypes] = useState<ProductType[]>([]);
    const [concern, setConcern] = useState<"all" | SkinConcern>("all");
    const [priceRange, setPriceRange] = useState<PriceRange>("all");
    const [sort, setSort] = useState<SortKey>("best");

    // paging
    const [page, setPage] = useState(1);
    const pageSize = 6;

    const list = useMemo(() => {
        const qq = q.trim().toLowerCase();

        let out = CATEGORY_PRODUCTS.filter((p) => {
            const okQ = !qq || p.name.toLowerCase().includes(qq) || p.id.toLowerCase().includes(qq);
            const okT = !types.length || types.includes(p.type);
            const okC = concern === "all" ? true : (p.concerns || []).includes(concern);
            const okP = inRange(p.price, priceRange);
            return okQ && okT && okC && okP;
        });

        // sort
        if (sort === "best") out = out.slice().sort((a, b) => b.sold - a.sold);
        if (sort === "new") out = out.slice().sort((a, b) => (b.updated > a.updated ? 1 : -1));
        if (sort === "priceAsc") out = out.slice().sort((a, b) => a.price - b.price);
        if (sort === "priceDesc") out = out.slice().sort((a, b) => b.price - a.price);
        if (sort === "rating") out = out.slice().sort((a, b) => b.rating - a.rating);

        return out;
    }, [q, types, concern, priceRange, sort]);

    const totalPages = useMemo(() => Math.max(1, Math.ceil(list.length / pageSize)), [list.length]);
    const safePage = Math.min(page, totalPages);

    const pageItems = useMemo(() => {
        const start = (safePage - 1) * pageSize;
        return list.slice(start, start + pageSize);
    }, [list, safePage]);

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

    return (
        <div className="text-slate-900">
            {/*<SiteHeader active="products" />*/}

            <main className="px-4 pb-10">
                <div className="max-w-6xl mx-auto card overflow-hidden">
                    {/* Banner */}
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
                        {/* Filters */}
                        <aside className="lg:col-span-1">
                            <ProductFilters
                                cmsData={productData?.sections?.[0]?.data}
                                q={q}
                                onQ={(v) => {
                                    setQ(v);
                                    setPage(1);
                                }}
                                types={types}
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
                                <button className="btn flex-1" type="button" onClick={() => window.alert(cmsData?.actions?.compareAlert)}>
                                    <i className="fa-solid fa-scale-balanced mr-2" />
                                    {cmsData?.actions?.compareLabel}
                                </button>
                            </div>
                        </aside>

                        {/* Products */}
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
                                    {cmsData?.results?.label}: <b>{list.length}</b> {cmsData?.results?.unit}
                                </div>
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {pageItems.length ? (
                                    pageItems.map((p) => (
                                        <ProductCard
                                            cmsData={productData?.sections?.[1]?.data}
                                            key={p.id}
                                            p={p}
                                            detailTo={`/products/${String(p.sku)}`}
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
                                onNext={() => setPage((p) => p + 1)}
                            />
                        </section>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto mt-4 text-center text-sm text-slate-500">{cmsData?.footer}</div>
            </main>
        </div>
    );
}