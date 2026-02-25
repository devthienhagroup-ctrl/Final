import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";



import { PRODUCTS, type ProductSku } from "../data/products.data";
import { money } from "../services/booking.utils";
import { addProductToCart, readProductCart } from "../services/productCart.utils";

import { MiniCartModal } from "../components/shop/MiniCartModal";
import { ReviewModal } from "../components/shop/ReviewModal";
import { Stars } from "../components/shop/Stars";

import { buildCatalogMetas } from "../data/shopCatalog.data";
import { PRODUCT_DETAIL_SEEDS, catLabel, goalLabel } from "../data/productDetail.data";
import { addReview, calcReviewStats, listReviewsBySku } from "../services/productReviews.utils";

function copyToClipboard(text: string) {
  if (!text) return;
  const nav: any = navigator;
  if (nav.clipboard?.writeText) return nav.clipboard.writeText(text);
  // fallback
  const ta = document.createElement("textarea");
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}

export default function ProductDetailPage() {
  const { sku: skuParam } = useParams<{ sku: string }>();
  const navigate = useNavigate();

  const skus = useMemo(() => Object.keys(PRODUCTS) as ProductSku[], []);
  const sku = useMemo(() => {
    const s = (skuParam || "") as ProductSku;
    return (s && PRODUCTS[s]) ? s : skus[0];
  }, [skuParam, skus]);

  const base = sku ? PRODUCTS[sku] : null;

  const metas = useMemo(() => buildCatalogMetas(), []);
  const meta = useMemo(() => metas.find((m) => m.sku === sku) || null, [metas, sku]);

  // seed detail (optional) + fallback demo
  const seed = useMemo(() => PRODUCT_DETAIL_SEEDS[sku], [sku]);
  const images = useMemo(() => {
    const s = seed?.images?.length ? seed.images : (base?.img ? [base.img] : []);
    return s.length ? s : [
      "https://images.unsplash.com/photo-1612810436541-336d31f6e5f4?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1587019158091-1a103c5dd4d2?auto=format&fit=crop&w=1200&q=80",
    ];
  }, [seed, base]);

  const [mainImg, setMainImg] = useState(images[0]);
  useEffect(() => {
    setMainImg(images[0]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [sku, images]);

  const [qty, setQty] = useState(1);
  useEffect(() => setQty(1), [sku]);

  const [cartOpen, setCartOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  const [cartCount, setCartCount] = useState(0);
  useEffect(() => {
    const calc = () => setCartCount(readProductCart().reduce((s, i) => s + Number(i.qty || 0), 0));
    calc();
    const onChanged = () => calc();
    window.addEventListener("aya_product_cart_changed", onChanged as any);
    return () => window.removeEventListener("aya_product_cart_changed", onChanged as any);
  }, []);

  // reviews
  const [rvSort, setRvSort] = useState<"new" | "high" | "low">("new");
  const [rvFilterStar, setRvFilterStar] = useState<"all" | "1" | "2" | "3" | "4" | "5">("all");
  const [rvSearch, setRvSearch] = useState("");

  const allReviews = useMemo(() => (sku ? listReviewsBySku(sku) : []), [sku, reviewOpen, rvSort, rvFilterStar, rvSearch]);
  const stats = useMemo(() => calcReviewStats(listReviewsBySku(sku)), [sku, reviewOpen]);

  const seedRating = seed?.seedMeta?.rating ?? meta?.rating ?? 4.8;
  const seedReviewsCount = seed?.seedMeta?.reviews ?? 312;
  const seedSold = seed?.seedMeta?.sold ?? meta?.sold ?? 1240;

  const effectiveAvg = stats.count ? stats.avg : seedRating;
  const effectiveCount = stats.count ? stats.count : seedReviewsCount;

  const filteredReviews = useMemo(() => {
    let rs = listReviewsBySku(sku).slice();

    if (rvFilterStar !== "all") rs = rs.filter((r) => String(r.stars) === rvFilterStar);

    const q = rvSearch.trim().toLowerCase();
    if (q) rs = rs.filter((r) => (r.name + " " + r.text).toLowerCase().includes(q));

    if (rvSort === "new") rs.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    if (rvSort === "high") rs.sort((a, b) => b.stars - a.stars);
    if (rvSort === "low") rs.sort((a, b) => a.stars - b.stars);

    return rs;
  }, [sku, rvFilterStar, rvSearch, rvSort, reviewOpen]);

  if (!base) {
    return (
      <div className="text-slate-900">
        <main className="px-4 pb-10">
          <div className="max-w-4xl mx-auto card p-6">
            <div className="text-2xl font-extrabold">Không tìm thấy sản phẩm</div>
            <div className="mt-2 text-slate-600">SKU không hợp lệ hoặc PRODUCTS đang rỗng.</div>
            <Link className="mt-4 btn btn-primary inline-block" to="/products">Về danh mục</Link>
          </div>
        </main>
      </div>
    );
  }

  const detail = {
    cat: seed?.cat ?? "serum",
    target: seed?.target ?? "repair",
    skuText: seed?.skuText ?? String(base.id),
    size: seed?.size ?? (meta ? `${meta.ml}ml (demo)` : "30ml (demo)"),
    skinType: seed?.skinType ?? "Mọi loại da (demo)",
    shortDesc:
      seed?.shortDesc ??
      "Sản phẩm mẫu cho trang chi tiết: tập trung ảnh, giá, CTA rõ ràng, review & gợi ý combo.",
    longDesc:
      seed?.longDesc ??
      "Prototype trang chi tiết: khi làm thật, lấy mô tả dài/thành phần/hướng dẫn dùng từ DB. Nội dung hiện là mô phỏng để bạn ráp UI/UX.",
    highlights: seed?.highlights ?? [
      "Hỗ trợ routine Spa tại nhà (demo)",
      "Kết cấu thấm nhanh (demo)",
      "CTA rõ ràng: thêm giỏ / mua ngay",
      "Có review filter + search (localStorage)",
    ],
    ingredients: seed?.ingredients ?? [
      { name: "Ceramide Complex", desc: "Hỗ trợ hàng rào bảo vệ (demo)." },
      { name: "Panthenol (B5)", desc: "Làm dịu và tăng cảm giác dễ chịu (demo)." },
      { name: "Hyaluronic Acid", desc: "Cấp ẩm, giúp da căng mượt hơn (demo)." },
    ],
    usage: seed?.usage ?? {
      am: ["Rửa mặt dịu nhẹ", "Toner (tuỳ chọn)", "Serum 2–3 giọt", "Kem dưỡng", "Chống nắng"],
      pm: ["Tẩy trang (nếu có)", "Rửa mặt", "Toner (tuỳ chọn)", "Serum 2–3 giọt", "Kem dưỡng"],
    },
    checklist: seed?.checklist ?? ["Patch test 24h", "Duy trì chống nắng", "Dùng đều 14 ngày"],
    relatedSkus: seed?.relatedSkus ?? skus.filter((x) => x !== sku).slice(0, 3),
    comboHint: seed?.comboHint ?? "Serum + Kem dưỡng + Chống nắng để duy trì hiệu quả.",
  };

  function addToCart(q: number) {
    addProductToCart(sku, q);
    setCartCount(readProductCart().reduce((s, i) => s + Number(i.qty || 0), 0));
    window.alert("Đã thêm vào giỏ (demo).");
  }

  function buyNow() {
    addToCart(qty);
    setCartOpen(true);
  }

  function submitReview(x: { name: string; stars: number; text: string }) {
    addReview(sku, x);
    // refresh views
    setReviewOpen(false);
  }

  return (
    <div className="text-slate-900">

      {/* Top bar chips */}
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="chip"><i className="fa-solid fa-tags text-amber-600" />Giá niêm yết</span>
            <span className="chip"><i className="fa-solid fa-star text-amber-500" />Đánh giá minh bạch (demo)</span>
            <span className="chip"><i className="fa-solid fa-shield-halved text-indigo-600" />Chuẩn Spa AYANAVITA</span>
          </div>
          <div className="text-sm font-extrabold text-slate-700">
            Hotline: <a className="underline" href="tel:0900000000">0900 000 000</a>
            <span className="mx-1">•</span>
            Zalo: <a className="underline" href="#">AYANAVITA Official</a>
          </div>
        </div>
      </div>

      {/* Sticky header with anchors */}
      <header className="sticky top-[65px] z-50 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-3">

          <div className="hidden lg:flex items-center gap-2">
            <a className="btn !p-2 !text-sm" href="#overview">Tổng quan</a>
            <a className="btn !p-2 !text-sm" href="#ingredients">Thành phần</a>
            <a className="btn !p-2 !text-sm" href="#usage">Cách dùng</a>
            <a className="btn !p-2 !text-sm" href="#reviews">Đánh giá</a>
            <a className="btn !p-2 !text-sm" href="#faq">FAQ</a>
          </div>

          <div className="flex items-center gap-2">
            <button className="btn !p-2 !text-sm" type="button" onClick={() => setCartOpen(true)}>
              <i className="fa-solid fa-cart-shopping mr-2" />
              Giỏ hàng
              <span className="ml-2 chip" style={{ padding: "5px 10px" }}>{cartCount}</span>
            </button>
            <Link className="btn lg:hidden w-10 h-10 text-sm p-0 flex items-center justify-center" to="/products" aria-label="Back">
              <i className="fa-solid fa-arrow-left" />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO / breadcrumb + gallery + purchase */}
      <section
        className="px-4 py-6"
        style={{
          background:
            "radial-gradient(900px 420px at 10% 20%, rgba(245,158,11,0.22), transparent 60%)," +
            "radial-gradient(900px 420px at 90% 10%, rgba(124,58,237,0.22), transparent 60%)," +
            "linear-gradient(135deg, rgba(79,70,229,0.10), rgba(255,255,255,0) 55%)",
        }}
      >
        <div className="mx-auto max-w-7xl">
          <div className="text-sm font-extrabold text-slate-700">
            <Link className="underline" to="/">Trang chủ</Link>
            <span className="mx-2 text-slate-400">/</span>
            <Link className="underline" to="/products">Shop</Link>
            <span className="mx-2 text-slate-400">/</span>
            <span>{base.name}</span>
          </div>

          <div className="mt-5 grid gap-6 lg:grid-cols-2 items-start">
            {/* Gallery */}
            <div className="card p-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex gap-2 flex-wrap">
                  <span className="chip"><i className="fa-solid fa-layer-group text-indigo-600" />{catLabel(detail.cat as any)}</span>
                  <span className="chip"><i className="fa-solid fa-bullseye text-emerald-600" />{goalLabel(detail.target as any)}</span>
                  <span className="chip bg-slate-900 text-white border-slate-900"><i className="fa-solid fa-tags" /> Niêm yết</span>
                </div>
                <div className="text-sm font-extrabold text-slate-600">SKU: <span>{detail.skuText}</span></div>
              </div>

              <div className="mt-4 rounded-2xl overflow-hidden border border-slate-200 bg-white">
                <img className="w-full h-[420px] object-cover" src={mainImg} alt={base.name} />
              </div>

              <div className="mt-3 grid grid-cols-4 gap-3">
                {images.slice(0, 4).map((src) => {
                  const active = src === mainImg;
                  return (
                    <button
                      key={src}
                      className={`rounded-2xl overflow-hidden border border-slate-200 bg-white ${active ? "ring-4 ring-indigo-200" : ""}`}
                      type="button"
                      onClick={() => setMainImg(src)}
                    >
                      <img className="h-20 w-full object-cover" src={src} alt="thumb" />
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="font-extrabold">Điểm nổi bật</div>
                <ul className="mt-2 grid gap-2 text-sm text-slate-700">
                  {detail.highlights.map((x, i) => (
                    <li key={i} className="flex gap-2"><span className="text-amber-600 font-extrabold">•</span>{x}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Purchase box */}
            <div className="sticky top-[88px]">
              <div className="card p-5">
                <div className="text-xs font-extrabold text-slate-500">Chi tiết sản phẩm</div>
                <h1 className="mt-1 text-3xl font-extrabold leading-tight">{base.name}</h1>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-extrabold text-slate-500">Giá niêm yết</div>
                    <div className="mt-1 text-4xl font-extrabold text-amber-600">{money(base.price)}</div>
                    <div className="mt-1 text-sm text-slate-500">Đã bao gồm VAT (demo)</div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-extrabold text-slate-500">Đánh giá</div>
                    <div className="mt-1"><Stars value={effectiveAvg} sizeClass="text-xl" /></div>
                    <div className="text-sm text-slate-500">
                      {effectiveAvg.toFixed(1)} • {effectiveCount} đánh giá • {seedSold} đã bán
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 my-4" />

                <p className="text-sm text-slate-700 leading-relaxed">{detail.shortDesc}</p>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <div className="font-extrabold text-sm"><i className="fa-solid fa-truck-fast mr-2 text-indigo-600" />Giao nhanh</div>
                    <div className="mt-1 text-sm text-slate-500">Nội thành 2–4h (demo)</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <div className="font-extrabold text-sm"><i className="fa-solid fa-rotate-left mr-2 text-indigo-600" />Đổi trả</div>
                    <div className="mt-1 text-sm text-slate-500">Trong 7 ngày (demo)</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 flex-wrap">
                  <span className="chip"><i className="fa-solid fa-circle-check text-emerald-600" />Hàng chính hãng</span>
                  <span className="chip"><i className="fa-solid fa-shield text-indigo-600" />Chuẩn Spa</span>
                  <span className="chip"><i className="fa-solid fa-lock text-slate-700" />Bảo mật</span>
                </div>

                <div className="mt-5 flex items-center gap-2">
                  <button className="btn w-11 h-11 p-0" type="button" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                    <i className="fa-solid fa-minus" />
                  </button>
                  <div className="chip">Số lượng: <b className="ml-1">{qty}</b></div>
                  <button className="btn w-11 h-11 p-0" type="button" onClick={() => setQty((q) => q + 1)}>
                    <i className="fa-solid fa-plus" />
                  </button>

                  <button className="btn btn-primary hover:text-purple-800 flex-1" type="button" onClick={() => addToCart(qty)}>
                    <i className="fa-solid fa-cart-plus mr-2" />Thêm vào giỏ
                  </button>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <button className="btn btn-accent" type="button" onClick={buyNow}>
                    <i className="fa-solid fa-bolt mr-2" />Mua ngay
                  </button>
                  <button className="btn" type="button" onClick={() => window.alert("Mô phỏng mở chat/Zalo tư vấn (demo).")}>
                    <i className="fa-solid fa-message mr-2" />Tư vấn 1:1
                  </button>
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="font-extrabold text-sm">Gợi ý combo</div>
                  <div className="mt-2 text-sm text-slate-700">{detail.comboHint}</div>
                </div>
              </div>

              <div className="mt-4 card p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-extrabold">Ưu đãi (demo)</div>
                  <span className="chip"><i className="fa-solid fa-ticket text-amber-600" />Voucher</span>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-slate-700">
                  {["AYA10", "FREESHIP"].map((code) => (
                    <div key={code} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 flex items-center justify-between">
                      <span><b>{code}</b> – {code === "AYA10" ? "Giảm 10% (mô phỏng)" : "Free ship (mô phỏng)"}</span>
                      <button className="btn" type="button" onClick={() => { copyToClipboard(code); window.alert("Đã copy voucher: " + code); }}>
                        Copy
                      </button>
                    </div>
                  ))}
                  <div className="text-xs text-slate-500">Khi làm thật: validate voucher qua API.</div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button className="btn" type="button" onClick={() => setCartOpen(true)}>
                  <i className="fa-solid fa-cart-shopping mr-2" />Xem giỏ
                </button>
                <button className="btn" type="button" onClick={() => navigate("/products")}>
                  <i className="fa-solid fa-store mr-2" />Danh mục
                </button>
              </div>
            </div>
          </div>

          {/* quick anchors */}
          <div className="mt-7 flex flex-wrap gap-2">
            <a className="btn" href="#overview"><i className="fa-solid fa-circle-info mr-2" />Tổng quan</a>
            <a className="btn" href="#ingredients"><i className="fa-solid fa-flask mr-2" />Thành phần</a>
            <a className="btn" href="#usage"><i className="fa-solid fa-hand-holding-droplet mr-2" />Cách dùng</a>
            <a className="btn" href="#reviews"><i className="fa-solid fa-star mr-2" />Đánh giá</a>
          </div>
        </div>
      </section>

      {/* OVERVIEW */}
      <section id="overview" className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="card p-6 lg:col-span-2">
            <div className="text-xs font-extrabold text-slate-500">Tổng quan</div>
            <div className="text-2xl font-extrabold">Sản phẩm này phù hợp với ai?</div>
            <p className="mt-4 text-slate-700 leading-relaxed">{detail.longDesc}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="font-extrabold"><i className="fa-solid fa-bullseye mr-2 text-indigo-600" />Mục tiêu</div>
                <div className="mt-1 text-sm text-slate-700">{goalLabel(detail.target as any)}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="font-extrabold"><i className="fa-solid fa-clock mr-2 text-indigo-600" />Thời gian</div>
                <div className="mt-1 text-sm text-slate-700">7–14 ngày thấy thay đổi (demo)</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="font-extrabold"><i className="fa-solid fa-face-smile mr-2 text-indigo-600" />Kết cấu</div>
                <div className="mt-1 text-sm text-slate-700">Thấm nhanh • Không nặng mặt (demo)</div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="text-xs font-extrabold text-slate-500">Thông số</div>
            <div className="text-2xl font-extrabold">Thông tin niêm yết</div>

            <div className="mt-5 grid gap-3 text-sm">
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 flex items-center justify-between">
                <span className="text-slate-500 font-extrabold">Dung tích</span><b>{detail.size}</b>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 flex items-center justify-between">
                <span className="text-slate-500 font-extrabold">Loại da</span><b>{detail.skinType}</b>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 flex items-center justify-between">
                <span className="text-slate-500 font-extrabold">Xuất xứ</span><b>Việt Nam (demo)</b>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 flex items-center justify-between">
                <span className="text-slate-500 font-extrabold">HSD</span><b>24 tháng</b>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 flex items-center justify-between">
                <span className="text-slate-500 font-extrabold">Bảo quản</span><b>Nơi khô ráo</b>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <div className="font-extrabold">Cam kết</div>
              <ul className="mt-2 grid gap-2 text-sm text-slate-700">
                <li className="flex gap-2"><span className="text-amber-600 font-extrabold">•</span>Giá niêm yết rõ ràng</li>
                <li className="flex gap-2"><span className="text-amber-600 font-extrabold">•</span>Hỗ trợ tư vấn routine</li>
                <li className="flex gap-2"><span className="text-amber-600 font-extrabold">•</span>Review minh bạch (demo)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* INGREDIENTS */}
      <section id="ingredients" className="mx-auto max-w-7xl px-4 pb-10">
        <div className="card p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs font-extrabold text-slate-500">Thành phần</div>
              <div className="text-2xl font-extrabold">Thành phần nổi bật (demo)</div>
              <div className="mt-1 text-sm text-slate-700">Bạn thay bằng thành phần thật theo sản phẩm trong DB.</div>
            </div>
            <span className="chip"><i className="fa-solid fa-flask text-indigo-600" />INCI (mô phỏng)</span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {detail.ingredients.map((i, idx) => (
              <div key={idx} className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
                <div className="font-extrabold">{i.name}</div>
                <div className="mt-2 text-sm text-slate-700">{i.desc}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
            <div className="font-extrabold">Lưu ý</div>
            <div className="mt-2 text-sm text-slate-700">
              Prototype: không đưa claim y khoa. Khi làm thật nên có cảnh báo dị ứng/patch test và hướng dẫn theo chuyên gia.
            </div>
          </div>
        </div>
      </section>

      {/* USAGE */}
      <section id="usage" className="mx-auto max-w-7xl px-4 pb-10">
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="card p-6 lg:col-span-2">
            <div className="text-xs font-extrabold text-slate-500">Cách dùng</div>
            <div className="text-2xl font-extrabold">Routine gợi ý</div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
                <div className="font-extrabold"><i className="fa-solid fa-sun mr-2 text-amber-600" />Buổi sáng</div>
                <ol className="mt-3 grid gap-2 text-sm text-slate-700">
                  {detail.usage.am.map((x, i) => (
                    <li key={i} className="flex gap-2"><span className="font-extrabold text-amber-600">{i + 1}.</span>{x}</li>
                  ))}
                </ol>
              </div>
              <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
                <div className="font-extrabold"><i className="fa-solid fa-moon mr-2 text-indigo-600" />Buổi tối</div>
                <ol className="mt-3 grid gap-2 text-sm text-slate-700">
                  {detail.usage.pm.map((x, i) => (
                    <li key={i} className="flex gap-2"><span className="font-extrabold text-indigo-600">{i + 1}.</span>{x}</li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
              <div className="font-extrabold">Checklist nhanh</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {detail.checklist.map((x, i) => (
                  <span key={i} className="chip"><i className="fa-solid fa-circle-check text-emerald-600" />{x}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="text-xs font-extrabold text-slate-500">Combo đề xuất</div>
            <div className="text-2xl font-extrabold">Mua cùng</div>

            <div className="mt-4 grid gap-3">
              {detail.relatedSkus.map((rs) => {
                const p = PRODUCTS[rs];
                return (
                  <div key={rs} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <div className="flex gap-3">
                      <img className="h-16 w-16 rounded-2xl object-cover border border-slate-200" src={p.img} alt={p.name} />
                      <div className="min-w-0">
                        <div className="font-extrabold truncate">{p.name}</div>
                        <div className="text-sm text-slate-500">{money(p.price)}</div>
                        <button className="btn mt-2 w-full" type="button" onClick={() => navigate(`/products/${rs}`)}>
                          <i className="fa-solid fa-arrow-right mr-2" />Xem
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 text-xs text-slate-500">Prototype: sản phẩm liên quan lấy từ dữ liệu demo.</div>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section id="reviews" className="mx-auto max-w-7xl px-4 pb-10">
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="card p-6">
            <div className="text-xs font-extrabold text-slate-500">Đánh giá</div>
            <div className="text-2xl font-extrabold">Tổng quan review</div>

            <div className="mt-4 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
              <div className="text-5xl font-extrabold">{effectiveAvg ? effectiveAvg.toFixed(1) : "—"}</div>
              <div className="mt-2 text-xl"><Stars value={effectiveAvg} /></div>
              <div className="mt-1 text-sm text-slate-500">{effectiveCount} đánh giá • (demo)</div>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
              <div className="font-extrabold">Bộ lọc</div>
              <div className="mt-3 grid gap-2">
                <select className="btn" value={rvSort} onChange={(e) => setRvSort(e.target.value as any)}>
                  <option value="new">Mới nhất</option>
                  <option value="high">Sao cao</option>
                  <option value="low">Sao thấp</option>
                </select>
                <select className="btn" value={rvFilterStar} onChange={(e) => setRvFilterStar(e.target.value as any)}>
                  <option value="all">Tất cả sao</option>
                  <option value="5">5 sao</option>
                  <option value="4">4 sao</option>
                  <option value="3">3 sao</option>
                  <option value="2">2 sao</option>
                  <option value="1">1 sao</option>
                </select>
                <button className="btn btn-primary" type="button" onClick={() => setReviewOpen(true)}>
                  <i className="fa-solid fa-pen-to-square mr-2" />Viết đánh giá
                </button>
              </div>
            </div>
          </div>

          <div className="card p-6 lg:col-span-2">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-xs font-extrabold text-slate-500">Review</div>
                <div className="text-2xl font-extrabold">Khách hàng nói gì?</div>
                <div className="mt-1 text-sm text-slate-700">Prototype: review lưu localStorage, bạn có thể nối backend.</div>
              </div>
              <div className="flex gap-2">
                <input className="field" placeholder="Tìm trong review..." value={rvSearch} onChange={(e) => setRvSearch(e.target.value)} />
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {filteredReviews.length ? (
                filteredReviews.map((r) => (
                  <div key={r.id} className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-extrabold">
                          {r.name} <span className="text-slate-500">• {r.createdAt}</span>
                        </div>
                        <div className="mt-1 text-sm text-slate-500">{base.name} • {detail.skuText}</div>
                      </div>
                      <div className="text-lg"><Stars value={r.stars} /></div>
                    </div>
                    <div className="mt-3 text-sm text-slate-700 leading-relaxed">{r.text}</div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200 text-sm text-slate-700">
                  Không có review phù hợp bộ lọc.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-7xl px-4 pb-12">
        <div className="card p-6">
          <div className="text-xs font-extrabold text-slate-500">FAQ</div>
          <div className="text-2xl font-extrabold">Câu hỏi thường gặp</div>

          <div className="mt-5 grid gap-3">
            <details className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <summary className="font-extrabold cursor-pointer">Sản phẩm có phù hợp da nhạy cảm không?</summary>
              <div className="mt-2 text-sm text-slate-700">Prototype: nên patch test và tham khảo tư vấn chuyên gia.</div>
            </details>

            <details className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <summary className="font-extrabold cursor-pointer">Bao lâu thấy hiệu quả?</summary>
              <div className="mt-2 text-sm text-slate-700">Thường 7–14 ngày (demo). Khi làm thật mô tả theo khuyến nghị thực tế.</div>
            </details>

            <details className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <summary className="font-extrabold cursor-pointer">Giá niêm yết có thay đổi không?</summary>
              <div className="mt-2 text-sm text-slate-700">Giá có thể cập nhật theo thời điểm. Khi làm thật, lưu lịch sử giá/khuyến mãi.</div>
            </details>
          </div>
        </div>
      </section>


      {/* Modals */}
      <MiniCartModal open={cartOpen} onClose={() => setCartOpen(false)} />
      <ReviewModal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        productName={base.name}
        onSubmit={submitReview}
      />
    </div>
  );
}
