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

import {http} from "../api/http";

// ==================== CMS DATA (MẶC ĐỊNH) ====================
// Tất cả nội dung giao diện tĩnh (có thể chỉnh sửa qua CMS) được đặt ở đây
const defaultCmsData = {
  topBar: {
    chips: [
      { text: "Giá niêm yết", icon: "fa-solid fa-tags", iconColor: "text-amber-600" },
      { text: "Đánh giá minh bạch (demo)", icon: "fa-solid fa-star", iconColor: "text-amber-500" },
      { text: "Chuẩn Spa AYANAVITA", icon: "fa-solid fa-shield-halved", iconColor: "text-indigo-600" }
    ],
    hotline: {
      label: "Hotline:",
      phone: "0900 000 000",
      zaloLabel: "Zalo:",
      zaloText: "AYANAVITA Official"
    }
  },
  header: {
    anchors: [
      { text: "Tổng quan", href: "#overview" },
      { text: "Thành phần", href: "#ingredients" },
      { text: "Cách dùng", href: "#usage" },
      { text: "Đánh giá", href: "#reviews" },
      { text: "FAQ", href: "#faq" }
    ],
    cartButton: { text: "Giỏ hàng", icon: "fa-solid fa-cart-shopping" },
    backButtonIcon: "fa-solid fa-arrow-left"
  },
  breadcrumb: {
    home: "Trang chủ",
    shop: "Shop"
  },
  gallery: {
    categoryChip: { icon: "fa-solid fa-layer-group", color: "text-indigo-600" },
    goalChip: { icon: "fa-solid fa-bullseye", color: "text-emerald-600" },
    listedChip: { text: "Niêm yết", icon: "fa-solid fa-tags", bgClass: "bg-slate-900 text-white border-slate-900" },
    skuLabel: "SKU:",
    highlightsTitle: "Điểm nổi bật",
    bulletIcon: "•"
  },
  purchaseBox: {
    title: "Chi tiết sản phẩm",
    priceLabel: "Giá niêm yết",
    vatNote: "Đã bao gồm VAT (demo)",
    ratingLabel: "Đánh giá",
    reviewText: "đánh giá",
    soldText: "đã bán",
    shippingBox: {
      title: "Giao nhanh",
      desc: "Nội thành 2–4h (demo)",
      icon: "fa-solid fa-truck-fast",
      iconColor: "text-indigo-600"
    },
    returnBox: {
      title: "Đổi trả",
      desc: "Trong 7 ngày (demo)",
      icon: "fa-solid fa-rotate-left",
      iconColor: "text-indigo-600"
    },
    chips: [
      { text: "Hàng chính hãng", icon: "fa-solid fa-circle-check", iconColor: "text-emerald-600" },
      { text: "Chuẩn Spa", icon: "fa-solid fa-shield", iconColor: "text-indigo-600" },
      { text: "Bảo mật", icon: "fa-solid fa-lock", iconColor: "text-slate-700" }
    ],
    quantity: {
      minusIcon: "fa-solid fa-minus",
      plusIcon: "fa-solid fa-plus",
      label: "Số lượng:"
    },
    addToCartButton: { text: "Thêm vào giỏ", icon: "fa-solid fa-cart-plus" },
    buyNowButton: { text: "Mua ngay", icon: "fa-solid fa-bolt" },
    consultButton: { text: "Tư vấn 1:1", icon: "fa-solid fa-message" },
    comboHintTitle: "Gợi ý combo"
  },
  voucherSection: {
    title: "Ưu đãi (demo)",
    chip: { text: "Voucher", icon: "fa-solid fa-ticket", iconColor: "text-amber-600" },
    vouchers: [
      { code: "AYA10", description: "Giảm 10% (mô phỏng)" },
      { code: "FREESHIP", description: "Free ship (mô phỏng)" }
    ],
    copyButtonText: "Copy",
    disclaimer: "Khi làm thật: validate voucher qua API."
  },
  bottomButtons: {
    viewCart: { text: "Xem giỏ", icon: "fa-solid fa-cart-shopping" },
    category: { text: "Danh mục", icon: "fa-solid fa-store" }
  },
  quickAnchors: [
    { text: "Tổng quan", href: "#overview", icon: "fa-solid fa-circle-info" },
    { text: "Thành phần", href: "#ingredients", icon: "fa-solid fa-flask" },
    { text: "Cách dùng", href: "#usage", icon: "fa-solid fa-hand-holding-droplet" },
    { text: "Đánh giá", href: "#reviews", icon: "fa-solid fa-star" }
  ],
  overview: {
    sectionTitle: "Tổng quan",
    title: "Sản phẩm này phù hợp với ai?",
    boxes: [
      { title: "Mục tiêu", icon: "fa-solid fa-bullseye", iconColor: "text-indigo-600" },
      { title: "Thời gian", icon: "fa-solid fa-clock", iconColor: "text-indigo-600" },
      { title: "Kết cấu", icon: "fa-solid fa-face-smile", iconColor: "text-indigo-600" }
    ]
  },
  specs: {
    sectionTitle: "Thông số",
    title: "Thông tin niêm yết",
    items: [
      { label: "Dung tích" },
      { label: "Loại da" },
      { label: "Xuất xứ" },
      { label: "HSD" },
      { label: "Bảo quản" }
    ],
    commitment: {
      title: "Cam kết",
      items: [
        "Giá niêm yết rõ ràng",
        "Hỗ trợ tư vấn routine",
        "Review minh bạch (demo)"
      ],
      bulletIcon: "•"
    }
  },
  ingredients: {
    sectionTitle: "Thành phần",
    title: "Thành phần nổi bật (demo)",
    description: "Bạn thay bằng thành phần thật theo sản phẩm trong DB.",
    chip: { text: "INCI (mô phỏng)", icon: "fa-solid fa-flask", iconColor: "text-indigo-600" },
    noteTitle: "Lưu ý",
    noteText: "Prototype: không đưa claim y khoa. Khi làm thật nên có cảnh báo dị ứng/patch test và hướng dẫn theo chuyên gia."
  },
  usage: {
    sectionTitle: "Cách dùng",
    title: "Routine gợi ý",
    morning: { title: "Buổi sáng", icon: "fa-solid fa-sun", iconColor: "text-amber-600" },
    evening: { title: "Buổi tối", icon: "fa-solid fa-moon", iconColor: "text-indigo-600" },
    checklistTitle: "Checklist nhanh"
  },
  combo: {
    sectionTitle: "Combo đề xuất",
    title: "Mua cùng",
    disclaimer: "Prototype: sản phẩm liên quan lấy từ dữ liệu demo."
  },
  reviews: {
    sectionTitle: "Đánh giá",
    summaryTitle: "Tổng quan review",
    filterTitle: "Bộ lọc",
    sortOptions: [
      { value: "new", text: "Mới nhất" },
      { value: "high", text: "Sao cao" },
      { value: "low", text: "Sao thấp" }
    ],
    starFilterOptions: [
      { value: "all", text: "Tất cả sao" },
      { value: "5", text: "5 sao" },
      { value: "4", text: "4 sao" },
      { value: "3", text: "3 sao" },
      { value: "2", text: "2 sao" },
      { value: "1", text: "1 sao" }
    ],
    writeReviewButton: { text: "Viết đánh giá", icon: "fa-solid fa-pen-to-square" },
    listTitle: "Review",
    listSubtitle: "Khách hàng nói gì?",
    disclaimer: "Prototype: review lưu localStorage, bạn có thể nối backend.",
    searchPlaceholder: "Tìm trong review...",
    noReviewsText: "Không có review phù hợp bộ lọc."
  },
  faq: {
    sectionTitle: "FAQ",
    title: "Câu hỏi thường gặp",
    items: [
      {
        question: "Sản phẩm có phù hợp da nhạy cảm không?",
        answer: "Prototype: nên patch test và tham khảo tư vấn chuyên gia."
      },
      {
        question: "Bao lâu thấy hiệu quả?",
        answer: "Thường 7–14 ngày (demo). Khi làm thật mô tả theo khuyến nghị thực tế."
      },
      {
        question: "Giá niêm yết có thay đổi không?",
        answer: "Giá có thể cập nhật theo thời điểm. Khi làm thật, lưu lịch sử giá/khuyến mãi."
      }
    ]
  }
};

// ==================== UTILS ====================
function copyToClipboard(text: string) {
  if (!text) return;
  const nav: any = navigator;
  if (nav.clipboard?.writeText) return nav.clipboard.writeText(text);
  const ta = document.createElement("textarea");
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}

// ==================== COMPONENT ====================
export default function ProductDetailPage() {
  const { sku: skuParam } = useParams<{ sku: string }>();
  const navigate = useNavigate();

  // ===== NGÔN NGỮ & CMS DYNAMIC =====
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
    return localStorage.getItem("preferred-language") || "vi";
  });

  const [detailData, setDetailData] = useState<any>(null);
  const [cmsData, setCmsData] = useState(defaultCmsData);

  // Lắng nghe sự kiện thay đổi ngôn ngữ
  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => {
      setCurrentLanguage(event.detail.language);
    };

    window.addEventListener('languageChange', handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener('languageChange', handleLanguageChange as EventListener);
    };
  }, []);

  // Gọi API khi ngôn ngữ thay đổi
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await http.get(`/public/pages/productDetail?lang=${currentLanguage}`);
        setDetailData(res.data);
        console.log("Product Detail CMS data:", res.data);
        // Ghi đè cmsData bằng dữ liệu từ sections[2] nếu có
        if (res.data?.sections?.[2]?.data) {
          console.log("Overriding CMS data with API data from sections[2].data", res.data.sections[2].data);
          setCmsData(res.data.sections[2].data);
          setTimeout(() => {console.log("Sau khi đợi 2s",cmsData)}, 2000)

        }
      } catch (error) {
        console.error("Failed to fetch CMS data:", error);
        // Giữ nguyên cmsData mặc định
      }
    };
    fetchData();
  }, [currentLanguage]);

  const skus = useMemo(() => Object.keys(PRODUCTS) as ProductSku[], []);
  const sku = useMemo(() => {
    const s = (skuParam || "") as ProductSku;
    return (s && PRODUCTS[s]) ? s : skus[0];
  }, [skuParam, skus]);

  const base = sku ? PRODUCTS[sku] : null;

  const metas = useMemo(() => buildCatalogMetas(), []);
  const meta = useMemo(() => metas.find((m) => m.sku === sku) || null, [metas, sku]);

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

  const [rvSort, setRvSort] = useState<"new" | "high" | "low">("new");
  const [rvFilterStar, setRvFilterStar] = useState<"all" | "1" | "2" | "3" | "4" | "5">("all");
  const [rvSearch, setRvSearch] = useState("");

  const allReviews = useMemo(() => (sku ? listReviewsBySku(sku) : []), [sku, reviewOpen]);
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
    setReviewOpen(false);
  }

  return (
      <div className="text-slate-900">

        {/* Top bar chips */}
        <div className="bg-white border-b border-slate-200">
          <div className="mx-auto max-w-7xl px-4 py-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              {cmsData.topBar.chips.map((chip, idx) => (
                  <span key={idx} className="chip">
                <i className={`${chip.icon} ${chip.iconColor}`} />{chip.text}
              </span>
              ))}
            </div>
            <div className="text-sm font-extrabold text-slate-700">
              {cmsData.topBar.hotline.label} <a className="underline" href={`tel:${cmsData.topBar.hotline.phone}`}>{cmsData.topBar.hotline.phone}</a>
              <span className="mx-1">•</span>
              {cmsData.topBar.hotline.zaloLabel} <a className="underline" href="#">{cmsData.topBar.hotline.zaloText}</a>
            </div>
          </div>
        </div>

        {/* Sticky header with anchors */}
        <header className="sticky top-[65px] z-50 bg-white/80 backdrop-blur border-b border-slate-200">
          <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="hidden lg:flex items-center gap-2">
              {cmsData.header.anchors.map((anchor) => (
                  <a key={anchor.href} className="btn !p-2 !text-sm" href={anchor.href}>{anchor.text}</a>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button className="btn !p-2 !text-sm" type="button" onClick={() => setCartOpen(true)}>
                <i className={`${cmsData.header.cartButton.icon} mr-2`} />
                {cmsData.header.cartButton.text}
                <span className="ml-2 chip" style={{ padding: "5px 10px" }}>{cartCount}</span>
              </button>
              <Link className="btn lg:hidden w-10 h-10 text-sm p-0 flex items-center justify-center" to="/products" aria-label="Back">
                <i className={cmsData.header.backButtonIcon} />
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
              <Link className="underline" to="/">{cmsData.breadcrumb.home}</Link>
              <span className="mx-2 text-slate-400">/</span>
              <Link className="underline" to="/products">{cmsData.breadcrumb.shop}</Link>
              <span className="mx-2 text-slate-400">/</span>
              <span>{base.name}</span>
            </div>

            <div className="mt-5 grid gap-6 lg:grid-cols-2 items-start">
              {/* Gallery */}
              <div className="card p-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex gap-2 flex-wrap">
                  <span className="chip">
                    <i className={`${cmsData.gallery.categoryChip.icon} ${cmsData.gallery.categoryChip.color}`} />
                    {catLabel(detail.cat as any)}
                  </span>
                    <span className="chip">
                    <i className={`${cmsData.gallery.goalChip.icon} ${cmsData.gallery.goalChip.color}`} />
                      {goalLabel(detail.target as any)}
                  </span>
                    <span className={`chip ${cmsData.gallery.listedChip.bgClass}`}>
                    <i className={cmsData.gallery.listedChip.icon} /> {cmsData.gallery.listedChip.text}
                  </span>
                  </div>
                  <div className="text-sm font-extrabold text-slate-600">
                    {cmsData.gallery.skuLabel} <span>{detail.skuText}</span>
                  </div>
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
                  <div className="font-extrabold">{cmsData.gallery.highlightsTitle}</div>
                  <ul className="mt-2 grid gap-2 text-sm text-slate-700">
                    {detail.highlights.map((x, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-amber-600 font-extrabold">{cmsData.gallery.bulletIcon}</span>{x}
                        </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Purchase box */}
              <div className="sticky top-[88px]">
                <div className="card p-5">
                  <div className="text-xs font-extrabold text-slate-500">{cmsData.purchaseBox.title}</div>
                  <h1 className="mt-1 text-3xl font-extrabold leading-tight">{base.name}</h1>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-extrabold text-slate-500">{cmsData.purchaseBox.priceLabel}</div>
                      <div className="mt-1 text-4xl font-extrabold text-amber-600">{money(base.price)}</div>
                      <div className="mt-1 text-sm text-slate-500">{cmsData.purchaseBox.vatNote}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-extrabold text-slate-500">{cmsData.purchaseBox.ratingLabel}</div>
                      <div className="mt-1"><Stars value={effectiveAvg} sizeClass="text-xl" /></div>
                      <div className="text-sm text-slate-500">
                        {effectiveAvg.toFixed(1)} • {effectiveCount} {cmsData.purchaseBox.reviewText} • {seedSold} {cmsData.purchaseBox.soldText}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 my-4" />

                  <p className="text-sm text-slate-700 leading-relaxed">{detail.shortDesc}</p>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                      <div className="font-extrabold text-sm">
                        <i className={`${cmsData.purchaseBox.shippingBox.icon} mr-2 ${cmsData.purchaseBox.shippingBox.iconColor}`} />
                        {cmsData.purchaseBox.shippingBox.title}
                      </div>
                      <div className="mt-1 text-sm text-slate-500">{cmsData.purchaseBox.shippingBox.desc}</div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                      <div className="font-extrabold text-sm">
                        <i className={`${cmsData.purchaseBox.returnBox.icon} mr-2 ${cmsData.purchaseBox.returnBox.iconColor}`} />
                        {cmsData.purchaseBox.returnBox.title}
                      </div>
                      <div className="mt-1 text-sm text-slate-500">{cmsData.purchaseBox.returnBox.desc}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 flex-wrap">
                    {cmsData.purchaseBox.chips.map((chip, idx) => (
                        <span key={idx} className="chip">
                      <i className={`${chip.icon} ${chip.iconColor}`} />{chip.text}
                    </span>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center gap-2">
                    <button className="btn w-11 h-11 p-0" type="button" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                      <i className={cmsData.purchaseBox.quantity.minusIcon} />
                    </button>
                    <div className="chip">{cmsData.purchaseBox.quantity.label} <b className="ml-1">{qty}</b></div>
                    <button className="btn w-11 h-11 p-0" type="button" onClick={() => setQty((q) => q + 1)}>
                      <i className={cmsData.purchaseBox.quantity.plusIcon} />
                    </button>

                    <button className="btn btn-primary hover:text-purple-800 flex-1" type="button" onClick={() => addToCart(qty)}>
                      <i className={`${cmsData.purchaseBox.addToCartButton.icon} mr-2`} />{cmsData.purchaseBox.addToCartButton.text}
                    </button>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <button className="btn btn-accent" type="button" onClick={buyNow}>
                      <i className={`${cmsData.purchaseBox.buyNowButton.icon} mr-2`} />{cmsData.purchaseBox.buyNowButton.text}
                    </button>
                    <button className="btn" type="button" onClick={() => window.alert("Mô phỏng mở chat/Zalo tư vấn (demo).")}>
                      <i className={`${cmsData.purchaseBox.consultButton.icon} mr-2`} />{cmsData.purchaseBox.consultButton.text}
                    </button>
                  </div>

                  <div className="mt-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <div className="font-extrabold text-sm">{cmsData.purchaseBox.comboHintTitle}</div>
                    <div className="mt-2 text-sm text-slate-700">{detail.comboHint}</div>
                  </div>
                </div>

                <div className="mt-4 card p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-extrabold">{cmsData.voucherSection.title}</div>
                    <span className="chip">
                    <i className={`${cmsData.voucherSection.chip.icon} ${cmsData.voucherSection.chip.iconColor}`} />
                      {cmsData.voucherSection.chip.text}
                  </span>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-slate-700">
                    {cmsData.voucherSection.vouchers.map((v) => (
                        <div key={v.code} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 flex items-center justify-between">
                          <span><b>{v.code}</b> – {v.description}</span>
                          <button className="btn" type="button" onClick={() => { copyToClipboard(v.code); window.alert("Đã copy voucher: " + v.code); }}>
                            {cmsData.voucherSection.copyButtonText}
                          </button>
                        </div>
                    ))}
                    <div className="text-xs text-slate-500">{cmsData.voucherSection.disclaimer}</div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button className="btn" type="button" onClick={() => setCartOpen(true)}>
                    <i className={`${cmsData.bottomButtons.viewCart.icon} mr-2`} />{cmsData.bottomButtons.viewCart.text}
                  </button>
                  <button className="btn" type="button" onClick={() => navigate("/products")}>
                    <i className={`${cmsData.bottomButtons.category.icon} mr-2`} />{cmsData.bottomButtons.category.text}
                  </button>
                </div>
              </div>
            </div>

            {/* quick anchors */}
            <div className="mt-7 flex flex-wrap gap-2">
              {cmsData.quickAnchors.map((anchor) => (
                  <a key={anchor.href} className="btn" href={anchor.href}>
                    <i className={`${anchor.icon} mr-2`} />{anchor.text}
                  </a>
              ))}
            </div>
          </div>
        </section>

        {/* OVERVIEW */}
        <section id="overview" className="mx-auto max-w-7xl px-4 py-10">
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="card p-6 lg:col-span-2">
              <div className="text-xs font-extrabold text-slate-500">{cmsData.overview.sectionTitle}</div>
              <div className="text-2xl font-extrabold">{cmsData.overview.title}</div>
              <p className="mt-4 text-slate-700 leading-relaxed">{detail.longDesc}</p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {cmsData.overview.boxes.map((box, idx) => (
                    <div key={idx} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                      <div className="font-extrabold"><i className={`${box.icon} mr-2 ${box.iconColor}`} />{box.title}</div>
                      <div className="mt-1 text-sm text-slate-700">
                        {idx === 0 && goalLabel(detail.target as any)}
                        {idx === 1 && "7–14 ngày thấy thay đổi (demo)"}
                        {idx === 2 && "Thấm nhanh • Không nặng mặt (demo)"}
                      </div>
                    </div>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <div className="text-xs font-extrabold text-slate-500">{cmsData.specs.sectionTitle}</div>
              <div className="text-2xl font-extrabold">{cmsData.specs.title}</div>

              <div className="mt-5 grid gap-3 text-sm">
                {cmsData.specs.items.map((item, idx) => (
                    <div key={idx} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 flex items-center justify-between">
                      <span className="text-slate-500 font-extrabold">{item.label}</span>
                      <b>
                        {idx === 0 && detail.size}
                        {idx === 1 && detail.skinType}
                        {idx === 2 && "Việt Nam (demo)"}
                        {idx === 3 && "24 tháng"}
                        {idx === 4 && "Nơi khô ráo"}
                      </b>
                    </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="font-extrabold">{cmsData.specs.commitment.title}</div>
                <ul className="mt-2 grid gap-2 text-sm text-slate-700">
                  {cmsData.specs.commitment.items.map((item, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-amber-600 font-extrabold">{cmsData.specs.commitment.bulletIcon}</span>{item}
                      </li>
                  ))}
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
                <div className="text-xs font-extrabold text-slate-500">{cmsData.ingredients.sectionTitle}</div>
                <div className="text-2xl font-extrabold">{cmsData.ingredients.title}</div>
                <div className="mt-1 text-sm text-slate-700">{cmsData.ingredients.description}</div>
              </div>
              <span className="chip">
              <i className={`${cmsData.ingredients.chip.icon} ${cmsData.ingredients.chip.iconColor}`} />
                {cmsData.ingredients.chip.text}
            </span>
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
              <div className="font-extrabold">{cmsData.ingredients.noteTitle}</div>
              <div className="mt-2 text-sm text-slate-700">{cmsData.ingredients.noteText}</div>
            </div>
          </div>
        </section>

        {/* USAGE */}
        <section id="usage" className="mx-auto max-w-7xl px-4 pb-10">
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="card p-6 lg:col-span-2">
              <div className="text-xs font-extrabold text-slate-500">{cmsData.usage.sectionTitle}</div>
              <div className="text-2xl font-extrabold">{cmsData.usage.title}</div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
                  <div className="font-extrabold">
                    <i className={`${cmsData.usage.morning.icon} mr-2 ${cmsData.usage.morning.iconColor}`} />
                    {cmsData.usage.morning.title}
                  </div>
                  <ol className="mt-3 grid gap-2 text-sm text-slate-700">
                    {detail.usage.am.map((x, i) => (
                        <li key={i} className="flex gap-2"><span className="font-extrabold text-amber-600">{i + 1}.</span>{x}</li>
                    ))}
                  </ol>
                </div>
                <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
                  <div className="font-extrabold">
                    <i className={`${cmsData.usage.evening.icon} mr-2 ${cmsData.usage.evening.iconColor}`} />
                    {cmsData.usage.evening.title}
                  </div>
                  <ol className="mt-3 grid gap-2 text-sm text-slate-700">
                    {detail.usage.pm.map((x, i) => (
                        <li key={i} className="flex gap-2"><span className="font-extrabold text-indigo-600">{i + 1}.</span>{x}</li>
                    ))}
                  </ol>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
                <div className="font-extrabold">{cmsData.usage.checklistTitle}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {detail.checklist.map((x, i) => (
                      <span key={i} className="chip"><i className="fa-solid fa-circle-check text-emerald-600" />{x}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="text-xs font-extrabold text-slate-500">{cmsData.combo.sectionTitle}</div>
              <div className="text-2xl font-extrabold">{cmsData.combo.title}</div>

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

              <div className="mt-4 text-xs text-slate-500">{cmsData.combo.disclaimer}</div>
            </div>
          </div>
        </section>

        {/* REVIEWS */}
        <section id="reviews" className="mx-auto max-w-7xl px-4 pb-10">
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="card p-6">
              <div className="text-xs font-extrabold text-slate-500">{cmsData.reviews.sectionTitle}</div>
              <div className="text-2xl font-extrabold">{cmsData.reviews.summaryTitle}</div>

              <div className="mt-4 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
                <div className="text-5xl font-extrabold">{effectiveAvg ? effectiveAvg.toFixed(1) : "—"}</div>
                <div className="mt-2 text-xl"><Stars value={effectiveAvg} /></div>
                <div className="mt-1 text-sm text-slate-500">{effectiveCount} {cmsData.purchaseBox.reviewText} • (demo)</div>
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
                <div className="font-extrabold">{cmsData.reviews.filterTitle}</div>
                <div className="mt-3 grid gap-2">
                  <select className="btn" value={rvSort} onChange={(e) => setRvSort(e.target.value as any)}>
                    {cmsData.reviews.sortOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.text}</option>
                    ))}
                  </select>
                  <select className="btn" value={rvFilterStar} onChange={(e) => setRvFilterStar(e.target.value as any)}>
                    {cmsData.reviews.starFilterOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.text}</option>
                    ))}
                  </select>
                  <button className="btn btn-primary" type="button" onClick={() => setReviewOpen(true)}>
                    <i className={`${cmsData.reviews.writeReviewButton.icon} mr-2`} />{cmsData.reviews.writeReviewButton.text}
                  </button>
                </div>
              </div>
            </div>

            <div className="card p-6 lg:col-span-2">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="text-xs font-extrabold text-slate-500">{cmsData.reviews.listTitle}</div>
                  <div className="text-2xl font-extrabold">{cmsData.reviews.listSubtitle}</div>
                  <div className="mt-1 text-sm text-slate-700">{cmsData.reviews.disclaimer}</div>
                </div>
                <div className="flex gap-2">
                  <input className="field" placeholder={cmsData.reviews.searchPlaceholder} value={rvSearch} onChange={(e) => setRvSearch(e.target.value)} />
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
                      {cmsData.reviews.noReviewsText}
                    </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-7xl px-4 pb-12">
          <div className="card p-6">
            <div className="text-xs font-extrabold text-slate-500">{cmsData.faq.sectionTitle}</div>
            <div className="text-2xl font-extrabold">{cmsData.faq.title}</div>

            <div className="mt-5 grid gap-3">
              {cmsData.faq.items.map((item, idx) => (
                  <details key={idx} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <summary className="font-extrabold cursor-pointer">{item.question}</summary>
                    <div className="mt-2 text-sm text-slate-700">{item.answer}</div>
                  </details>
              ))}
            </div>
          </div>
        </section>

        {/* Modals */}
        <MiniCartModal cmsData={detailData?.sections?.[0]?.data} open={cartOpen} onClose={() => setCartOpen(false)} />
        <ReviewModal
            cmsData={detailData?.sections?.[1]?.data}
            open={reviewOpen}
            onClose={() => setReviewOpen(false)}
            productName={base.name}
            onSubmit={submitReview}
        />
      </div>
  );
}