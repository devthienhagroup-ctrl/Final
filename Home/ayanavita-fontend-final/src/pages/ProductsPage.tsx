// src/pages/ProductsPage.tsx
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { SiteHeader } from "../components/layout/SiteHeader";
import { Footer } from "../components/layout/Footer";

import { CATEGORY_PRODUCTS, type SkinConcern, type ProductType } from "../data/productCategory.data";
import { ProductFilters, type PriceRange, type SortKey } from "../components/products/ProductFilters";

import { PaginationBar } from "../components/products/PaginationBar";
import { ProductCard } from "../components/products/ProductCard";

function inRange(price: number, r: PriceRange) {
  if (r === "all") return true;
  if (r === "lt200") return price < 200_000;
  if (r === "200-400") return price >= 200_000 && price <= 400_000;
  if (r === "gt400") return price > 400_000;
  return true;
}

export default function ProductsPage() {
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
      <SiteHeader active="products" />

      <main className="px-4 pb-10">
        <div className="max-w-6xl mx-auto card overflow-hidden">
          {/* Banner */}
          <div className="relative">
            <img
              className="h-44 w-full object-cover"
              alt="banner"
              src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1400&q=70"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/55 to-indigo-700/20" />
            <div className="absolute inset-0 p-6 flex flex-col justify-end">
              <div className="text-xs font-extrabold text-white/80">Danh mục</div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                Chăm sóc da • Sức khoẻ • Spa at Home
              </h1>
              <div className="mt-1 text-sm text-white/80">
                Lọc nhanh theo loại da, vấn đề, giá và đánh giá.
              </div>
            </div>
          </div>

          <div className="p-6 grid gap-4 lg:grid-cols-4">
            {/* Filters */}
            <aside className="lg:col-span-1">
              <ProductFilters
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

              <div className="mt-3 flex gap-2 flex-wrap">
                <Link className="btn" to="/cart">
                  <i className="fa-solid fa-cart-shopping mr-2" />
                  Giỏ hàng
                </Link>
                <button className="btn" type="button" onClick={() => window.alert("So sánh (demo).")}>
                  <i className="fa-solid fa-scale-balanced mr-2" />
                  So sánh
                </button>
              </div>
            </aside>

            {/* Products */}
            <section className="lg:col-span-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="chip">
                    <i className="fa-solid fa-star star" />
                    Đánh giá thật
                  </span>
                  <span className="chip">
                    <i className="fa-solid fa-shield-halved text-emerald-600" />
                    Chính hãng
                  </span>
                  <span className="chip">
                    <i className="fa-solid fa-truck-fast text-indigo-600" />
                    Giao nhanh
                  </span>
                </div>
                <div className="text-sm text-slate-600">
                  Hiển thị: <b>{list.length}</b> sản phẩm
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {pageItems.length ? (
                  pageItems.map((p) => (
                    <ProductCard key={p.id} p={p} detailTo={`/products/${String(p.sku)}`} />
                  ))
                ) : (
                  <div className="text-slate-600 p-6">Không có sản phẩm phù hợp bộ lọc.</div>
                )}
              </div>

              <PaginationBar
                page={safePage}
                totalPages={totalPages}
                onPrev={() => setPage((p) => Math.max(1, p - 1))}
                onNext={() => setPage((p) => p + 1)}
              />
            </section>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-4 text-center text-sm text-slate-500">
          © 2025 AYANAVITA • Prototype Category
        </div>
      </main>

      <Footer />
    </div>
  );
}
