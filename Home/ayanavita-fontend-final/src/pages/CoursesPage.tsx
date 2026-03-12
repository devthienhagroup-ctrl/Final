// src/pages/CoursesPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

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

type SwalIcon = "success" | "error" | "warning" | "info" | "question";
type SwalLike = {
  fire: (options: Record<string, unknown>) => Promise<{ isConfirmed?: boolean }>;
  mixin: (options: Record<string, unknown>) => SwalLike;
};

type ApiTopicOption = { id: number; name: string };

type SepayOrderResponse = {
  mode?: string;
  enrolled?: boolean;
  total?: number;
  payment?: {
    bank?: {
      gateway?: string;
      accountNumber?: string;
      accountName?: string;
    };
    transferContent?: string;
  };
};

type MyCoursePass = {
  id: number;
  endAt: string;
  graceUntil: string;
  remainingUnlocks: number;
  entitlementState?: "CONFIRMED" | "PENDING_CHARGE";
  computedStatus?: "SCHEDULED" | "ACTIVE" | "GRACE" | "EXPIRED" | "CANCELED";
  plan?: { code?: string; name?: string };
};

type UnlockCourseResponse = {
  unlocked?: boolean;
  alreadyEntitled?: boolean;
  alreadyUnlocked?: boolean;
  pass?: {
    remainingUnlocks?: number;
    plan?: { code?: string; name?: string };
  };
};

export type CoursesPageCmsData = {
  // HERO
  heroImageSrc: string;
  heroImageAlt: string;
  heroChips: { iconClass: string; text: string }[];
  heroTitle: string;
  heroTitleHighlight: string;
  heroCartBtn: string;
  heroProductCartLink: string;

  // FILTER
  filterKicker: string;
  filterTitle: string;
  filterFoundText: string;
  filterResetBtn: string;
  filterOpenCartBtn: string;
  filterOpenCartBtnSuffix: string;
  keywordLabel: string;
  keywordPlaceholder: string;
  topicLabel: string;
  topicAllLabel: string;
  pageSizeLabel: string;
  prototypeNote: string;

  // LIST
  listKicker: string;
  listTitle: string;
  listDesc: string;
  scrollTopBtn: string;
  listCartBtn: string;
  listCartBtnSuffix: string;
  viewDetailBtn: string;
  registerBtn: string;
  registerLoadingBtn: string;
  courseHourSuffix: string;
  paginationPrevBtn: string;
  paginationInfoText: string;
  paginationNextBtn: string;

  // EMPTY
  emptyTitle: string;
  emptyDesc: string;
  emptyResetBtn: string;

  // DETAIL MODAL
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

  // QR MODAL
  qrModalTitle: string;
  qrModalImageAlt: string;
  qrModalBankLabel: string;
  qrModalAccountNumberLabel: string;
  qrModalAccountNameLabel: string;
  qrModalAmountLabel: string;
  qrModalTransferContentLabel: string;

  // DIALOG / TOAST
  notifyTitle: string;
  notifyCloseBtn: string;
  confirmTitle: string;
  confirmOkBtn: string;
  confirmCancelBtn: string;
  successTitle: string;
  errorTitle: string;
  qrErrorTitle: string;
  registerFailedTitle: string;
  filterResetAria: string;
  clearCartConfirmTitle: string;
  clearCartConfirmOkBtn: string;
  clearCartConfirmCancelBtn: string;

  // ALERT
  alertAddedToCart: string;
  alertCheckout: string;
  alertCartCleared: string;
  alertRegisterSuccess: string;
  alertQrMissingInfo: string;
  alertAlreadyEntitled: string;
  alertAlreadyUnlockedWithQuota: string;
  alertAlreadyUnlocked: string;
  alertUnlockSuccessWithQuota: string;
  alertUnlockSuccess: string;
  alertHavePassConfirm: string;
  alertHavePassTitle: string;
  alertHavePassConfirmBtn: string;
  alertHavePassCancelBtn: string;
  alertRegisterFailed: string;
  confirmClearCart: string;
  passLabelFallback: string;
};

export const defaultCmsData: CoursesPageCmsData = {
  heroImageSrc:
      "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=2400&q=80",
  heroImageAlt: "Ảnh bìa khóa học",
  heroChips: [
    { iconClass: "fa-solid fa-graduation-cap", text: "Học viện" },
    { iconClass: "fa-solid fa-certificate", text: "Chứng chỉ" },
    { iconClass: "fa-solid fa-video", text: "Video + tài liệu" },
  ],
  heroTitle: "Khóa học AYANAVITA chuẩn spa & vận hành",
  heroTitleHighlight: "chuẩn spa & vận hành",
  heroCartBtn: "Xem giỏ khóa học",
  heroProductCartLink: "/cart",

  filterKicker: "Bộ lọc",
  filterTitle: "Tìm & sắp xếp khóa học",
  filterFoundText: "Tìm thấy {count} khóa",
  filterResetBtn: "Đặt lại",
  filterOpenCartBtn: "Mở giỏ",
  filterOpenCartBtnSuffix: "({count})",
  keywordLabel: "Từ khóa",
  keywordPlaceholder: "VD: skincare, vận hành, tư vấn...",
  topicLabel: "Chủ đề",
  topicAllLabel: "Tất cả",
  pageSizeLabel: "Mỗi trang",
  prototypeNote: "Prototype: Chi tiết mở trang detail, đăng ký mở QR hoặc mở khóa bằng gói.",

  listKicker: "Danh sách",
  listTitle: "Khóa học nổi bật",
  listDesc: "Chọn khóa để xem chi tiết hoặc đăng ký ngay.",
  scrollTopBtn: "Lên đầu",
  listCartBtn: "Giỏ khóa học",
  listCartBtnSuffix: "({count})",
  viewDetailBtn: "Chi tiết",
  registerBtn: "Đăng ký",
  registerLoadingBtn: "Đang tạo QR...",
  courseHourSuffix: "giờ",
  paginationPrevBtn: "Trước",
  paginationInfoText: "Trang {page}/{totalPages}",
  paginationNextBtn: "Sau",

  emptyTitle: "Không có khóa học phù hợp",
  emptyDesc: "Thử đổi từ khóa/chủ đề khác.",
  emptyResetBtn: "Đặt lại",

  detailModalKicker: "Khóa học",
  detailAddBtn: "Thêm vào giỏ",
  detailCloseAria: "Đóng",
  detailStudentsSuffix: "HV",
  detailPriceNote: "Giá niêm yết (có thể áp voucher nếu có)",

  cartModalKicker: "Thanh toán",
  cartModalTitle: "Xác nhận đăng ký khóa học",
  cartClearBtn: "Xóa tất cả",
  cartCloseAria: "Đóng",
  cartEmptyTitle: "Chưa chọn khóa học",
  cartEmptyDesc: "Vui lòng chọn khóa học để tiếp tục.",
  cartSubtotalLabel: "Tổng thanh toán",
  cartCheckoutBtn: "Xác nhận & Thanh toán",
  cartContinueBtn: "Tiếp tục xem khóa học",

  qrModalTitle: "Quét QR để thanh toán",
  qrModalImageAlt: "Mã QR thanh toán SePay",
  qrModalBankLabel: "Ngân hàng:",
  qrModalAccountNumberLabel: "Số tài khoản:",
  qrModalAccountNameLabel: "Chủ tài khoản:",
  qrModalAmountLabel: "Số tiền:",
  qrModalTransferContentLabel: "Nội dung CK:",

  notifyTitle: "Thông báo",
  notifyCloseBtn: "Đóng",
  confirmTitle: "Xác nhận",
  confirmOkBtn: "Đồng ý",
  confirmCancelBtn: "Hủy",
  successTitle: "Thành công",
  errorTitle: "Lỗi",
  qrErrorTitle: "Không thể tạo QR",
  registerFailedTitle: "Đăng ký thất bại",
  filterResetAria: "Đặt lại bộ lọc",
  clearCartConfirmTitle: "Xác nhận xóa giỏ",
  clearCartConfirmOkBtn: "Xóa tất cả",
  clearCartConfirmCancelBtn: "Hủy",

  alertAddedToCart: "Đã thêm khóa vào giỏ: {id}",
  alertCheckout: "Đang chuyển sang trang thanh toán...",
  alertCartCleared: "Đã xóa toàn bộ khóa học trong giỏ.",
  alertRegisterSuccess: "Đăng ký thành công. Khóa học miễn phí đã được kích hoạt.",
  alertQrMissingInfo: "Không lấy được thông tin chuyển khoản từ hệ thống.",
  alertAlreadyEntitled: "Bạn đã có quyền học khóa học này.",
  alertAlreadyUnlockedWithQuota: "Khóa học đã được mở khóa trước đó. Quota còn lại: {remaining}.",
  alertAlreadyUnlocked: "Khóa học đã được mở khóa trước đó.",
  alertUnlockSuccessWithQuota: "Mở khóa thành công bằng {planName}. Quota còn lại: {remaining}.",
  alertUnlockSuccess: "Mở khóa thành công bằng gói đăng ký.",
  alertHavePassConfirm: `Bạn đang có {passLabel} (còn {passQuota} lượt, hết hạn {passExpire}).
  Chọn "Mở khóa bằng gói" để trừ 1 quota.
      Chọn "Thanh toán QR" để mua trực tiếp.`,
  alertHavePassTitle: "Phát hiện gói đăng ký",
  alertHavePassConfirmBtn: "Mở khóa bằng gói",
  alertHavePassCancelBtn: "Thanh toán QR",
  alertRegisterFailed: "Không thể đăng ký khóa học. Vui lòng thử lại.",
  confirmClearCart: "Bạn có chắc muốn xóa toàn bộ khóa học đã chọn?",
  passLabelFallback: "gói đăng ký",
};
const HERO_CHIP_COLOR_BY_INDEX = ["text-amber-600", "text-emerald-600", "text-indigo-600"] as const;

const toRegisterUrl = (courseSlug: string, language: string) => {
  const qs = new URLSearchParams({ auth: "login", lang: language, course: courseSlug });
  return `/?${qs.toString()}`;
};

const buildQrUrl = (bankCode: string, accountNumber: string, amount: number, content: string, accountName: string) => {
  const qs = new URLSearchParams({
    amount: String(Math.max(0, amount || 0)),
    addInfo: content,
    accountName,
  });
  return `https://img.vietqr.io/image/${encodeURIComponent(bankCode)}-${encodeURIComponent(accountNumber)}-compact2.png?${qs.toString()}`;
};


const SWEET_ALERT_DIALOG_CLASS = {
  popup: "!rounded-3xl !border !border-slate-200 !bg-white !shadow-2xl !p-0 !overflow-hidden",
  title: "!px-6 !pt-6 !pb-2 !m-0 !text-xl !font-extrabold !text-slate-900",
  htmlContainer: "!px-6 !pb-2 !m-0 !text-sm !leading-relaxed !text-slate-600 !whitespace-pre-line",
  actions: "!w-full !m-0 !px-6 !pb-6 !pt-2 !gap-2",
  confirmButton: "btn btn-primary hover:text-purple-800 !m-0",
  cancelButton: "btn !m-0",
  denyButton: "btn !m-0",
} as const;

const SWEET_ALERT_TOAST_CLASS = {
  popup: "!rounded-2xl !border !border-slate-200 !bg-white !text-slate-900 !shadow-xl",
  title: "!text-sm !font-extrabold !m-0",
  timerProgressBar: "!bg-indigo-500",
} as const;

const getSwal = (): SwalLike | null => {
  const maybeSwal = (window as any)?.Swal;
  if (!maybeSwal || typeof maybeSwal.fire !== "function" || typeof maybeSwal.mixin !== "function") {
    return null;
  }
  return maybeSwal as SwalLike;
};

const getDialogSwal = () => {
  const swal = getSwal();
  if (!swal) return null;
  return swal.mixin({
    buttonsStyling: false,
    customClass: SWEET_ALERT_DIALOG_CLASS,
  });
};

const getToastSwal = () => {
  const swal = getSwal();
  if (!swal) return null;
  return swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 2200,
    timerProgressBar: true,
    customClass: SWEET_ALERT_TOAST_CLASS,
  });
};

async function showNotify(message: string, icon: SwalIcon = "info", title = defaultCmsData.notifyTitle) {
  const dialog = getDialogSwal();
  if (!dialog) {
    window.alert(message);
    return;
  }

  await dialog.fire({
    icon,
    title,
    text: message,
    confirmButtonText: defaultCmsData.notifyCloseBtn,
  });
}

async function showToast(message: string, icon: SwalIcon = "success") {
  const toast = getToastSwal();
  if (!toast) {
    window.alert(message);
    return;
  }

  await toast.fire({
    icon,
    title: message,
  });
}

async function askConfirm(
    message: string,
    options?: {
      title?: string;
      icon?: SwalIcon;
      confirmText?: string;
      cancelText?: string;
    },
) {
  const dialog = getDialogSwal();
  if (!dialog) return window.confirm(message);

  const result = await dialog.fire({
    title: options?.title || defaultCmsData.confirmTitle,
    text: message,
    icon: options?.icon || "question",
    showCancelButton: true,
    reverseButtons: true,
    focusCancel: true,
    confirmButtonText: options?.confirmText || defaultCmsData.confirmOkBtn,
    cancelButtonText: options?.cancelText || defaultCmsData.confirmCancelBtn,
  });

  return Boolean(result?.isConfirmed);
}

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
                {`${course.time || course.hours || "-"} ${cms.courseHourSuffix}`}
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
                  onClick={() => {
                    void showToast(cms.alertCheckout, "info");
                  }}
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
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState<"all" | number>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [totalCourses, setTotalCourses] = useState(0);
  const [courses, setCourses] = useState<Course[]>([]);
  const [topicOptions, setTopicOptions] = useState<ApiTopicOption[]>([]);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderingId, setOrderingId] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrData, setQrData] = useState<{ bankCode: string; accountNumber: string; accountName: string; content: string; amount: number } | null>(null);

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
            slug: item.slug || String(item.id),
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
    void showToast(tpl(cms.alertAddedToCart, { id }), "success");
  }

  function removeFromCart(id: string) {
    const next = removeCourseFromCart(id);
    setCartIds(next);
  }

  async function clearCart() {
    const accepted = await askConfirm(cms.confirmClearCart, {
      title: cms.clearCartConfirmTitle,
      icon: "warning",
      confirmText: cms.clearCartConfirmOkBtn,
      cancelText: cms.clearCartConfirmCancelBtn,
    });
    if (!accepted) return;
    const next = clearCourseCart();
    setCartIds(next);
    await showToast(cms.alertCartCleared, "success");
  }

  function reset() {
    setQ("");
    setTopic("all");
    setPage(1);
  }

  function pickPassToSpend(passes: MyCoursePass[]) {
    return [...passes].sort((a, b) => {
      const aGrace = new Date(a.graceUntil).getTime();
      const bGrace = new Date(b.graceUntil).getTime();
      if (aGrace !== bGrace) return aGrace - bGrace;

      const aEnd = new Date(a.endAt).getTime();
      const bEnd = new Date(b.endAt).getTime();
      if (aEnd !== bEnd) return aEnd - bEnd;

      return a.id - b.id;
    })[0];
  }

  async function listUnlockablePasses() {
    const { data } = await http.get<MyCoursePass[]>("/me/course-passes");
    const rows = Array.isArray(data) ? data : [];
    return rows.filter((row) => {
      const status = row.computedStatus || "EXPIRED";
      return (status === "ACTIVE" || status === "GRACE") && Number(row.remainingUnlocks || 0) > 0;
    });
  }

  async function registerDirectPurchase(c: Course) {
    const res = await http.post<SepayOrderResponse>(`/courses/${c.id}/order`);
    const payload = res.data || {};

    if (payload.mode === "FREE" || payload.enrolled) {
      await showNotify(cms.alertRegisterSuccess, "success", cms.successTitle);
      return;
    }

    const bankCode = payload.payment?.bank?.gateway || "BIDV";
    const accountNumber = payload.payment?.bank?.accountNumber || "8810091561";
    const accountName = payload.payment?.bank?.accountName || "LE MINH HIEU";
    const content = payload.payment?.transferContent || "";
    const amount = Number(payload.total || c.price || 0);

    if (!content) {
      await showNotify(cms.alertQrMissingInfo, "error", cms.qrErrorTitle);
      return;
    }

    setQrData({ bankCode, accountNumber, accountName, content, amount });
    setQrOpen(true);
  }

  async function unlockWithPass(c: Course) {
    const { data } = await http.post<UnlockCourseResponse>(`/me/courses/${c.id}/unlock`, {});
    const payload = data || {};

    if (payload.alreadyEntitled) {
      await showNotify(cms.alertAlreadyEntitled, "info");
      return;
    }

    const planName = payload.pass?.plan?.name || payload.pass?.plan?.code || cms.passLabelFallback;
    const remaining = payload.pass?.remainingUnlocks;

    if (payload.alreadyUnlocked) {
      if (typeof remaining === "number") {
        await showNotify(tpl(cms.alertAlreadyUnlockedWithQuota, { remaining }), "info");
      } else {
        await showNotify(cms.alertAlreadyUnlocked, "info");
      }
      return;
    }

    if (typeof remaining === "number") {
      await showNotify(tpl(cms.alertUnlockSuccessWithQuota, { planName, remaining }), "success", cms.successTitle);
      return;
    }

    await showNotify(cms.alertUnlockSuccess, "success", cms.successTitle);
  }

  async function registerCourse(c: Course) {
    const token = localStorage.getItem("aya_access_token");
    if (!token) {
      navigate(toRegisterUrl((c as any).slug || c.id, currentLanguage));
      return;
    }

    try {
      setOrderingId(c.id);

      let unlockablePasses: MyCoursePass[] = [];
      try {
        unlockablePasses = await listUnlockablePasses();
      } catch {
        unlockablePasses = [];
      }

      if (unlockablePasses.length > 0) {
        const selectedPass = pickPassToSpend(unlockablePasses);
        const passLabel = selectedPass?.plan?.name || selectedPass?.plan?.code || cms.passLabelFallback;
        const passExpire = selectedPass?.graceUntil
            ? new Date(selectedPass.graceUntil).toLocaleDateString("vi-VN")
            : "-";
        const passQuota = Number(selectedPass?.remainingUnlocks || 0);

        const dialog = getDialogSwal();

        if (dialog) {
          const decision = await dialog.fire({
            title: cms.alertHavePassTitle,
            text: tpl(cms.alertHavePassConfirm, { passLabel, passQuota, passExpire }),
            icon: "question",
            // showCancelButton: true,
            showDenyButton: true,
            reverseButtons: true,
            focusCancel: true,
            confirmButtonText: cms.alertHavePassConfirmBtn,
            denyButtonText: cms.alertHavePassCancelBtn,
            cancelButtonText: cms.notifyCloseBtn,
            denyButtonClassName: "btn",
          });

          if (decision.isConfirmed) {
            await unlockWithPass(c);
            return;
          }

          if (decision.isDenied) {
            await registerDirectPurchase(c);
          }

          return;
        }

        const usePlanUnlock = await askConfirm(
            tpl(cms.alertHavePassConfirm, { passLabel, passQuota, passExpire }),
            {
              title: cms.alertHavePassTitle,
              icon: "question",
              confirmText: cms.alertHavePassConfirmBtn,
              cancelText: cms.alertHavePassCancelBtn,
            },
        );

        if (usePlanUnlock) {
          await unlockWithPass(c);
          return;
        }

        return;
      }

      await registerDirectPurchase(c);
    } catch (error: any) {
      if (error?.response?.status === 401) {
        navigate(toRegisterUrl((c as any).slug || c.id, currentLanguage));
        return;
      }
      await showNotify(error?.response?.data?.message || cms.alertRegisterFailed, "error", cms.registerFailedTitle);
    } finally {
      setOrderingId(null);
    }
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
                    <button className="btn" type="button" onClick={reset} aria-label={cms.filterResetAria}>
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
                    <label className="text-sm font-extrabold text-slate-700">{cms.pageSizeLabel}</label>
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
                                <span className="text-sm font-bold text-slate-600">{`${c.time || c.hours || "-"} ${cms.courseHourSuffix}`}</span>
                              </div>

                              <h3 className="mt-3 text-lg font-extrabold line-clamp-1">
                                {c.title}
                              </h3>

                              <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                                {c.desc}
                              </p>

                              <div className="mt-3 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 text-slate-600 text-sm">
                                  <Stars rating={c.rating} /> <b>{c.rating.toFixed(1)}</b>
                                </div>
                                <div className="font-extrabold text-indigo-700">{money(c.price)}</div>
                              </div>

                              <div className="mt-4 grid grid-cols-2 gap-2">
                                <button className="btn text-sm" type="button" onClick={() => navigate(`/courses/${encodeURIComponent((c as any).slug || c.id)}`)}>
                                  <i className="fa-solid fa-eye" /> {cms.viewDetailBtn}
                                </button>
                                <button className="btn btn-primary text-sm hover:text-purple-800" type="button" onClick={() => registerCourse(c)} disabled={orderingId === c.id}>
                                  <i className="fa-solid fa-user-plus" /> {orderingId === c.id ? cms.registerLoadingBtn : cms.registerBtn}
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
                  <button className="btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>{cms.paginationPrevBtn}</button>
                  <span className="text-sm text-slate-600">{tpl(cms.paginationInfoText, { page, totalPages })}</span>
                  <button className="btn" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>{cms.paginationNextBtn}</button>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/*<Footer />*/}


        <CourseCartModal
            open={cartOpen}
            onClose={() => setCartOpen(false)}
            items={cartItems}
            onRemove={removeFromCart}
            onClear={clearCart}
            cms={cms}
        />

        {qrOpen && qrData ? (
            <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4" onMouseDown={(e) => {
              if (e.target === e.currentTarget) setQrOpen(false);
            }}>
              <div className="card w-full max-w-md p-5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-extrabold">{cms.qrModalTitle}</h3>
                  <button className="btn h-9 w-9 p-0" onClick={() => setQrOpen(false)} type="button">✕</button>
                </div>
                <img
                    className="mt-4 w-full rounded-2xl ring-1 ring-slate-200"
                    src={buildQrUrl(qrData.bankCode, qrData.accountNumber, qrData.amount, qrData.content, qrData.accountName)}
                    alt={cms.qrModalImageAlt}
                />
                <div className="mt-4 space-y-2 text-sm">
                  <p><b>{cms.qrModalBankLabel}</b> {qrData.bankCode}</p>
                  <p><b>{cms.qrModalAccountNumberLabel}</b> {qrData.accountNumber}</p>
                  <p><b>{cms.qrModalAccountNameLabel}</b> {qrData.accountName}</p>
                  <p><b>{cms.qrModalAmountLabel}</b> {money(qrData.amount)}</p>
                  <p><b>{cms.qrModalTransferContentLabel}</b> <span className="font-mono">{qrData.content}</span></p>
                </div>
              </div>
            </div>
        ) : null}
      </div>
  );
}

