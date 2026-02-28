// src/pages/CoursesPage.tsx
import React, { useEffect, useMemo, useState } from "react";

// NOTE: chỉnh lại path nếu project của bạn đặt http client ở chỗ khác.
// Mục tiêu: dùng được mẫu `await http.get(...)` như yêu cầu.
import {http} from "../api/http";

import { type Course, type CourseTopic } from "../data/courses.data";
import { money } from "../services/booking.utils";
import {
  readCourseCart,
  addCourseToCart,
  removeCourseFromCart,
  clearCourseCart,
} from "../services/courseCart.utils";

type ApiTopicOption = { id: number; name: string };

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
  heroPrimaryBtn: "Xem khoá học",
  heroSecondaryBtn: "Khóa học của tôi",

  filterKicker: "Bộ lọc",
  filterTitle: "Tìm & sắp xếp khoá học",
  filterFoundText: "Tìm thấy {count} khoá",
  filterResetBtn: "Đặt lại",
  keywordLabel: "Từ khoá",
  keywordPlaceholder: "VD: skincare, vận hành, tư vấn...",
  topicLabel: "Chủ đề",
  topicAllLabel: "Tất cả",
  prototypeNote: "Prototype: “Chi tiết” mở modal, “Đăng ký” chuyển sang trang thanh toán.",

  listKicker: "Danh sách",
  listTitle: "Khoá học nổi bật",
  listDesc: "Chọn khoá để xem chi tiết hoặc đăng ký ngay.",
  scrollTopBtn: "Lên đầu",
  viewDetailBtn: "Chi tiết",
  registerBtn: "Đăng ký",

  emptyTitle: "Không có khoá học phù hợp",
  emptyDesc: "Thử đổi từ khoá/chủ đề khác.",
  emptyResetBtn: "Đặt lại",

  detailModalKicker: "Khoá học",
  detailRegisterBtn: "Đăng ký ngay",
  detailCloseAria: "Đóng",
  detailStudentsSuffix: "HV",
  detailPriceNote: "Giá niêm yết (có thể áp voucher nếu có)",

  checkoutModalKicker: "Thanh toán",
  checkoutModalTitle: "Xác nhận đăng ký khoá học",
  checkoutCloseAria: "Đóng",
  checkoutEmptyTitle: "Chưa chọn khoá học",
  checkoutEmptyDesc: "Vui lòng chọn khoá học để tiếp tục.",
  checkoutSubtotalLabel: "Tổng thanh toán",
  checkoutConfirmBtn: "Xác nhận & Thanh toán",
  checkoutContinueBtn: "Tiếp tục xem khoá học",

  alertRegistered: "Bạn đã đăng ký thành công khoá học: {title}",
  confirmCancelRegistration: "Bạn có chắc muốn huỷ đăng ký khoá học này?",
  alertCheckout: "Đang chuyển sang trang thanh toán...",
};
const HERO_CHIP_COLOR_BY_INDEX = ["text-amber-600", "text-emerald-600", "text-indigo-600"] as const;

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
              {course.topicName || "-"}
            </span>
              <span className="chip">
              <i className="fa-solid fa-clock text-amber-600" />
                {course.time || `${course.hours} giờ`}
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
                                {c.topicName || "-"} • {money(c.price)}
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
  const [topic, setTopic] = useState<"all" | number>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [totalCourses, setTotalCourses] = useState(0);
  const [courses, setCourses] = useState<Course[]>([]);
  const [topicOptions, setTopicOptions] = useState<ApiTopicOption[]>([]);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const [cartIds, setCartIds] = useState<string[]>(() => readCourseCart());

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [coursesRes, topicsRes] = await Promise.all([
          http.get("/courses", {
            params: {
              lang: currentLanguage,
              page,
              pageSize,
              search: q.trim() || undefined,
              topicId: topic === "all" ? undefined : topic,
            },
          }),
          http.get("/courses/topics", { params: { lang: currentLanguage } }),
        ]);

        if (cancelled) return;

        const topicList: ApiTopicOption[] = Array.isArray(topicsRes.data) ? topicsRes.data : [];
        const topicNameById = new Map(topicList.map((t) => [Number(t.id), t.name]));
        const items = Array.isArray(coursesRes.data?.items)
          ? coursesRes.data.items.filter((item: any) => item?.published !== false)
          : [];
        const mapped: Course[] = items.map((item: any) => {
          const rawTopic = item.courseTopic || item.topic || null;
          const topicId = rawTopic?.id ?? item.topicId ?? null;
          const topicNameFromBe = rawTopic?.name || (topicId != null ? topicNameById.get(Number(topicId)) : undefined);

          return {
            id: String(item.id),
            title: item.title || "",
            topic: "ops" as CourseTopic,
            img: item.thumbnail || cms.heroImageSrc,
            desc: item.shortDescription || item.description || "",
            price: Number(item.price || 0),
            hours: Number(item.time || 0),
            rating: Number(item.ratingAvg || 0),
            students: Number(item.enrollmentCount || 0),
            popular: 0,
            date: item.createdAt || "",
            time: item.time || "",
            topicName: topicNameFromBe || "",
            topicId: topicId != null ? Number(topicId) : null,
          } as Course;
        });

        setCourses(mapped);
        setTotalCourses(Number(coursesRes.data?.total || mapped.length));
        setTopicOptions(topicList);
      } catch (err) {
        console.error("Fetch courses failed:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cms.heroImageSrc, currentLanguage, page, pageSize, q, topic]);

  const totalPages = Math.max(1, Math.ceil(totalCourses / pageSize));

  const selectedCourse = useMemo(() => {
    if (!detailId) return null;
    return courses.find((c) => c.id === detailId) || null;
  }, [courses, detailId]);

  const cartItems = useMemo(() => {
    const set = new Set(cartIds.map((x) => x.toUpperCase()));
    return courses.filter((c) => set.has(c.id.toUpperCase()));
  }, [cartIds, courses]);

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
    setPage(1);
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
                      {tpl(cms.filterFoundText, { count: totalCourses })}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <button className="btn" type="button" onClick={reset} aria-label="reset">
                      <i className="fa-solid fa-rotate-left" /> {cms.filterResetBtn}
                    </button>                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-12">
                  {/* Search */}
                  <div className="md:col-span-6">
                    <label className="text-sm font-extrabold text-slate-700">{cms.keywordLabel}</label>
                    <input
                        className="field mt-2"
                        placeholder={cms.keywordPlaceholder}
                        value={q}
                        onChange={(e) => {
                          setQ(e.target.value);
                          setPage(1);
                        }}
                    />
                  </div>

                  {/* Topic */}
                  <div className="md:col-span-3">
                    <label className="text-sm font-extrabold text-slate-700">{cms.topicLabel}</label>
                    <select className="field mt-2" value={String(topic)} onChange={(e) => {
                      const nextValue = e.target.value === "all" ? "all" : Number(e.target.value);
                      setTopic(nextValue);
                      setPage(1);
                    }}>
                      <option value="all">{cms.topicAllLabel}</option>
                      {topicOptions.map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <label className="text-sm font-extrabold text-slate-700">Mỗi trang</label>
                    <select className="field mt-2" value={pageSize} onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}>
                      <option value={4}>4</option>
                      <option value={8}>8</option>
                      <option value={12}>12</option>
                      <option value={16}>16</option>
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
                  </button>                </div>
              </div>

              <div className="mt-5">
                {courses.length ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {courses.map((c) => (
                      <article key={c.id} className="card overflow-hidden">
                        <img
                          src={c.img}
                          alt={c.title}
                          className="h-48 w-full object-cover"
                        />

                        <div className="p-4">
                          <div className="flex items-center justify-between gap-2">
                            <span className="chip">{c.topicName || "-"}</span>
                            <span className="text-sm font-bold text-slate-600">{c.time || "-"}</span>
                          </div>

                          <h3 className="mt-3 text-lg font-extrabold line-clamp-2">{c.title}</h3>
                          <p className="mt-2 text-sm text-slate-600 line-clamp-2">{c.desc}</p>

                          <div className="mt-3 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-slate-600 text-sm">
                              <Stars rating={c.rating} /> <b>{c.rating.toFixed(1)}</b>
                            </div>
                            <div className="font-extrabold text-indigo-700">{money(c.price)}</div>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-2">
                            <button className="btn text-sm" type="button" onClick={() => setDetailId(c.id)}>
                              <i className="fa-solid fa-eye" /> {cms.viewDetailBtn}
                            </button>
                            <button className="btn btn-primary text-sm hover:text-purple-800" type="button" onClick={() => addToCart(c.id)}>
                              <i className="fa-solid fa-user-plus" /> {cms.addBtn}
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                    <div className="card p-8 text-center text-slate-600">
                      <div className="text-4xl">
                        <i className="fa-solid fa-box-open text-slate-400" />
                      </div>
                      <div className="mt-2 text-xl font-extrabold">{cms.emptyTitle}</div>
                      <div className="mt-2">{cms.emptyDesc}</div>
                      <button className="btn btn-primary hover:text-purple-800 mt-4" type="button" onClick={reset}>
                        <i className="fa-solid fa-rotate" /> {cms.emptyResetBtn}
                      </button>
                    </div>
                )}

                <div className="mt-4 flex items-center justify-end gap-2">
                  <button className="btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Trước</button>
                  <span className="text-sm text-slate-600">Trang {page}/{totalPages}</span>
                  <button className="btn" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Sau</button>
                </div>
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
