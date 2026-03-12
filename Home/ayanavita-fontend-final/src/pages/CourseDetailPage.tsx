import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { http } from "../api/http";
import { SiteHeader } from "../components/layout/SiteHeader";

type ModuleItem = { id: number; order: number; title: string; description?: string | null };
type LessonItem = { id: number; order: number; title: string; description?: string | null; modules: ModuleItem[] };
type ReviewItem = {
  id: number;
  stars: number;
  comment?: string | null;
  customerName?: string | null;
  createdAt: string;
};

type CourseDetail = {
  id: number;
  slug: string;
  title: string;
  shortDescription?: string | null;
  description?: string | null;
  time?: string | null;
  thumbnail?: string | null;
  price: number;
  ratingAvg: number;
  ratingCount: number;
  enrollmentCount: number;
  objectives?: string[];
  targetAudience?: string[];
  benefits?: string[];
  topic?: { id: number; name: string } | null;
  lessons: LessonItem[];
  reviews: ReviewItem[];
};

type SepayOrderResponse = {
  id?: number;
  orderId?: number;
  status?: string;
  mode?: string;
  enrolled?: boolean;
  total?: number;
  payment?: {
    provider?: string;
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

type SwalIcon = "success" | "error" | "warning" | "info" | "question";
type SwalResult = {
  isConfirmed?: boolean;
  isDismissed?: boolean;
  dismiss?: string;
};
type SwalLike = {
  fire: (options: Record<string, unknown>) => Promise<SwalResult>;
  mixin: (options: Record<string, unknown>) => SwalLike;
};

type CmsData = {
  registerLabel: Record<string, string>;
  fallbackThumbnail: string;
  fallbackTopicName: string;
  fallbackListItem: string;
  fallbackReviewerName: string;
  qrImageAlt: string;
  buttons: {
    backToCourses: string;
    registerLoading: string;
    close: string;
  };
  labels: {
    hourSuffix: string;
    lessonCount: string;
    moduleCount: string;
    studentCount: string;
    objectives: string;
    targetAudience: string;
    benefits: string;
    courseContent: string;
    courseReviews: string;
    qrTitle: string;
    bank: string;
    accountNumber: string;
    accountName: string;
    amount: string;
    transferContent: string;
    loading: string;
    notFound: string;
    course: string;
    reviewEmpty: string;
    passDetected: string;
    planUnlock: string;
    directQrPayment: string;
    unlockByPlan: string;
    success: string;
    notification: string;
    confirm: string;
    agree: string;
    cancel: string;
    unlockSuccess: string;
    unlockSuccessWithPlan: string;
    unlockPreviously: string;
    unlockPreviouslyWithQuota: string;
    alreadyEntitled: string;
    freeCourseActivated: string;
    qrUnavailable: string;
    orderCreateFailed: string;
    registerFailed: string;
  };
  messages: {
    passSelectionTitle: string;
    passSelectionBody: string;
    passSelectionPlanAction: string;
    passSelectionQrAction: string;
    unlockPreviouslyWithQuota: string;
    unlockSuccessWithQuota: string;
  };
};

type CmsDataOverrides = Partial<Omit<CmsData, "registerLabel" | "buttons" | "labels" | "messages">> & {
  registerLabel?: Partial<CmsData["registerLabel"]>;
  buttons?: Partial<CmsData["buttons"]>;
  labels?: Partial<CmsData["labels"]>;
  messages?: Partial<CmsData["messages"]>;
};

export const defaultCmsData: CmsData = {
  registerLabel: {
    vi: "Đăng ký",
    en: "Register",
    de: "Registrieren",
  },
  fallbackThumbnail:
      "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=1600&q=80",
  fallbackTopicName: "Khóa học",
  fallbackListItem: "-",
  fallbackReviewerName: "Học viên",
  qrImageAlt: "Mã QR SePay",
  buttons: {
    backToCourses: "Khóa học",
    registerLoading: "Đang tạo mã QR...",
    close: "Đóng",
  },
  labels: {
    hourSuffix: "giờ",
    lessonCount: "bài học",
    moduleCount: "phần nội dung",
    studentCount: "học viên",
    objectives: "Mục tiêu",
    targetAudience: "Đối tượng",
    benefits: "Lợi ích",
    courseContent: "Nội dung khóa học",
    courseReviews: "Đánh giá khóa học",
    qrTitle: "Quét QR để thanh toán",
    bank: "Ngân hàng",
    accountNumber: "Số tài khoản",
    accountName: "Chủ tài khoản",
    amount: "Số tiền",
    transferContent: "Nội dung chuyển khoản",
    loading: "Đang tải...",
    notFound: "Không tìm thấy khóa học.",
    course: "Khóa học",
    reviewEmpty: "Chưa có đánh giá.",
    passDetected: "Phát hiện gói đăng ký",
    planUnlock: "Mở khóa bằng gói",
    directQrPayment: "Thanh toán QR",
    unlockByPlan: "Mở khóa bằng gói",
    success: "Thành công",
    notification: "Thông báo",
    confirm: "Xác nhận",
    agree: "Đồng ý",
    cancel: "Hủy",
    unlockSuccess: "Mở khóa thành công bằng gói đăng ký.",
    unlockSuccessWithPlan: "Đăng ký thành công. Khóa học miễn phí đã được kích hoạt.",
    unlockPreviously: "Khóa học đã được mở khóa trước đó.",
    unlockPreviouslyWithQuota: "Khóa học đã được mở khóa trước đó. Quota còn lại:",
    alreadyEntitled: "Bạn đã có quyền học khóa học này.",
    freeCourseActivated: "Đăng ký thành công. Khóa học miễn phí đã được kích hoạt.",
    qrUnavailable: "Không lấy được thông tin chuyển khoản từ hệ thống.",
    orderCreateFailed: "Không thể tạo đơn đăng ký. Vui lòng thử lại.",
    registerFailed: "Đăng ký thất bại",
  },
  messages: {
    passSelectionTitle: "Bạn đang có {passLabel}",
    passSelectionBody: "Còn {passQuota} lượt, hết hạn {passExpire}.",
    passSelectionPlanAction: 'Chọn "Mở khóa bằng gói" để trừ 1 lượt.',
    passSelectionQrAction: 'Chọn "Thanh toán QR" để mua trực tiếp.',
    unlockPreviouslyWithQuota: "Khóa học đã được mở khóa trước đó. Quota còn lại: {remaining}.",
    unlockSuccessWithQuota: "Mở khóa thành công bằng {planName}. Quota còn lại: {remaining}.",
  },
};

const money = (n: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);

const mergeCmsData = (base: CmsData, patch?: CmsDataOverrides): CmsData => ({
  ...base,
  ...(patch || {}),
  registerLabel: {
    ...base.registerLabel,
    ...(patch?.registerLabel || {}),
  },
  buttons: {
    ...base.buttons,
    ...(patch?.buttons || {}),
  },
  labels: {
    ...base.labels,
    ...(patch?.labels || {}),
  },
  messages: {
    ...base.messages,
    ...(patch?.messages || {}),
  },
});

const formatHour = (value: string | null | undefined, cms: CmsData) => {
  if (!value) return cms.fallbackListItem;
  const n = Number(String(value).replace(/[^0-9.]/g, ""));
  if (Number.isFinite(n) && n > 0) return `${n} ${cms.labels.hourSuffix}`;
  return `${value} ${cms.labels.hourSuffix}`;
};

const normalizeList = (value?: string[] | null) =>
    Array.isArray(value)
        ? value.map((item) => String(item || "").trim()).filter((item) => item.length > 0)
        : [];

const fillTemplate = (template: string, values: Record<string, string | number>) =>
    String(template || "").replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""));

const formatPassSelectionMessage = (cms: CmsData, params: { passLabel: string; passQuota: number; passExpire: string }) =>
    [
      fillTemplate(cms.messages.passSelectionTitle, { passLabel: params.passLabel }),
      fillTemplate(cms.messages.passSelectionBody, {
        passQuota: params.passQuota,
        passExpire: params.passExpire,
      }),
      cms.messages.passSelectionPlanAction,
      cms.messages.passSelectionQrAction,
    ]
        .filter(Boolean)
        .join("\n");

const formatUnlockPreviouslyWithQuotaMessage = (cms: CmsData, remaining: number) =>
    fillTemplate(cms.messages.unlockPreviouslyWithQuota, { remaining });

const formatUnlockSuccessWithQuotaMessage = (cms: CmsData, planName: string, remaining: number) =>
    fillTemplate(cms.messages.unlockSuccessWithQuota, { planName, remaining });

function buildQrUrl(bankCode: string, accountNumber: string, amount: number, content: string, accountName: string) {
  const qs = new URLSearchParams({
    amount: String(Math.max(0, amount || 0)),
    addInfo: content,
    accountName,
  });
  return `https://img.vietqr.io/image/${encodeURIComponent(bankCode)}-${encodeURIComponent(accountNumber)}-compact2.png?${qs.toString()}`;
}

const SWEET_ALERT_DIALOG_CLASS = {
  popup: "!rounded-3xl !border !border-slate-200 !bg-white !shadow-2xl !p-0 !overflow-hidden",
  title: "!px-6 !pt-6 !pb-2 !m-0 !text-xl !font-extrabold !text-slate-900",
  htmlContainer: "!px-6 !pb-2 !m-0 !text-sm !leading-relaxed !text-slate-600 !whitespace-pre-line",
  actions: "!w-full !m-0 !px-6 !pb-6 !pt-2 !gap-2",
  confirmButton: "btn btn-primary hover:text-purple-800 !m-0",
  cancelButton: "btn !m-0",
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

async function showNotify(message: string, icon: SwalIcon = "info", title = defaultCmsData.labels.notification, cms: CmsData = defaultCmsData) {
  const dialog = getDialogSwal();
  if (!dialog) {
    window.alert(message);
    return;
  }

  await dialog.fire({
    icon,
    title,
    text: message,
    confirmButtonText: cms.buttons.close,
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
    cms: CmsData = defaultCmsData,
): Promise<"confirm" | "cancel" | "dismiss"> {
  const dialog = getDialogSwal();
  if (!dialog) return window.confirm(message) ? "confirm" : "cancel";

  const result = await dialog.fire({
    title: options?.title || cms.labels.confirm,
    text: message,
    icon: options?.icon || "question",
    showCancelButton: true,
    reverseButtons: true,
    focusCancel: true,
    confirmButtonText: options?.confirmText || cms.labels.agree,
    cancelButtonText: options?.cancelText || cms.labels.cancel,
  });

  if (result?.isConfirmed) return "confirm";
  if (result?.dismiss === "cancel") return "cancel";
  return "dismiss";
}

export default function CourseDetailPage({ cmsData }: { cmsData?: CmsDataOverrides }) {
  const { slug = "" } = useParams<{ slug: string }>();
  const nav = useNavigate();

  const [currentLanguage, setCurrentLanguage] = useState(() => localStorage.getItem("preferred-language") || "vi");
  const [cmsDataState, setCmsDataState] = useState<CmsDataOverrides>(() => cmsData || {});
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrData, setQrData] = useState<{ bankCode: string; accountNumber: string; accountName: string; content: string; amount: number } | null>(null);
  const cms = useMemo(() => mergeCmsData(defaultCmsData, cmsDataState), [cmsDataState]);

  useEffect(() => {
    const onLangChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ language?: string }>;
      if (customEvent.detail?.language) setCurrentLanguage(customEvent.detail.language);
    };
    window.addEventListener("languageChange", onLangChange as EventListener);
    return () => window.removeEventListener("languageChange", onLangChange as EventListener);
  }, []);
  useEffect(() => {
    setCmsDataState(cmsData || {});
  }, [cmsData]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await http.get(`/public/pages/courseDetail?lang=${currentLanguage}`);
        const remoteCms = res.data?.sections?.[0]?.data;
        if (!cancelled && remoteCms && typeof remoteCms === "object") {
          setCmsDataState((prev) => ({ ...prev, ...(remoteCms as CmsDataOverrides) }));
        }
      } catch (err) {
        console.error("Fetch course detail CMS failed:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentLanguage]);

  useEffect(() => {
    let cancelled = false;
    if (!slug) return;

    (async () => {
      setLoading(true);
      try {
        const res = await http.get(`/public/courses/slug/${encodeURIComponent(slug)}`, { params: { lang: currentLanguage } });
        if (!cancelled) setCourse(res.data);
      } catch {
        if (!cancelled) setCourse(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug, currentLanguage]);

  const totalModules = useMemo(
      () => (course?.lessons || []).reduce((sum, lesson) => sum + lesson.modules.length, 0),
      [course?.lessons],
  );

  const objectives = useMemo(() => normalizeList(course?.objectives), [course?.objectives]);
  const targetAudience = useMemo(() => normalizeList(course?.targetAudience), [course?.targetAudience]);
  const benefits = useMemo(() => normalizeList(course?.benefits), [course?.benefits]);

  const thumbnail = course?.thumbnail || cms.fallbackThumbnail;

  const pickPassToSpend = (passes: MyCoursePass[]) => {
    return [...passes].sort((a, b) => {
      const aGrace = new Date(a.graceUntil).getTime();
      const bGrace = new Date(b.graceUntil).getTime();
      if (aGrace !== bGrace) return aGrace - bGrace;

      const aEnd = new Date(a.endAt).getTime();
      const bEnd = new Date(b.endAt).getTime();
      if (aEnd !== bEnd) return aEnd - bEnd;

      return a.id - b.id;
    })[0];
  };

  const listUnlockablePasses = async () => {
    const { data } = await http.get<MyCoursePass[]>("/me/course-passes");
    const rows = Array.isArray(data) ? data : [];
    return rows.filter((row) => {
      const status = row.computedStatus || "EXPIRED";
      return (status === "ACTIVE" || status === "GRACE") && Number(row.remainingUnlocks || 0) > 0;
    });
  };

  const registerDirectPurchase = async () => {
    if (!course) return;

    const res = await http.post<SepayOrderResponse>(`/courses/${course.id}/order`);
    const payload = res.data || {};

    if (payload.mode === "FREE" || payload.enrolled) {
      await showNotify(cms.labels.freeCourseActivated, "success", cms.labels.success, cms);
      return;
    }

    const bankCode = payload.payment?.bank?.gateway || "BIDV";
    const accountNumber = payload.payment?.bank?.accountNumber || "8810091561";
    const accountName = payload.payment?.bank?.accountName || "LE MINH HIEU";
    const content = payload.payment?.transferContent || "";
    const amount = Number(payload.total || course.price || 0);

    if (!content) {
      await showNotify(cms.labels.qrUnavailable, "error", "Không thể tạo QR", cms);
      return;
    }

    setQrData({ bankCode, accountNumber, accountName, content, amount });
    setQrOpen(true);
  };

  const unlockWithPass = async () => {
    if (!course) return;

    const { data } = await http.post<UnlockCourseResponse>(`/me/courses/${course.id}/unlock`, {});
    const payload = data || {};

    if (payload.alreadyEntitled) {
      await showNotify(cms.labels.alreadyEntitled, "info", cms.labels.notification, cms);
      return;
    }

    const planName = payload.pass?.plan?.name || payload.pass?.plan?.code || "gói đăng ký";
    const remaining = payload.pass?.remainingUnlocks;

    if (payload.alreadyUnlocked) {
      if (typeof remaining === "number") {
        await showNotify(formatUnlockPreviouslyWithQuotaMessage(cms, remaining), "info", cms.labels.notification, cms);
      } else {
        await showNotify(cms.labels.unlockPreviously, "info", cms.labels.notification, cms);
      }
      return;
    }

    if (typeof remaining === "number") {
      await showNotify(
          formatUnlockSuccessWithQuotaMessage(cms, planName, remaining),
          "success",
          cms.labels.success,
      );
      return;
    }

    await showNotify(cms.labels.unlockSuccess, "success", cms.labels.success, cms);
  };

  const onRegister = async () => {
    if (!course) return;
    const token = localStorage.getItem("aya_access_token");
    if (!token) {
      const next = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
      nav(`/login?next=${next}`);
      return;
    }

    try {
      setOrdering(true);

      let unlockablePasses: MyCoursePass[] = [];
      try {
        unlockablePasses = await listUnlockablePasses();
      } catch {
        unlockablePasses = [];
      }

      if (unlockablePasses.length > 0) {
        const selectedPass = pickPassToSpend(unlockablePasses);
        const passLabel = selectedPass?.plan?.name || selectedPass?.plan?.code || "gói đăng ký";
        const passExpire = selectedPass?.graceUntil
            ? new Date(selectedPass.graceUntil).toLocaleDateString("vi-VN")
            : cms.fallbackListItem;
        const passQuota = Number(selectedPass?.remainingUnlocks || 0);

        const registerChoice = await askConfirm(
            formatPassSelectionMessage(cms, { passLabel, passQuota, passExpire }),
            {
              title: cms.labels.passDetected,
              icon: "question",
              confirmText: cms.labels.planUnlock,
              cancelText: cms.labels.directQrPayment,
            },
            cms,
        );

        if (registerChoice === "confirm") {
          await unlockWithPass();
          return;
        }

        if (registerChoice === "dismiss") {
          return;
        }
      }

      await registerDirectPurchase();
    } catch (error: any) {
      if (error?.response?.status === 401) {
        const next = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
        nav(`/login?next=${next}`);
        return;
      }
      await showNotify(
          error?.response?.data?.message || cms.labels.orderCreateFailed,
          "error",
          cms.labels.registerFailed,
      );
    } finally {
      setOrdering(false);
    }
  };

  return (
      <div className="text-slate-900">
        <SiteHeader />
        <main className="px-4 py-8">
          <div className="mx-auto grid max-w-6xl gap-4">
            <button
                className="inline-flex w-fit items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2 font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:scale-[1.02]"
                type="button"
                onClick={() => nav("/courses")}
            >
              <i className="fa-solid fa-arrow-left" />
              {cms.buttons.backToCourses}
            </button>

            {loading ? (
                <div className="card p-8">{cms.labels.loading}</div>
            ) : !course ? (
                <div className="card p-8">{cms.labels.notFound}</div>
            ) : (
                <section className="grid gap-4 lg:grid-cols-10">
                  <div className="grid gap-4 lg:col-span-7">
                    <article className="card p-6">
                      <div className="inline-flex w-fit items-center gap-2 rounded-xl bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
                        <i className="fa-solid fa-layer-group" />
                        {course.topic?.name || cms.fallbackTopicName}
                      </div>
                      <h1 className="mt-3 text-3xl font-extrabold">{course.title}</h1>
                      <p className="mt-2 text-slate-700">{course.shortDescription || course.description}</p>

                      <div className="mt-4 grid gap-4 sm:grid-cols-3">
                        <section className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                          <h3 className="font-bold text-slate-900">{cms.labels.objectives}</h3>
                          <ul className="mt-2 space-y-1 text-sm text-slate-700">
                            {(objectives.length ? objectives : [cms.fallbackListItem]).map((item, index) => (
                                <li key={`objective-${index}`}>{item}</li>
                            ))}
                          </ul>
                        </section>

                        <section className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                          <h3 className="font-bold text-slate-900">{cms.labels.targetAudience}</h3>
                          <ul className="mt-2 space-y-1 text-sm text-slate-700">
                            {(targetAudience.length ? targetAudience : [cms.fallbackListItem]).map((item, index) => (
                                <li key={`audience-${index}`}>{item}</li>
                            ))}
                          </ul>
                        </section>

                        <section className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                          <h3 className="font-bold text-slate-900">{cms.labels.benefits}</h3>
                          <ul className="mt-2 space-y-1 text-sm text-slate-700">
                            {(benefits.length ? benefits : [cms.fallbackListItem]).map((item, index) => (
                                <li key={`benefit-${index}`}>{item}</li>
                            ))}
                          </ul>
                        </section>
                      </div>
                    </article>

                    <article className="card p-6">
                      <h2 className="text-xl font-extrabold">{cms.labels.courseContent}</h2>
                      <p className="mt-2 flex flex-wrap gap-2 text-sm">
                    <span className="inline-flex items-center gap-2 rounded-xl bg-cyan-100 px-3 py-1 font-bold text-cyan-700">
                      <i className="fa-solid fa-book-open" /> {course.lessons.length} {cms.labels.lessonCount}
                    </span>
                        <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-100 px-3 py-1 font-bold text-emerald-700">
                      <i className="fa-solid fa-cubes" /> {totalModules} {cms.labels.moduleCount}
                    </span>
                      </p>

                      <div className="mt-4 grid gap-3">
                        {course.lessons.map((lesson) => (
                            <article key={lesson.id} className="rounded-2xl bg-gradient-to-r from-slate-50 to-indigo-50 p-4 ring-1 ring-indigo-100">
                              <div className="flex items-center gap-2 font-extrabold text-indigo-700">
                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs text-white">{lesson.order + 1}</span>
                                {lesson.title}
                              </div>
                              {lesson.description ? <p className="mt-2 text-sm text-slate-600">{lesson.description}</p> : null}
                              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                                {lesson.modules.map((module) => (
                                    <li key={module.id} className="rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200">
                                      <p className="font-semibold text-slate-900">{module.title}</p>
                                      {module.description ? <p className="mt-1 text-xs text-slate-600">{module.description}</p> : null}
                                    </li>
                                ))}
                              </ul>
                            </article>
                        ))}
                      </div>
                    </article>
                  </div>

                  <aside className="grid gap-4 lg:col-span-3">
                    <article className="card overflow-hidden">
                      <img src={thumbnail} alt={course.title} className="h-48 w-full object-cover" />
                    </article>

                    <article className="card p-5">
                      <div className="text-2xl font-extrabold text-indigo-700">{money(course.price)}</div>
                      <div className="mt-3 grid gap-2 text-sm">
                    <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-100 px-3 py-2 font-bold text-emerald-700">
                      <i className="fa-solid fa-clock" /> {formatHour(course.time, cms)}
                    </span>
                        <span className="inline-flex items-center gap-2 rounded-xl bg-amber-100 px-3 py-2 font-bold text-amber-700">
                      <i className="fa-solid fa-star" /> {course.ratingAvg.toFixed(1)} ({course.ratingCount})
                    </span>
                        <span className="inline-flex items-center gap-2 rounded-xl bg-indigo-100 px-3 py-2 font-bold text-indigo-700">
                      <i className="fa-solid fa-users" /> {course.enrollmentCount} {cms.labels.studentCount}
                    </span>
                      </div>
                      <button
                          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-3 font-extrabold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
                          type="button"
                          onClick={onRegister}
                          disabled={ordering}
                      >
                        <i className="fa-solid fa-bolt" />
                        {ordering ? cms.buttons.registerLoading : cms.registerLabel[currentLanguage] || cms.registerLabel.vi}
                      </button>
                    </article>

                    <article className="card p-5">
                      <h2 className="text-lg font-extrabold">{cms.labels.courseReviews}</h2>
                      <div className="mt-3 grid gap-3">
                        {course.reviews.length ? (
                            course.reviews.slice(0, 3).map((review) => (
                                <article key={review.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                                  <div className="font-bold">{review.customerName || cms.fallbackReviewerName}</div>
                                  <div className="text-sm text-amber-600">{"★".repeat(Math.max(1, Math.min(5, review.stars)))}</div>
                                  <div className="mt-1 text-sm text-slate-700">{review.comment || cms.fallbackListItem}</div>
                                </article>
                            ))
                        ) : (
                            <div className="text-sm text-slate-600">{cms.labels.reviewEmpty}</div>
                        )}
                      </div>
                    </article>
                  </aside>
                </section>
            )}
          </div>
        </main>

        {qrOpen && qrData ? (
            <div
                className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4"
                onMouseDown={(e) => {
                  if (e.target === e.currentTarget) setQrOpen(false);
                }}
            >
              <div className="card w-full max-w-md p-5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-extrabold">{cms.labels.qrTitle}</h3>
                  <button className="btn h-9 w-9 p-0" onClick={() => setQrOpen(false)} type="button">
                    ✕
                  </button>
                </div>
                <img
                    className="mt-4 w-full rounded-2xl ring-1 ring-slate-200"
                    src={buildQrUrl(qrData.bankCode, qrData.accountNumber, qrData.amount, qrData.content, qrData.accountName)}
                    alt={cms.qrImageAlt}
                />
                <div className="mt-4 space-y-2 text-sm">
                  <p>
                    <b>{cms.labels.bank}:</b> {qrData.bankCode}
                  </p>
                  <p>
                    <b>{cms.labels.accountNumber}:</b> {qrData.accountNumber}
                  </p>
                  <p>
                    <b>{cms.labels.accountName}:</b> {qrData.accountName}
                  </p>
                  <p>
                    <b>{cms.labels.amount}:</b> {money(qrData.amount)}
                  </p>
                  <p>
                    <b>{cms.labels.transferContent}:</b> <span className="font-mono">{qrData.content}</span>
                  </p>
                </div>
              </div>
            </div>
        ) : null}
      </div>
  );
}

