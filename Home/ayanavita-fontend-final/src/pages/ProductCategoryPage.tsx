import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { SiteHeader } from "../components/layout/SiteHeader";
import { Footer } from "../components/layout/Footer";

import { PRODUCTS, type ProductSku } from "../data/products.data";
import { money } from "../services/booking.utils";
import { addProductToCart } from "../services/productCart.utils";
import { buildCatalogMetas, type CatalogType, type SkinConcern } from "../data/shopCatalog.data";

function inRange(price: number, r: string) {
  if (r === "all") return true;
  if (r === "lt200") return price < 200_000;
  if (r === "200-400") return price >= 200_000 && price <= 400_000;
  if (r === "gt400") return price > 400_000;
  return true;
}

export default function ProductCategoryPage() {
  const metas = useMemo(() => buildCatalogMetas(), []);
  const [q, setQ] = useState("");
  const [types, setTypes] = useState<CatalogType[]>([]);
  const [concern, setConcern] = useState<SkinConcern | "all">("all");
  const [priceRange, setPriceRange] = useState("all");
  const [sort, setSort] = useState<"best" | "new" | "priceAsc" | "priceDesc" | "rating">("best");

  const [page, setPage] = useState(1);
  const pageSize = 6;

  const list = useMemo(() => {
    const qq = q.trim().toLowerCase();

    let arr = metas.filter((m) => {
      const p = PRODUCTS[m.sku];
      if (!p) return false;

      const okQ = !qq || p.name.toLowerCase().includes(qq) || String(p.id).toLowerCase().includes(qq);
      const okT = !types.length || types.includes(m.type);
      const okC = concern === "all" ? true : (m.concern || []).includes(concern);
      const okP = inRange(p.price, priceRange);
      return okQ && okT && okC && okP;
    });

    if (sort === "best") arr.sort((a, b) => b.sold - a.sold);
    if (sort === "new") arr.sort((a, b) => (b.updated > a.updated ? 1 : -1));
    if (sort === "priceAsc") arr.sort((a, b) => PRODUCTS[a.sku].price - PRODUCTS[b.sku].price);
    if (sort === "priceDesc") arr.sort((a, b) => PRODUCTS[b.sku].price - PRODUCTS[a.sku].price);
    if (sort === "rating") arr.sort((a, b) => b.rating - a.rating);

    return arr;
  }, [metas, q, types, concern, priceRange, sort]);

  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = list.slice((safePage - 1) * pageSize, safePage * pageSize);

  function toggleType(t: CatalogType) {
    setPage(1);
    setTypes((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  }

  function reset() {
    setQ("");
    setTypes([]);
    setConcern("all");
    setPriceRange("all");
    setSort("best");
    setPage(1);
  }

  function onAddCart(sku: ProductSku) {
    addProductToCart(sku, 1);
    window.alert("Đã thêm vào giỏ (demo).");
  }

  return (
    <div className="text-slate-900">
      <SiteHeader />

      <main className="px-4 pb-10">
        <div className="max-w-6xl mx-auto card overflow-hidden">
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
              <div className="mt-1 text-sm text-white/80">Lọc nhanh theo loại da, vấn đề, giá và đánh giá.</div>
            </div>
          </div>

          <div className="p-6 grid gap-4 lg:grid-cols-4">
            {/* Filters */}
            <aside className="lg:col-span-1">
              <div className="card p-5">
                <div className="flex items-center justify-between">
                  <div className="font-extrabold">Bộ lọc</div>
                  <button className="btn px-3 py-2" type="button" onClick={reset}>
                    <i className="fa-solid fa-rotate-left" />
                  </button>
                </div>

                <div className="mt-3">
                  <label className="text-sm font-extrabold text-slate-700">Tìm kiếm</label>
                  <input className="field mt-2" placeholder="Tên sản phẩm..." value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} />
                </div>

                <div className="mt-4 grid gap-3">
                  <div>
                    <div className="text-sm font-extrabold text-slate-700">Loại</div>
                    <div className="mt-2 grid gap-2 text-sm">
                      {(["cleanser","serum","cream","mask"] as CatalogType[]).map((t) => (
                        <label key={t} className="flex items-center gap-2">
                          <input type="checkbox" checked={types.includes(t)} onChange={() => toggleType(t)} />
                          {t === "cleanser" ? "Sữa rửa mặt" : t === "serum" ? "Serum" : t === "cream" ? "Kem dưỡng" : "Mặt nạ"}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-extrabold text-slate-700">Vấn đề da</div>
                    <select className="field mt-2" value={concern} onChange={(e) => { setPage(1); setConcern(e.target.value as any); }}>
                      <option value="all">Tất cả</option>
                      <option value="acne">Mụn</option>
                      <option value="aging">Lão hoá</option>
                      <option value="bright">Thâm sạm</option>
                      <option value="sensitive">Nhạy cảm</option>
                    </select>
                  </div>

                  <div>
                    <div className="text-sm font-extrabold text-slate-700">Khoảng giá</div>
                    <select className="field mt-2" value={priceRange} onChange={(e) => { setPage(1); setPriceRange(e.target.value); }}>
                      <option value="all">Tất cả</option>
                      <option value="lt200">Dưới 200k</option>
                      <option value="200-400">200k–400k</option>
                      <option value="gt400">Trên 400k</option>
                    </select>
                  </div>

                  <div>
                    <div className="text-sm font-extrabold text-slate-700">Sắp xếp</div>
                    <select className="field mt-2" value={sort} onChange={(e) => { setPage(1); setSort(e.target.value as any); }}>
                      <option value="best">Bán chạy</option>
                      <option value="new">Mới nhất</option>
                      <option value="priceAsc">Giá tăng</option>
                      <option value="priceDesc">Giá giảm</option>
                      <option value="rating">Đánh giá</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 text-sm text-slate-700">
                  Gợi ý: Chọn filter → danh sách cập nhật theo thời gian thực (demo).
                </div>
              </div>
            </aside>

            {/* Products */}
            <section className="lg:col-span-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="chip"><i className="fa-solid fa-star text-amber-500" />Đánh giá thật</span>
                  <span className="chip"><i className="fa-solid fa-shield-halved text-emerald-600" />Chính hãng</span>
                  <span className="chip"><i className="fa-solid fa-truck-fast text-indigo-600" />Giao nhanh</span>
                </div>
                <div className="text-sm text-slate-600">Hiển thị: <b>{list.length}</b> sản phẩm</div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {pageItems.length ? (
                  pageItems.map((m) => {
                    const p = PRODUCTS[m.sku];
                    return (
                      <article key={m.sku} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                        <img className="h-36 w-full rounded-2xl object-cover ring-1 ring-slate-200" src={p.img} alt={p.name} />
                        <div className="mt-3 flex items-start justify-between gap-2">
                          <div>
                            <div className="font-extrabold">{p.name}</div>
                            <div className="text-xs text-slate-500">{p.id} • Bán chạy: {new Intl.NumberFormat("vi-VN").format(m.sold)}</div>
                          </div>
                          <span className="chip"><i className="fa-solid fa-tag text-emerald-600" />{money(p.price)}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-sm text-slate-700">
                          <div className="flex items-center gap-2">
                            <i className="fa-solid fa-star text-amber-500" /> <b>{m.rating}</b>
                          </div>
                          <span className="text-slate-500">Cập nhật: {m.updated}</span>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <Link className="btn text-center" to={`/products/${m.sku}`}>
                            <i className="fa-solid fa-circle-info mr-2" />Chi tiết
                          </Link>
                          <button className="btn btn-primary" type="button" onClick={() => onAddCart(m.sku)}>
                            <i className="fa-solid fa-cart-plus mr-2" />Thêm
                          </button>
                        </div>

                        <Link className="mt-2 btn w-full text-center" to="/compare">
                          <i className="fa-solid fa-scale-balanced mr-2" />So sánh
                        </Link>
                      </article>
                    );
                  })
                ) : (
                  <div className="text-slate-600 p-6">Không có sản phẩm phù hợp bộ lọc.</div>
                )}
              </div>

              <div className="mt-5 flex items-center justify-between">
                <button className={`btn ${safePage <= 1 ? "opacity-50" : ""}`} disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  Trước
                </button>
                <div className="chip">Trang <span>{safePage}</span>/<span>{totalPages}</span></div>
                <button className={`btn ${safePage >= totalPages ? "opacity-50" : ""}`} disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  Sau
                </button>
              </div>
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
