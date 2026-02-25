import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { AuthModal } from "../components/home/AuthModal";
import { SuccessModal } from "../components/home/SuccessModal";

import { BRANCHES, REVIEWS, SLOTS, getServiceById } from "../data/services.data";
import { isValidPhone, money, toISODate } from "../services/booking.utils";
import { http } from "../api/http";               // <-- thêm import http

type AuthTab = "login" | "register";

type ToastState =
    | { type: "success"; message: string }
    | { type: "error"; message: string }
    | null;

/**
 * CMS default (KHÔNG lấy phần data từ DB):
 * - Không include: service.name/id/price/benefits/process/audience... (đến từ services.data)
 * - Chỉ include copy UI tĩnh cho page template
 */
const cmsData = {
  hero: {
    eyebrow: "Chi tiết dịch vụ",
    chips: {
      durationSuffix: "phút",
      ratingBookedLabel: "lượt",
      certifiedProcess: "Quy trình chuẩn",
    },
  },
  pricing: {
    title: "Giá niêm yết",
    includedNote: "Đã bao gồm tư vấn da cơ bản.",
    ctaBooking: "Đặt lịch",
    ctaBackToList: "Danh sách",
  },
  benefits: {
    title: "Mục tiêu & Lợi ích",
  },
  process: {
    title: "Quy trình (chuẩn hoá)",
  },
  audience: {
    title: "Dành cho ai?",
    suitableFor: "Phù hợp cho:",
  },
  hold: {
    title: "Chọn chi nhánh & khung giờ",
    cta: "Giữ chỗ 10 phút (demo)",
    inactive: "Giữ chỗ chưa kích hoạt / đã hết hạn (demo).",
    activePrefix: "Đã giữ chỗ tại",
    activeMiddle: "lúc",
    activeSuffix: "Thời gian còn lại:",
    toastSuccessTemplate: "Đã giữ chỗ tại {branch} lúc {slot} (demo).",
  },
  reviews: {
    title: "Đánh giá khách hàng",
    ctaAll: "Xem tất cả",
  },
  sidebar: {
    title: "Đặt lịch nhanh",
    subtitle: "Nhập thông tin để giữ chỗ (demo).",
    fields: {
      namePlaceholder: "Họ và tên",
      phonePlaceholder: "Số điện thoại",
      notePlaceholder: "Ghi chú (tình trạng da, dị ứng...)",
      submit: "Xác nhận đặt",
    },
    pledge: {
      title: "Cam kết",
      items: ["Quy trình chuẩn hoá", "Sản phẩm rõ nguồn gốc", "Tư vấn trước và sau dịch vụ"],
    },
  },
  booking: {
    validation: {
      missingName: "Vui lòng nhập Họ và tên.",
      invalidPhone: "SĐT chưa đúng (bắt đầu 0, đủ 10–11 số).",
      missingDate: "Vui lòng chọn Ngày.",
      pastDate: "Ngày đặt phải >= hôm nay.",
    },
    success: {
      template:
          "Đặt lịch thành công (demo).\n" +
          "- Dịch vụ: {serviceName} ({serviceId})\n" +
          "- Chi nhánh: {branch}\n" +
          "- Ngày: {date} • Giờ: {slot}\n" +
          "- Ghi chú: {note}\n\n" +
          "Bước sau: nối API Booking + thanh toán đặt cọc nếu cần.",
      emptyNote: "(không)",
    },
  },
  auth: {
    loginSuccess:
        "Đăng nhập thành công (prototype). Sau này bạn sẽ lưu token từ API.",
    registerSuccess:
        "Đăng ký thành công (prototype). Sau này bạn sẽ gọi API tạo user và gửi email xác thực.",
  },
} as const;

type CmsData = typeof cmsData;

export default function ServiceDetailPage() {
  const { serviceId } = useParams(); // /services/:serviceId
  const service = useMemo(() => getServiceById(serviceId), [serviceId]);

  // i18n lang sync + CMS override from API (pattern giống file ServicesPage)
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
    const saved = localStorage.getItem("preferred-language");
    return saved || "vi";
  });
  const [cmsDataApi, setCmsDataApi] = useState<Partial<CmsData> | null>(null);

  // API sẽ ghi đè lên default cmsData
  const cms = useMemo<CmsData>(() => ({
    ...cmsData,
    ...(cmsDataApi || {}),
    hero: { ...cmsData.hero, ...(cmsDataApi?.hero || {}) },
    pricing: { ...cmsData.pricing, ...(cmsDataApi?.pricing || {}) },
    benefits: { ...cmsData.benefits, ...(cmsDataApi?.benefits || {}) },
    process: { ...cmsData.process, ...(cmsDataApi?.process || {}) },
    audience: { ...cmsData.audience, ...(cmsDataApi?.audience || {}) },
    hold: { ...cmsData.hold, ...(cmsDataApi?.hold || {}) },
    reviews: { ...cmsData.reviews, ...(cmsDataApi?.reviews || {}) },
    sidebar: {
      ...cmsData.sidebar,
      ...(cmsDataApi?.sidebar || {}),
      fields: { ...cmsData.sidebar.fields, ...(cmsDataApi?.sidebar?.fields || {}) },
      pledge: {
        ...cmsData.sidebar.pledge,
        ...(cmsDataApi?.sidebar?.pledge || {}),
        items: [...(cmsDataApi?.sidebar?.pledge?.items ?? cmsData.sidebar.pledge.items)],
      },
    },
    booking: {
      ...cmsData.booking,
      ...(cmsDataApi?.booking || {}),
      validation: {
        ...cmsData.booking.validation,
        ...(cmsDataApi?.booking?.validation || {}),
      },
      success: {
        ...cmsData.booking.success,
        ...(cmsDataApi?.booking?.success || {}),
      },
    },
    auth: { ...cmsData.auth, ...(cmsDataApi?.auth || {}) },
  }), [cmsDataApi]);

  // shared auth/success (đồng bộ Home)
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<AuthTab>("login");
  const [success, setSuccess] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });

  const openAuth = useCallback((tab: AuthTab) => {
    setAuthTab(tab);
    setAuthOpen(true);
  }, []);

  const openSuccess = useCallback((message: string) => {
    setSuccess({ open: true, message });
  }, []);

  // Right sidebar form
  const [name, setName] = useState("Khách hàng Demo");
  const [phone, setPhone] = useState("0900000000");
  const [date, setDate] = useState(() => toISODate(new Date()));
  const [note, setNote] = useState("");

  // branch + slot (shared)
  const [branch, setBranch] = useState(BRANCHES[0]);
  const [slot, setSlot] = useState(SLOTS[0]);

  // hold timer
  const [holdLeft, setHoldLeft] = useState<number>(0);
  const holdTimerRef = useRef<number | null>(null);

  const [toast, setToast] = useState<ToastState>(null);

  const todayISO = useMemo(() => toISODate(new Date()), []);

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        window.clearInterval(holdTimerRef.current);
        holdTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const onLanguageChange = (event: any) => {
      const lang = event?.detail?.language;
      if (typeof lang === "string" && lang) setCurrentLanguage(lang);
    };
    window.addEventListener("languageChange", onLanguageChange as EventListener);
    return () => window.removeEventListener("languageChange", onLanguageChange as EventListener);
  }, []);

  // Gọi API lấy CMS – dùng http thay vì fetch (giống ServicesPage)
  useEffect(() => {
    let alive = true;

    async function fetchCms() {
      try {
        // Dùng http client thay vì fetch
        const res = await http.get(`/public/pages/serviceDetail?lang=${currentLanguage}`);
        const data = res.data.sections[0]?.data;
        console.log("CMS data for ServiceDetailPage:", data);
        // hỗ trợ cả 2 dạng response:
        // 1) { cmsData: {...} }
        // 2) { ... }
        const payload = (data?.cmsData ?? data) as Partial<CmsData>;
        if (!alive) return;
        if (payload && typeof payload === "object") setCmsDataApi(payload);
      } catch (error) {
        // Giữ nguyên xử lý lỗi (im lặng) hoặc có thể log
        console.error("Lỗi fetch CMS service detail:", error);
      }
    }

    fetchCms();
    return () => {
      alive = false;
    };
  }, [currentLanguage]);

  function showToast(t: ToastState) {
    setToast(t);
    if (!t) return;
    window.setTimeout(() => setToast(null), 4500);
  }

  function startHold() {
    if (holdTimerRef.current) {
      window.clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    setHoldLeft(10 * 60);
    holdTimerRef.current = window.setInterval(() => {
      setHoldLeft((prev) => {
        if (prev <= 1) {
          if (holdTimerRef.current) {
            window.clearInterval(holdTimerRef.current);
            holdTimerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    showToast({
      type: "success",
      message: cms.hold.toastSuccessTemplate
          .replaceAll("{branch}", branch)
          .replaceAll("{slot}", slot),
    });
  }

  function mmss(sec: number) {
    const mm = String(Math.floor(sec / 60)).padStart(2, "0");
    const ss = String(sec % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }

  function submitBooking() {
    const n = name.trim();
    const p = phone.trim();
    const d = date.trim();

    if (!n) return showToast({ type: "error", message: cms.booking.validation.missingName });
    if (!isValidPhone(p)) return showToast({ type: "error", message: cms.booking.validation.invalidPhone });
    if (!d) return showToast({ type: "error", message: cms.booking.validation.missingDate });
    if (d < todayISO) return showToast({ type: "error", message: cms.booking.validation.pastDate });

    const msg = cms.booking.success.template
        .replaceAll("{serviceName}", service.name)
        .replaceAll("{serviceId}", service.id)
        .replaceAll("{branch}", branch)
        .replaceAll("{date}", d)
        .replaceAll("{slot}", slot)
        .replaceAll("{note}", note.trim() || cms.booking.success.emptyNote);

    showToast({ type: "success", message: msg });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
      <div className="bg-slate-50 text-slate-900">

        <div className="page-content">

          <main className="px-4 pb-10">
            <div className="max-w-6xl mx-auto grid gap-4 lg:grid-cols-3">
              {/* Main */}
              <section className="card overflow-hidden lg:col-span-2">
                {/* Hero */}
                <div className="relative">
                  <img className="h-64 w-full object-cover" alt="detail" src={service.heroImage} />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950/55 to-indigo-700/10" />
                  <div className="absolute inset-0 p-6 flex flex-col justify-end">
                    <div className="text-xs font-extrabold text-white/80">{cms.hero.eyebrow}</div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                      {service.name} ({service.id})
                    </h1>
                    <div className="mt-2 flex gap-2 flex-wrap">
                    <span className="chip">
                      <i className="fa-solid fa-clock text-indigo-600" />
                      {service.duration} {cms.hero.chips.durationSuffix}
                    </span>
                      <span className="chip">
                      <i className="fa-solid fa-star star" />
                        {service.rating.toFixed(1)} (
                        {new Intl.NumberFormat("vi-VN").format(service.booked)} {cms.hero.chips.ratingBookedLabel})
                    </span>
                      <span className="chip">
                      <i className="fa-solid fa-shield-halved text-emerald-600" />
                        {cms.hero.chips.certifiedProcess}
                    </span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Price + Benefits */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="card p-4">
                      <div className="text-xs font-extrabold text-slate-500">{cms.pricing.title}</div>
                      <div className="text-2xl font-extrabold mt-1">{money(service.price)}</div>
                      <div className="text-sm muted mt-1">{cms.pricing.includedNote}</div>

                      <Link to="/booking" className="btn btn-primary hover:text-purple-800 w-full mt-3">
                        <i className="fa-solid fa-calendar-check" />
                        {cms.pricing.ctaBooking}
                      </Link>

                      <Link to="/services" className="btn w-full mt-2">
                        <i className="fa-solid fa-arrow-left" />
                        {cms.pricing.ctaBackToList}
                      </Link>
                    </div>

                    <div className="card p-4 md:col-span-2">
                      <div className="font-extrabold">{cms.benefits.title}</div>
                      <ul className="mt-2 text-sm text-slate-700 space-y-2">
                        {service.benefits.map((b, idx) => (
                            <li key={idx} className="flex gap-2">
                              <span className="text-emerald-600 font-extrabold">•</span>
                              {b}
                            </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Process + Audience + Hold */}
                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    <div className="card p-5">
                      <div className="font-extrabold">{cms.process.title}</div>
                      <ol className="mt-3 text-sm text-slate-700 space-y-2">
                        {service.process.map((p, idx) => (
                            <li key={idx}>
                              <b>{idx + 1})</b> {p}
                            </li>
                        ))}
                      </ol>
                    </div>

                    <div className="card p-5">
                      <div className="font-extrabold">{cms.audience.title}</div>
                      <div className="mt-2 text-sm text-slate-700">{cms.audience.suitableFor}</div>

                      <div className="mt-2 flex gap-2 flex-wrap">
                        {service.audienceChips.map((c, idx) => (
                            <span key={idx} className="chip">
                          <i className={`${c.iconClass} ${c.iconColorClass || "text-amber-600"}`} />
                              {c.label}
                        </span>
                        ))}
                      </div>

                      {service.note ? <div className="mt-3 text-sm muted">{service.note}</div> : null}

                      <div className="mt-4 border-t border-slate-200 pt-4">
                        <div className="font-extrabold">{cms.hold.title}</div>

                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          <select className="field" value={branch} onChange={(e) => setBranch(e.target.value)}>
                            {BRANCHES.map((b) => (
                                <option key={b} value={b}>
                                  {b}
                                </option>
                            ))}
                          </select>

                          <select className="field" value={slot} onChange={(e) => setSlot(e.target.value)}>
                            {SLOTS.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                            ))}
                          </select>
                        </div>

                        <button onClick={startHold} className="btn btn-accent w-full mt-2" type="button">
                          <i className="fa-solid fa-lock" />
                          {cms.hold.cta}
                        </button>

                        <div className="mt-2 text-sm muted">
                          {holdLeft > 0 ? (
                              <>
                                {cms.hold.activePrefix} <b>{branch}</b> {cms.hold.activeMiddle} <b>{slot}</b>. {cms.hold.activeSuffix}{" "}
                                <b>{mmss(holdLeft)}</b> (demo).
                              </>
                          ) : (
                              <>{cms.hold.inactive}</>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reviews */}
                  <div className="mt-5 card p-5">
                    <div className="flex items-center justify-between">
                      <div className="font-extrabold">{cms.reviews.title}</div>
                      <Link to="/reviews" className="btn">
                        <i className="fa-solid fa-star" />
                        {cms.reviews.ctaAll}
                      </Link>
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {REVIEWS.map((r) => (
                          <div key={r.name} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                            <div className="flex items-center justify-between">
                              <div className="font-extrabold">{r.name}</div>
                              <div className="text-sm">
                                <i className="fa-solid fa-star star" /> {r.rating.toFixed(1)}
                              </div>
                            </div>
                            <div className="text-sm text-slate-700 mt-2">{r.text}</div>
                          </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Sidebar */}
              <aside className="card p-6">
                <div className="font-extrabold">{cms.sidebar.title}</div>
                <div className="text-sm muted mt-1">{cms.sidebar.subtitle}</div>

                <div className="mt-3 grid gap-2">
                  <input className="field" placeholder={cms.sidebar.fields.namePlaceholder} value={name} onChange={(e) => setName(e.target.value)} />
                  <input className="field" placeholder={cms.sidebar.fields.phonePlaceholder} value={phone} onChange={(e) => setPhone(e.target.value)} />
                  <input className="field" type="date" value={date} min={todayISO} onChange={(e) => setDate(e.target.value)} />
                  <textarea className="field" rows={4} placeholder={cms.sidebar.fields.notePlaceholder} value={note} onChange={(e) => setNote(e.target.value)} />
                  <button onClick={submitBooking} className="btn btn-primary hover:text-purple-800" type="button">
                    <i className="fa-solid fa-calendar-check" />
                    {cms.sidebar.fields.submit}
                  </button>
                </div>

                {toast ? (
                    <div
                        className={[
                          "mt-4 rounded-2xl p-4 ring-1 text-sm whitespace-pre-line",
                          toast.type === "success"
                              ? "bg-emerald-50 ring-emerald-200 text-emerald-800"
                              : "bg-rose-50 ring-rose-200 text-rose-800",
                        ].join(" ")}
                    >
                      {toast.message}
                    </div>
                ) : null}

                <div className="mt-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 text-sm text-slate-700">
                  <div className="font-extrabold">{cms.sidebar.pledge.title}</div>
                  <ul className="mt-2 space-y-2">
                    {cms.sidebar.pledge.items.map((item, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="text-emerald-600 font-extrabold">•</span>
                          {item}
                        </li>
                    ))}
                  </ul>
                </div>
              </aside>
            </div>
          </main>

        </div>

        <SuccessModal
            open={success.open}
            message={success.message}
            onClose={() => setSuccess({ open: false, message: "" })}
        />

        <AuthModal
            open={authOpen}
            tab={authTab}
            onClose={() => setAuthOpen(false)}
            onSwitchTab={setAuthTab}
            onLoginSuccess={() => {
              setAuthOpen(false);
              openSuccess(cms.auth.loginSuccess);
            }}
            onRegisterSuccess={() => {
              setAuthOpen(false);
              openSuccess(cms.auth.registerSuccess);
            }}
        />
      </div>
  );
}