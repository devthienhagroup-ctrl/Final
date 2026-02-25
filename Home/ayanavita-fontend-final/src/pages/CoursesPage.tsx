// src/pages/CoursesPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

// NOTE: chỉnh lại path nếu project của bạn đặt http client ở chỗ khác.
// Mục tiêu: dùng được mẫu `await http.get(...)` như yêu cầu.
import {http} from "../api/http";

import { COURSES, type Course, type CourseTopic, topicLabel } from "../data/courses.data";
import { money } from "../services/booking.utils";
import {
  readCourseCart,
  addCourseToCart,
  removeCourseFromCart,
  clearCourseCart,
} from "../services/courseCart.utils";

type SortRule = "best" | "new" | "high" | "low";

export type CoursesPageCmsData = {
  // HERO
  heroImageSrc: string;
  heroImageAlt: string;
  heroChips: { iconClass: string; text: string }[]; // icons can be customized from CMS (colors remain in code)
  heroTitle: string;
  heroTitleHighlight: string;
  heroCartBtn: string;
  heroProductCartLink: string;

  // FILTER
  filterKicker: string;
  filterTitle: string;
  filterFoundText: string; // use {count}
  filterResetBtn: string;
  filterOpenCartBtn: string;
  filterOpenCartBtnSuffix: string; // use {count}
  keywordLabel: string;
  keywordPlaceholder: string;
  topicLabel: string;
  topicAllLabel: string;
  sortLabel: string;
  prototypeNote: string;

  // LIST
  listKicker: string;
  listTitle: string;
  listDesc: string;
  scrollTopBtn: string;
  listCartBtn: string;
  listCartBtnSuffix: string; // use {count}
  viewDetailBtn: string;
  addBtn: string;

  // EMPTY
  emptyTitle: string;
  emptyDesc: string;
  emptyResetBtn: string;

  // COURSE DETAIL MODAL
  detailModalKicker: string;
  detailAddBtn: string;
  detailCloseAria: string;
  detailStudentsSuffix: string;
  detailPriceNote: string;

  // CART MODAL
  cartModalKicker: string;
  cartModalTitle: string;
  cartClearBtn: string;
  cartCloseAria: string;
  cartEmptyTitle: string;
  cartEmptyDesc: string;
  cartSubtotalLabel: string;
  cartCheckoutBtn: string;
  cartContinueBtn: string;

  // CONFIRM/ALERT
  alertAddedToCart: string; // use {id}
  confirmClearCart: string;
  alertCheckout: string;
};

export const defaultCmsData: CoursesPageCmsData = {
  heroImageSrc:
      "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=2400&q=80",
  heroImageAlt: "Courses hero",
  heroChips: [
    { iconClass: "fa-solid fa-graduation-cap", text: "Academy" },
    { iconClass: "fa-solid fa-certificate", text: "Chứng chỉ" },
    { iconClass: "fa-solid fa-video", text: "Video + tài liệu" },
  ],
  heroTitle: "Khoá học AYANAVITA chuẩn spa & vận hành",
  heroTitleHighlight: "chuẩn spa & vận hành",
  heroCartBtn: "Cart",
  heroProductCartLink: "Giỏ hàng sản phẩm",

  filterKicker: "Bộ lọc",
  filterTitle: "Tìm & sắp xếp khoá học",
  filterFoundText: "Tìm thấy {count} khoá",
  filterResetBtn: "Reset",
  filterOpenCartBtn: "Mở cart",
  filterOpenCartBtnSuffix: "{count}",
  keywordLabel: "Từ khoá",
  keywordPlaceholder: "VD: skincare, vận hành, tư vấn...",
  topicLabel: "Chủ đề",
  topicAllLabel: "Tất cả",
  sortLabel: "Sắp xếp",
  prototypeNote: "Prototype: “Chi tiết” mở modal, “Thêm” vào cart.",

  listKicker: "Danh sách",
  listTitle: "Khoá học nổi bật",
  listDesc: "Chọn khoá để xem chi tiết hoặc thêm vào cart.",
  scrollTopBtn: "Lên đầu",
  listCartBtn: "Cart",
  listCartBtnSuffix: "{count}",
  viewDetailBtn: "Chi tiết",
  addBtn: "Thêm",

  emptyTitle: "Không có khoá học phù hợp",
  emptyDesc: "Thử đổi từ khoá/chủ đề khác.",
  emptyResetBtn: "Reset",

  detailModalKicker: "Course",
  detailAddBtn: "Thêm vào cart",
  detailCloseAria: "close",
  detailStudentsSuffix: "HV",
  detailPriceNote: "Giá demo (có thể áp voucher)",

  cartModalKicker: "Cart",
  cartModalTitle: "Giỏ khoá học (demo)",
  cartClearBtn: "Xoá",
  cartCloseAria: "close",
  cartEmptyTitle: "Cart trống",
  cartEmptyDesc: "Thêm khoá học để test checkout.",
  cartSubtotalLabel: "Tạm tính",
  cartCheckoutBtn: "Checkout (demo)",
  cartContinueBtn: "Tiếp tục xem",

  alertAddedToCart: "Đã thêm vào cart (demo): {id}",
  confirmClearCart: "Xoá toàn bộ cart?",
  alertCheckout: "Checkout (demo). Bạn có thể điều hướng sang trang thanh toán thật.",
};

const HERO_CHIP_COLOR_BY_INDEX = ["text-amber-600", "text-emerald-600", "text-indigo-600"] as const;

// NOTE: Options hiển thị trong filter thường gắn với dữ liệu DB (topic, sort rule),
// nên KHÔNG đưa vào cmsData. CMS chỉ chỉnh nội dung text chung.
const SORT_RULE_LABEL: Record<SortRule, string> = {
  best: "Phổ biến",
  new: "Mới nhất",
  high: "Giá cao → thấp",
  low: "Giá thấp → cao",
};

function tpl(text: string, vars: Record<string, string | number>) {
  let out = text;
  for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(String(v));
  return out;
}

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
      <span className="inline-flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
          <i key={i} className={`fa-solid fa-star ${i < full ? "star" : "text-slate-300"}`} />
      ))}
    </span>
  );
}


function CourseDetailModal({
                             open,
                             course,
                             onClose,
                             onAdd,
                             cms,
                           }: {
  open: boolean;
  course: Course | null;
  onClose: () => void;
  onAdd: (id: string) => void;
  cms: CoursesPageCmsData;
}) {
  if (!open || !course) return null;

  return (
      <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/55"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
      >
        <div className="card w-full max-w-4xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-extrabold text-slate-500">{cms.detailModalKicker}</div>
              <div className="font-extrabold truncate">{course.title}</div>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-primary hover:text-purple-800" type="button" onClick={() => onAdd(course.id)}>
                <i className="fa-solid fa-cart-plus" /> {cms.detailAddBtn}
              </button>
              <button
                  className="btn h-10 w-10 p-0"
                  type="button"
                  onClick={onClose}
                  aria-label={cms.detailCloseAria}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
          </div>

          <div className="p-6 grid gap-4">
            <img
                className="w-full h-64 object-cover rounded-3xl ring-1 ring-slate-200"
                src={course.img}
                alt={course.title}
            />

            <div className="flex flex-wrap gap-2">
            <span className="chip">
              <i className="fa-solid fa-layer-group text-indigo-600" />
              {topicLabel(course.topic)}
            </span>
              <span className="chip">
              <i className="fa-solid fa-clock text-amber-600" />
                {course.hours} giờ
            </span>
              <span className="chip">
              <i className="fa-solid fa-users text-emerald-600" />
                {new Intl.NumberFormat("vi-VN").format(course.students)} {cms.detailStudentsSuffix}
            </span>
              <span className="chip">
              <i className="fa-solid fa-star text-amber-500" />
                {course.rating.toFixed(1)}
            </span>
            </div>

            <div className="text-slate-700 leading-relaxed">{course.desc}</div>

            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <div className="flex items-center justify-between">
                <div className="font-extrabold text-indigo-700">{money(course.price)}</div>
                <div className="text-sm text-slate-600">{cms.detailPriceNote}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}

function CourseCartModal({
                           open,
                           onClose,
                           items,
                           onRemove,
                           onClear,
                           cms,
                         }: {
  open: boolean;
  onClose: () => void;
  items: Course[];
  onRemove: (id: string) => void;
  onClear: () => void;
  cms: CoursesPageCmsData;
}) {
  if (!open) return null;

  const total = items.reduce((s, x) => s + (x.price || 0), 0);

  return (
      <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/55"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
      >
        <div className="card w-full max-w-3xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-extrabold text-slate-500">{cms.cartModalKicker}</div>
              <div className="text-lg font-extrabold">{cms.cartModalTitle}</div>
            </div>
            <div className="flex gap-2">
              <button className="btn" type="button" onClick={onClear}>
                <i className="fa-solid fa-trash" /> {cms.cartClearBtn}
              </button>
              <button
                  className="btn h-10 w-10 p-0"
                  type="button"
                  onClick={onClose}
                  aria-label={cms.cartCloseAria}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {items.length ? (
                <div className="grid gap-3">
                  {items.map((c) => (
                      <div key={c.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex gap-3">
                            <img
                                src={c.img}
                                alt={c.title}
                                className="h-16 w-24 object-cover rounded-2xl ring-1 ring-slate-200"
                            />
                            <div>
                              <div className="font-extrabold">{c.title}</div>
                              <div className="text-sm text-slate-600 mt-1">
                                {topicLabel(c.topic)} • {money(c.price)}
                              </div>
                            </div>
                          </div>
                          <button className="btn h-10 w-10 p-0" type="button" onClick={() => onRemove(c.id)}>
                            <i className="fa-solid fa-trash text-rose-600" />
                          </button>
                        </div>
                      </div>
                  ))}
                </div>
            ) : (
                <div className="text-center text-slate-600 py-10">
                  <div className="text-3xl">
                    <i className="fa-solid fa-cart-shopping" />
                  </div>
                  <div className="mt-2 font-extrabold">{cms.cartEmptyTitle}</div>
                  <div className="text-sm mt-1">{cms.cartEmptyDesc}</div>
                </div>
            )}

            <div className="mt-6 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 flex items-center justify-between">
              <div className="text-sm text-slate-600">{cms.cartSubtotalLabel}</div>
              <div className="font-extrabold text-indigo-700">{money(total)}</div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                  className="btn btn-primary flex-1"
                  type="button"
                  onClick={() => window.alert(cms.alertCheckout)}
                  disabled={!items.length}
              >
                <i className="fa-solid fa-credit-card" /> {cms.cartCheckoutBtn}
              </button>
              <button className="btn flex-1" type="button" onClick={onClose}>
                <i className="fa-solid fa-arrow-left" /> {cms.cartContinueBtn}
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}

export default function CoursesPage({
                                      cmsData,
                                    }: {
  cmsData?: Partial<CoursesPageCmsData>;
}) {
  // Ngôn ngữ hiện tại (lấy từ localStorage), mặc định "vi"
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

  // CMS data có thể đến từ props, nhưng sẽ bị ghi đè bằng data gọi API theo ngôn ngữ.
  const [cmsDataState, setCmsDataState] = useState<Partial<CoursesPageCmsData>>(() => cmsData || {});

  // Nếu props cmsData thay đổi (ví dụ CMS preview), sync vào state.
  useEffect(() => {
    setCmsDataState(cmsData || {});
  }, [cmsData]);

  // Gọi API theo ngôn ngữ và ghi đè dữ liệu lên cmsData
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await http.get(`/public/pages/courses?lang=${currentLanguage}`);
        // Hỗ trợ cả kiểu axios ({ data }) lẫn client trả thẳng JSON
        const remoteCms = res.data.sections[0].data;
        if (!cancelled && remoteCms && typeof remoteCms === "object") {
          setCmsDataState((prev) => ({ ...prev, ...remoteCms }));
        }
      } catch (err) {
        // Không phá UI nếu API fail
        console.error("Fetch courses CMS failed:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentLanguage]);

  const cms = useMemo(() => ({ ...defaultCmsData, ...(cmsDataState || {}) }), [cmsDataState]);
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState<"all" | CourseTopic>("all");
  const [sort, setSort] = useState<SortRule>("best");

  const [detailId, setDetailId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const [cartIds, setCartIds] = useState<string[]>(() => readCourseCart());

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();

    let list = COURSES.filter((c) => {
      if (topic !== "all" && c.topic !== topic) return false;
      if (qq) {
        const hay = (c.title + " " + c.desc).toLowerCase();
        if (!hay.includes(qq)) return false;
      }
      return true;
    });

    if (sort === "new") list = [...list].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    if (sort === "high") list = [...list].sort((a, b) => (b.price || 0) - (a.price || 0));
    if (sort === "low") list = [...list].sort((a, b) => (a.price || 0) - (b.price || 0));
    if (sort === "best") list = [...list].sort((a, b) => (b.popular || 0) - (a.popular || 0));

    return list;
  }, [q, topic, sort]);

  const selectedCourse = useMemo(() => {
    if (!detailId) return null;
    return COURSES.find((c) => c.id === detailId) || null;
  }, [detailId]);

  const cartItems = useMemo(() => {
    const set = new Set(cartIds.map((x) => x.toUpperCase()));
    return COURSES.filter((c) => set.has(c.id));
  }, [cartIds]);

  function addToCart(id: string) {
    const next = addCourseToCart(id);
    setCartIds(next);
    window.alert(tpl(cms.alertAddedToCart, { id }));
  }

  function removeFromCart(id: string) {
    const next = removeCourseFromCart(id);
    setCartIds(next);
  }

  function clearCart() {
    if (!window.confirm(cms.confirmClearCart)) return;
    const next = clearCourseCart();
    setCartIds(next);
  }

  function reset() {
    setQ("");
    setTopic("all");
    setSort("best");
  }

  return (
      <div className="text-slate-900">
        {/*<SiteHeader />*/}

        <main className="pb-12">
          {/* HERO full width */}
          <section className="relative">
            <img
                className="h-64 md:h-80 w-full object-cover"
                alt={cms.heroImageAlt}
                src={cms.heroImageSrc}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 to-indigo-700/25" />

            <div className="absolute inset-0">
              <div className="max-w-7xl mx-auto h-full px-4 py-8 flex flex-col justify-end">
                <div className="flex flex-wrap gap-2">
                  {(cms.heroChips || []).slice(0, 3).map((chip, idx) => (
                      <span key={idx} className="chip">
                    <i className={`${chip.iconClass} ${HERO_CHIP_COLOR_BY_INDEX[idx] || ""}`} /> {chip.text}
                  </span>
                  ))}
                </div>

                <h1 className="mt-3 text-2xl md:text-4xl font-extrabold text-white">
                  {cms.heroTitle.replace(cms.heroTitleHighlight, "")}
                  <span className="text-amber-300">{cms.heroTitleHighlight}</span>
                </h1>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="btn btn-accent" type="button" onClick={() => setCartOpen(true)}>
                    <i className="fa-solid fa-cart-shopping" />
                    {cms.heroCartBtn}
                    <span className="chip ml-1">{cartIds.length}</span>
                  </button>
                  <Link className="btn btn-primary hover:text-purple-800" to="/cart">
                    <i className="fa-solid fa-bag-shopping" />
                    {cms.heroProductCartLink}
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* FILTER BAR ngang (trên) */}
          <section className="px-4 -mt-6">
            <div className="max-w-7xl mx-auto">
              <div className="card p-4 md:p-5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="text-xs font-extrabold text-slate-500">{cms.filterKicker}</div>
                    <div className="text-lg md:text-xl font-extrabold">{cms.filterTitle}</div>
                    <div className="mt-1 text-sm text-slate-600">
                      {tpl(cms.filterFoundText, { count: filtered.length })}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <button className="btn" type="button" onClick={reset} aria-label="reset">
                      <i className="fa-solid fa-rotate-left" /> {cms.filterResetBtn}
                    </button>
                    <button className="btn btn-primary hover:text-purple-800" type="button" onClick={() => setCartOpen(true)}>
                      <i className="fa-solid fa-cart-shopping" /> {cms.filterOpenCartBtn}{" "}
                      <span className="chip ml-1">{tpl(cms.filterOpenCartBtnSuffix, { count: cartIds.length })}</span>
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-12">
                  {/* Search */}
                  <div className="md:col-span-6">
                    <label className="text-sm font-extrabold text-slate-700">{cms.keywordLabel}</label>
                    <input
                        className="field mt-2"
                        placeholder={cms.keywordPlaceholder}
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                  </div>

                  {/* Topic */}
                  <div className="md:col-span-3">
                    <label className="text-sm font-extrabold text-slate-700">{cms.topicLabel}</label>
                    <select className="field mt-2" value={topic} onChange={(e) => setTopic(e.target.value as any)}>
                      <option value="all">{cms.topicAllLabel}</option>
                      <option value="technique">{topicLabel("technique")}</option>
                      <option value="consult">{topicLabel("consult")}</option>
                      <option value="ops">{topicLabel("ops")}</option>
                      <option value="product">{topicLabel("product")}</option>
                    </select>
                  </div>

                  {/* Sort */}
                  <div className="md:col-span-3">
                    <label className="text-sm font-extrabold text-slate-700">{cms.sortLabel}</label>
                    <select className="field mt-2" value={sort} onChange={(e) => setSort(e.target.value as SortRule)}>
                      <option value="best">{SORT_RULE_LABEL.best}</option>
                      <option value="new">{SORT_RULE_LABEL.new}</option>
                      <option value="high">{SORT_RULE_LABEL.high}</option>
                      <option value="low">{SORT_RULE_LABEL.low}</option>
                    </select>
                  </div>
                </div>

                <div className="mt-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 text-sm text-slate-700">
                  {cms.prototypeNote}
                </div>
              </div>
            </div>
          </section>

          {/* LIST full trang */}
          <section className="px-4 mt-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-end justify-between gap-3 flex-wrap">
                <div>
                  <div className="text-xs font-extrabold text-slate-500">{cms.listKicker}</div>
                  <div className="text-2xl font-extrabold">{cms.listTitle}</div>
                  <div className="mt-1 text-slate-600 text-sm">{cms.listDesc}</div>
                </div>

                <div className="flex gap-2">
                  <button className="btn" type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                    <i className="fa-solid fa-arrow-up" /> {cms.scrollTopBtn}
                  </button>
                  <button className="btn btn-primary hover:text-purple-800" type="button" onClick={() => setCartOpen(true)}>
                    <i className="fa-solid fa-cart-shopping" />
                    {cms.listCartBtn}{" "}
                    <span className="chip ml-1">{tpl(cms.listCartBtnSuffix, { count: cartIds.length })}</span>
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((c) => (
                    <article key={c.id} className="card overflow-hidden">
                      <div className="relative">
                        <img src={c.img} alt={c.title} className="w-full h-44 object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/55 to-transparent" />
                        <div className="absolute left-4 bottom-4 flex flex-wrap gap-2">
                      <span className="chip">
                        <i className="fa-solid fa-layer-group text-indigo-600" />
                        {topicLabel(c.topic)}
                      </span>
                          <span className="chip">
                        <i className="fa-solid fa-clock text-amber-600" />
                            {c.hours}h
                      </span>
                        </div>
                      </div>

                      <div className="p-5">
                        <div className="font-extrabold">{c.title}</div>

                        <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                          <Stars rating={c.rating} />
                          <b>{c.rating.toFixed(1)}</b>
                          <span className="muted">• {new Intl.NumberFormat("vi-VN").format(c.students)} HV</span>
                        </div>

                        <p className="mt-3 text-slate-700 leading-relaxed line-clamp-3">{c.desc}</p>

                        <div className="mt-4 flex flex-col gap-2 items-end">
                          <div className="font-extrabold text-indigo-700 text-2xl">{money(c.price)}</div>
                          <div className="flex gap-2 w-full">
                            <button className="btn text-sm w-1/2" type="button" onClick={() => setDetailId(c.id)}>
                              <i className="fa-solid fa-eye" /> {cms.viewDetailBtn}
                            </button>
                            <button className="btn btn-primary text-sm w-1/2 hover:text-purple-800" type="button" onClick={() => addToCart(c.id)}>
                              <i className="fa-solid fa-cart-plus" /> {cms.addBtn}
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                ))}

                {!filtered.length ? (
                    <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 card p-8 text-center text-slate-600">
                      <div className="text-4xl">
                        <i className="fa-solid fa-box-open text-slate-400" />
                      </div>
                      <div className="mt-2 text-xl font-extrabold">{cms.emptyTitle}</div>
                      <div className="mt-2">{cms.emptyDesc}</div>
                      <button className="btn btn-primary hover:text-purple-800 mt-4" type="button" onClick={reset}>
                        <i className="fa-solid fa-rotate" /> {cms.emptyResetBtn}
                      </button>
                    </div>
                ) : null}
              </div>
            </div>
          </section>
        </main>

        {/*<Footer />*/}

        <CourseDetailModal
            open={!!detailId}
            course={selectedCourse}
            onClose={() => setDetailId(null)}
            onAdd={(id) => addToCart(id)}
            cms={cms}
        />

        <CourseCartModal
            open={cartOpen}
            onClose={() => setCartOpen(false)}
            items={cartItems}
            onRemove={removeFromCart}
            onClear={clearCart}
            cms={cms}
        />
      </div>
  );
}
