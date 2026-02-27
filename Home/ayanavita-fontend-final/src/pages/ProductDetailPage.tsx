import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

// NOTE: Product detail must use API data only. Avoid demo/seed datasets.
import { money } from "../services/booking.utils";
import { addProductToCart, readProductCart } from "../services/productCart.utils";

import { MiniCartModal } from "../components/shop/MiniCartModal";
import { ReviewModal } from "../components/shop/ReviewModal";
import { Stars } from "../components/shop/Stars";

// (removed) buildCatalogMetas / PRODUCT_DETAIL_SEEDS / label helpers
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
    title: "Sản phẩm cùng danh mục",
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
  const { slug: slugParam } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  // ===== NGÔN NGỮ & CMS DYNAMIC =====
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
    return localStorage.getItem("preferred-language") || "vi";
  });

  const [detailData, setDetailData] = useState<any>(null);
  const [cmsData, setCmsData] = useState(defaultCmsData);
  const [apiProduct, setApiProduct] = useState<any>(null);
  // SKU đã resolve từ lần fetch theo slug. Khi đổi ngôn ngữ sẽ fetch theo SKU
  // vì slug mỗi ngôn ngữ khác nhau.
  const [resolvedSku, setResolvedSku] = useState<string | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);

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

  // 1) Lần đầu load trang (hoặc khi đổi route slug): gọi theo slug + lang.
  //    Sau khi lấy được, lưu SKU để lần đổi ngôn ngữ gọi theo SKU.
  useEffect(() => {
    if (!slugParam) return;

    // đổi slug route => reset sku đã resolve
    setResolvedSku(null);

    let cancelled = false;
    const fetchProductBySlug = async () => {
      setLoadingProduct(true);
      setProductError(null);
      try {
        const res = await http.get(`/public/catalog/products/slug/${slugParam}?lang=${currentLanguage}`);
        if (cancelled) return;
        setApiProduct(res.data);
        const sku = String(res.data?.sku || "").trim();
        setResolvedSku(sku || null);
        console.log(`GET /public/catalog/products/slug/${slugParam}?lang=${currentLanguage} response:`, res.data);
      } catch (error) {
        console.error("GET /public/catalog/products/slug/:slug failed:", error);
        if (!cancelled) {
          setApiProduct(null);
          setResolvedSku(null);
          setProductError("Không tải được dữ liệu sản phẩm từ API.");
        }
      } finally {
        if (!cancelled) setLoadingProduct(false);
      }
    };

    fetchProductBySlug();
    return () => {
      cancelled = true;
    };
    // CHỈ phụ thuộc slugParam: đúng yêu cầu "lần đầu" fetch theo slug.
    // Đổi ngôn ngữ sẽ do effect bên dưới xử lý bằng SKU.
  }, [slugParam]);

  // 2) Những lần sau khi ngôn ngữ thay đổi: gọi theo SKU + lang
  useEffect(() => {
    if (!resolvedSku) return;

    let cancelled = false;
    const fetchProductBySku = async () => {
      setLoadingProduct(true);
      setProductError(null);
      try {
        // Backend: @Get('public/catalog/products/:sku')
        const res = await http.get(`/public/catalog/products/${resolvedSku}?lang=${currentLanguage}`);
        if (cancelled) return;
        setApiProduct(res.data);
        console.log(`GET /public/catalog/products/${resolvedSku}?lang=${currentLanguage} response:`, res.data);
      } catch (error) {
        console.error("GET /public/catalog/products/:sku failed:", error);
        if (!cancelled) {
          setApiProduct(null);
          setProductError("Không tải được dữ liệu sản phẩm theo ngôn ngữ mới.");
        }
      } finally {
        if (!cancelled) setLoadingProduct(false);
      }
    };

    fetchProductBySku();
    return () => {
      cancelled = true;
    };
  }, [currentLanguage, resolvedSku]);

  const productKey = useMemo(() => String(apiProduct?.sku || slugParam || ""), [apiProduct?.sku, slugParam]);

  const images = useMemo(() => {
    const rows = Array.isArray(apiProduct?.images) ? apiProduct.images.slice() : [];
    // Ưu tiên sortOrder tăng dần, rồi ưu tiên isPrimary
    rows.sort((a: any, b: any) => {
      const ao = Number.isFinite(Number(a?.sortOrder)) ? Number(a.sortOrder) : 999999;
      const bo = Number.isFinite(Number(b?.sortOrder)) ? Number(b.sortOrder) : 999999;
      if (ao !== bo) return ao - bo;
      if (!!a?.isPrimary !== !!b?.isPrimary) return a?.isPrimary ? -1 : 1;
      return 0;
    });
    const urls = rows.map((x: any) => x?.imageUrl).filter(Boolean);
    if (urls.length) {
      const primary = rows.find((x: any) => x?.isPrimary && x?.imageUrl)?.imageUrl;
      if (primary) return [primary, ...urls.filter((u: string) => u !== primary)];
      return urls;
    }
    return apiProduct?.image ? [apiProduct.image] : [];
  }, [apiProduct]);

  const [mainImg, setMainImg] = useState(images[0]);
  useEffect(() => {
    setMainImg(images[0]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [productKey, images]);

  const [qty, setQty] = useState(1);
  useEffect(() => setQty(1), [productKey]);

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

  const stats = useMemo(() => calcReviewStats(listReviewsBySku(productKey as any)), [productKey, reviewOpen]);

  const displayName = apiProduct?.name || "";
  const displayPrice = Number(apiProduct?.price ?? 0);

  const effectiveAvg = stats.count ? stats.avg : 0;
  const effectiveCount = stats.count ? stats.count : 0;

  const filteredReviews = useMemo(() => {
    let rs = listReviewsBySku(productKey as any).slice();

    if (rvFilterStar !== "all") rs = rs.filter((r) => String(r.stars) === rvFilterStar);
    const q = rvSearch.trim().toLowerCase();
    if (q) rs = rs.filter((r) => (r.name + " " + r.text).toLowerCase().includes(q));
    if (rvSort === "new") rs.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    if (rvSort === "high") rs.sort((a, b) => b.stars - a.stars);
    if (rvSort === "low") rs.sort((a, b) => a.stars - b.stars);
    return rs;
  }, [productKey, rvFilterStar, rvSearch, rvSort, reviewOpen]);

  const guideIntro = apiProduct?.guideContent?.intro || "";
  const guideSteps = useMemo(() => {
    const steps = Array.isArray(apiProduct?.guideContent?.steps) ? apiProduct.guideContent.steps.slice() : [];
    steps.sort((a: any, b: any) => (Number(a?.order || 0) - Number(b?.order || 0)));
    return steps;
  }, [apiProduct?.guideContent?.steps]);

  const shortDesc = apiProduct?.shortDescription || "";
  const longDesc = apiProduct?.description || "";

  const ingredients = useMemo(() => {
    return Array.isArray(apiProduct?.ingredients)
        ? apiProduct.ingredients
            .map((x: any) => ({ name: x?.name, desc: x?.value || x?.note || "" }))
            .filter((x: any) => x?.name)
        : [];
  }, [apiProduct?.ingredients]);

  const formatAttributeValue = (a: any) => {
    if (a?.valueText != null && String(a.valueText).trim() !== "") return String(a.valueText);
    if (a?.valueNumber != null && a.valueNumber !== "") return String(a.valueNumber);
    if (a?.valueBoolean != null) return a.valueBoolean ? "Có" : "Không";
    if (a?.valueJson != null) {
      try {
        return typeof a.valueJson === "string" ? a.valueJson : JSON.stringify(a.valueJson);
      } catch {
        return "[json]";
      }
    }
    return "—";
  };

  if (!slugParam) {
    return (
        <div className="text-slate-900">
          <main className="px-4 pb-10">
            <div className="max-w-4xl mx-auto card p-6">
              <div className="text-2xl font-extrabold">Thiếu mã sản phẩm</div>
              <div className="mt-2 text-slate-600">URL không có tham số slug sản phẩm.</div>
              <Link className="mt-4 btn btn-primary inline-block" to="/products">Về danh mục</Link>
            </div>
          </main>
        </div>
    );
  }

  if (loadingProduct) {
    return (
        <div className="text-slate-900">
          <main className="px-4 pb-10">
            <div className="max-w-7xl mx-auto">
              <div className="card p-6">
                <div className="text-2xl font-extrabold">Đang tải sản phẩm…</div>
                <div className="mt-2 text-slate-600">Vui lòng đợi một chút.</div>
              </div>
            </div>
          </main>
        </div>
    );
  }

  if (productError || !apiProduct) {
    return (
        <div className="text-slate-900">
          <main className="px-4 pb-10">
            <div className="max-w-4xl mx-auto card p-6">
              <div className="text-2xl font-extrabold">Không tìm thấy sản phẩm</div>
              <div className="mt-2 text-slate-600">{productError || "API không trả về dữ liệu."}</div>
              <Link className="mt-4 btn btn-primary inline-block" to="/products">Về danh mục</Link>
            </div>
          </main>
        </div>
    );
  }

  function addToCart(q: number) {
    addProductToCart(productKey as any, q);
    setCartCount(readProductCart().reduce((s, i) => s + Number(i.qty || 0), 0));
    window.alert("Đã thêm vào giỏ (demo).");
  }

  function buyNow() {
    addToCart(qty);
    setCartOpen(true);
  }

  function submitReview(x: { name: string; stars: number; text: string }) {
    addReview(productKey as any, x);
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
              <span>{displayName}</span>
            </div>

            <div className="mt-5 grid gap-6 lg:grid-cols-2 items-start">
              {/* Gallery */}
              <div className="card p-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex gap-2 flex-wrap">
                  <span className="chip">
                    <i className={`${cmsData.gallery.categoryChip.icon} ${cmsData.gallery.categoryChip.color}`} />
                    {apiProduct?.category?.name || "—"}
                  </span>
                    <span className="chip">
                    <i className={`${cmsData.gallery.goalChip.icon} ${cmsData.gallery.goalChip.color}`} />
                      {apiProduct?.status || "—"}
                  </span>
                    <span className={`chip ${cmsData.gallery.listedChip.bgClass}`}>
                    <i className={cmsData.gallery.listedChip.icon} /> {cmsData.gallery.listedChip.text}
                  </span>
                  </div>
                  <div className="text-sm font-extrabold text-slate-600">
                    {cmsData.gallery.skuLabel} <span>{apiProduct?.sku || "—"}</span>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl overflow-hidden border border-slate-200 bg-white">
                  {mainImg ? (
                      <img className="w-full h-[420px] object-cover" src={mainImg} alt={displayName} />
                  ) : (
                      <div className="w-full h-[420px] grid place-items-center text-slate-500">
                        Chưa có hình ảnh
                      </div>
                  )}
                </div>

                {images.length ? (
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
                ) : null}

                <div className="mt-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="font-extrabold">{cmsData.gallery.highlightsTitle}</div>
                  {shortDesc}
                </div>
              </div>

              {/* Purchase box */}
              <div className="sticky top-[88px]">
                <div className="card p-5">
                  <div className="text-xs font-extrabold text-slate-500">{cmsData.purchaseBox.title}</div>
                  <h1 className="mt-1 text-3xl font-extrabold leading-tight">{displayName}</h1>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-extrabold text-slate-500">{cmsData.purchaseBox.priceLabel}</div>
                      <div className="mt-1 text-4xl font-extrabold text-amber-600">{money(displayPrice)}</div>
                      <div className="mt-1 text-sm text-slate-500">{cmsData.purchaseBox.vatNote}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-extrabold text-slate-500">{cmsData.purchaseBox.ratingLabel}</div>
                      <div className="mt-1"><Stars value={effectiveAvg} sizeClass="text-xl" /></div>
                      <div className="text-sm text-slate-500">
                        {(effectiveAvg || 0).toFixed(1)} • {effectiveCount} {cmsData.purchaseBox.reviewText}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 my-4" />

                  <p className="text-sm text-slate-700 leading-relaxed">{shortDesc}</p>

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
                    <div className="mt-2 text-sm text-slate-700">{apiProduct?.category?.name ? `Danh mục: ${apiProduct.category.name}` : ""}</div>
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
          </div>
        </section>

        {/* OVERVIEW */}
        <section id="overview" className="mx-auto max-w-7xl px-4 py-10">
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="card p-6 lg:col-span-2">
              <div className="text-xs font-extrabold text-slate-500">{cmsData.overview.sectionTitle}</div>

              <p className="mt-4 text-slate-700 leading-relaxed">{longDesc || shortDesc || "—"}</p>
            </div>

            <div className="card p-6">
              <div className="text-xs font-extrabold text-slate-500">{cmsData.specs.sectionTitle}</div>
              <div className="text-2xl font-extrabold">{cmsData.specs.title}</div>

              <div className="mt-5 grid gap-3 text-sm">
                {(Array.isArray(apiProduct?.attributes) ? apiProduct.attributes : []).map((a: any, idx: number) => (
                    <div key={`${a?.key || idx}`} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 flex items-center justify-between">
                      <span className="text-slate-500 font-extrabold">{a?.name || a?.key || "—"}</span>
                      <b>{formatAttributeValue(a)}</b>
                    </div>
                ))}

                {!Array.isArray(apiProduct?.attributes) || apiProduct.attributes.length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 text-slate-600">
                      Chưa có thuộc tính.
                    </div>
                ) : null}

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
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {ingredients.map((ing: any, idx: number) => (
                  <div key={`${ing.name}-${idx}`} className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
                    <div className="font-extrabold">{ing.name}</div>
                    <div className="mt-2 text-sm text-slate-700">{ing.desc}</div>
                  </div>
              ))}

              {ingredients.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200 text-sm text-slate-700 md:col-span-3">
                    Chưa có dữ liệu thành phần.
                  </div>
              ) : null}
            </div>
          </div>
        </section>

        {/* USAGE */}
        <section id="usage" className="mx-auto max-w-7xl px-4 pb-10">
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="card p-6 lg:col-span-2">
              <div className="text-xs font-extrabold text-slate-500">{cmsData.usage.sectionTitle}</div>
              <div className="text-2xl font-extrabold">{cmsData.usage.title}</div>
              <p>{guideIntro || "—"}</p>
              <div className="mt-4">
                <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
                  <ol className="mt-3 grid gap-2 text-sm text-slate-700">
                    {guideSteps.length ? guideSteps.map((s: any, idx: number) => (
                        <li key={`${s?.order || idx}`} className="flex gap-2">
                          <span className="font-extrabold text-amber-600">{idx + 1}. </span>
                          {s?.content || "—"}
                        </li>
                    )) : (
                        <li className="text-slate-600">Chưa có các bước hướng dẫn.</li>
                    )}

                  </ol>
                </div>
              </div>

            </div>

            {/* Sản phẩm cùng danh mục: chỉ hiển thị khi backend có dữ liệu liên quan */}
            {Array.isArray(apiProduct?.relatedProducts) && apiProduct.relatedProducts.length ? (
                <div className="card p-6">
                  <div className="text-xs font-extrabold text-slate-500">{cmsData.combo.sectionTitle}</div>
                  <div className="text-2xl font-extrabold">{cmsData.combo.title}</div>

                  <div className="mt-4 grid gap-3">
                    {apiProduct.relatedProducts.slice(0, 5).map((p: any) => (
                        <div key={p?.sku || p?.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                          <div className="flex gap-3">
                            <img className="h-16 w-16 rounded-2xl object-cover border border-slate-200" src={p?.image || p?.img || images?.[0]} alt={p?.name || ""} />
                            <div className="min-w-0">
                              <div className="font-extrabold truncate">{p?.name}</div>
                              <div className="text-sm text-slate-500">{money(Number(p?.price || 0))}</div>
                              <button className="btn mt-2 w-full" type="button" onClick={() => navigate(`/products/${p?.slug || p?.sku || p?.id}`)}>
                                <i className="fa-solid fa-arrow-right mr-2" />Xem
                              </button>
                            </div>
                          </div>
                        </div>
                    ))}
                  </div>

                  <div className="mt-4 text-xs text-slate-500">{cmsData.combo.disclaimer}</div>
                </div>
            ) : null}
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
                              <div className="mt-1 text-sm text-slate-500">{displayName}</div>
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
            productName={displayName}
            onSubmit={submitReview}
        />
      </div>
  );
}