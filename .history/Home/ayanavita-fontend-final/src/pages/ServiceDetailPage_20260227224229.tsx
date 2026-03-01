import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { ParticlesBackground } from "../components/layout/ParticlesBackground";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";

import { AuthModal } from "../components/home/AuthModal";
import { SuccessModal } from "../components/home/SuccessModal";

import { http } from "../api/http";
import { isValidPhone, money, toISODate } from "../services/booking.utils";

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

type AuthTab = "login" | "register";

type ToastState =
  | { type: "success"; message: string }
  | { type: "error"; message: string }
  | null;

type BranchOption = {
  id: number;
  name: string;
  address?: string;
};

type ServiceReview = {
  id: number;
  stars: number;
  comment?: string | null;
  customerName?: string | null;
};

type ServiceDetail = {
  id: number;
  name: string;
  description?: string | null;
  goals: string[];
  suitableFor: string[];
  process: string[];
  durationMin: number;
  price: number;
  ratingAvg: number;
  bookedCount: number;
  imageUrl?: string | null;
  branchIds: number[];
  reviews: ServiceReview[];
};

type PreferredLanguage = "vi" | "en" | "de";

function getPreferredLanguage(): PreferredLanguage {
  if (typeof window === "undefined") return "vi";

  const raw = window.localStorage.getItem("preferred-language")?.trim().toLowerCase();
  if (raw === "en") return "en";
  if (raw === "de") return "de";
  return "vi";
}


function usePreferredLanguage() {
  const [preferredLanguage, setPreferredLanguage] = useState<PreferredLanguage>(() => getPreferredLanguage());


  useEffect(() => {
    const syncPreferredLanguage = () => setPreferredLanguage(getPreferredLanguage());

    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== "preferred-language") return;
      syncPreferredLanguage();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("preferred-language-changed", syncPreferredLanguage);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("preferred-language-changed", syncPreferredLanguage);
    };
  }, []);

  return preferredLanguage;
}

export default function ServiceDetailPage() {
  const { serviceId } = useParams();
  const preferredLanguage = usePreferredLanguage();

  const [service, setService] = useState<ServiceDetail | null>(null);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");



  const [name, setName] = useState("Khách hàng Demo");
  const [phone, setPhone] = useState("0900000000");
  const [email, setEmail] = useState("");
  const [date, setDate] = useState(() => toISODate(new Date()));
  const [time, setTime] = useState("09:00");
  const [note, setNote] = useState("");
  const [branchId, setBranchId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState<ToastState>(null);
  const todayISO = useMemo(() => toISODate(new Date()), []);

  useEffect(() => {
    const id = Number(serviceId);
    if (!Number.isInteger(id) || id < 1) {
      setError("Mã dịch vụ không hợp lệ.");
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError("");

    (async () => {
      try {
        const [{ data: detail }, { data: branchRows }] = await Promise.all([
          http.get(`/booking/services/${id}`, { params: { lang: preferredLanguage } }),
          http.get("/booking/branches", { params: { serviceId: id, lang: preferredLanguage } }),
        ]);
        if (!mounted) return;

        setService(detail);
        const normalizedBranches = Array.isArray(branchRows)
          ? branchRows.map((item: any) => ({ id: item.id, name: item.name, address: item.address }))
          : [];
        setBranches(normalizedBranches);
        setBranchId(normalizedBranches[0] ? String(normalizedBranches[0].id) : "");
      } catch {
        if (!mounted) return;
        setError("Không thể tải dữ liệu dịch vụ. Vui lòng thử lại.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [serviceId, preferredLanguage]);

  function showToast(t: ToastState) {
    setToast(t);
    if (!t) return;
    window.setTimeout(() => setToast(null), 4500);
  }

  async function submitBooking() {
    if (!service) return;

    const n = name.trim();
    const p = phone.trim();
    const e = email.trim();
    const d = date.trim();
    const t = time.trim();
    const selectedBranch = branches.find((item) => String(item.id) === branchId);

    if (!n) return showToast({ type: "error", message: "Vui lòng nhập Họ và tên." });
    if (!isValidPhone(p)) {
      return showToast({ type: "error", message: "SĐT chưa đúng (bắt đầu 0, đủ 10–11 số)." });
    }
    if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      return showToast({ type: "error", message: "Email chưa đúng định dạng." });
    }
    if (!d) return showToast({ type: "error", message: "Vui lòng chọn Ngày." });
    if (d < todayISO) return showToast({ type: "error", message: "Ngày đặt phải >= hôm nay." });
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(t)) {
      return showToast({ type: "error", message: "Giờ hẹn chưa đúng định dạng HH:mm." });
    }
    if (!branchId || !selectedBranch) {
      return showToast({ type: "error", message: "Vui lòng chọn chi nhánh để đặt lịch." });
    }

    setSubmitting(true);
    try {
      const slotData = await http.get("/booking/slot-suggestions", {
        params: {
          branchId: Number(branchId),
          serviceId: service.id,
          date: d,
          lang: preferredLanguage,
        },
      });

      const matchedSlot = (slotData.data?.slots || []).find((item: any) => item.time === t);
      if (matchedSlot && !matchedSlot.available) {
        return showToast({
          type: "error",
          message: `Khung giờ ${t} tại ${selectedBranch.name} đã hết chỗ. Vui lòng chọn giờ khác.`,
        });
      }

      await http.post("/booking/appointments", {
        customerName: n,
        customerPhone: p,
        customerEmail: e || undefined,
        appointmentAt: `${d}T${t}:00`,
        note: note.trim() || undefined,
        branchId: Number(branchId),
        serviceId: service.id,
        lang: preferredLanguage,
      });

      const msg =
        `Đặt lịch thành công.\n` +
        `- Dịch vụ: ${service.name} (#${service.id})\n` +
        `- Chi nhánh: ${selectedBranch.name}${selectedBranch.address ? ` - ${selectedBranch.address}` : ""}\n` +
        `- Ngày: ${d} • Giờ: ${t}\n` +
        `- SĐT: ${p}${e ? ` • Email: ${e}` : ""}\n` +
        `- Ghi chú: ${note.trim() || "(không)"}`;

      showToast({ type: "success", message: msg });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      showToast({
        type: "error",
        message: err?.response?.data?.message || "Không thể tạo lịch hẹn. Vui lòng kiểm tra lại thông tin và thử lại.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-slate-50 text-slate-900">

      <div className="page-content">
        <main className="px-4 pb-10">
          {loading ? <div className="max-w-6xl mx-auto text-sm text-slate-500">Đang tải chi tiết dịch vụ...</div> : null}
          {error ? <div className="max-w-6xl mx-auto text-sm text-rose-600">{error}</div> : null}

          {service ? (
            <div className="max-w-6xl mx-auto grid gap-4 lg:grid-cols-3">
              <section className="card overflow-hidden lg:col-span-2">
                <div className="relative">
                  <img
                    className="h-64 w-full object-cover"
                    alt="detail"
                    src={service.imageUrl || "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1600&q=70"}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950/55 to-indigo-700/10" />
                  <div className="absolute inset-0 p-6 flex flex-col justify-end">
                    <div className="text-xs font-extrabold text-white/80">Chi tiết dịch vụ</div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                      {service.name} (#{service.id})
                    </h1>
                    <div className="mt-2 flex gap-2 flex-wrap">
                      <span className="chip"><i className="fa-solid fa-clock text-indigo-600" />{service.durationMin} phút</span>
                      <span className="chip">
                        <i className="fa-solid fa-star star" />
                        {service.ratingAvg.toFixed(1)} ({new Intl.NumberFormat("vi-VN").format(service.bookedCount)} lượt)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5 grid gap-4 md:grid-cols-3">
                  <div className="card p-4">
                    <div className="text-xs font-extrabold text-slate-500">Giá niêm yết</div>
                    <div className="text-2xl font-extrabold mt-1">{money(service.price)}</div>
                    <Link to={`/booking?serviceId=${service.id}`} className="btn btn-primary w-full mt-3"><i className="fa-solid fa-calendar-check" />Đặt lịch</Link>
                    <Link to="/services" className="btn w-full mt-2"><i className="fa-solid fa-arrow-left" />Danh sách</Link>
                  </div>

                  <div className="card p-4 md:col-span-2">
                    <div className="font-extrabold">Mục tiêu &amp; Lợi ích</div>
                    <ul className="mt-2 text-sm text-slate-700 space-y-2">
                      {service.goals.length ? service.goals.map((goal, idx) => (
                        <li key={idx} className="flex gap-2"><span className="text-emerald-600 font-extrabold">•</span>{goal}</li>
                      )) : <li>Đang cập nhật.</li>}
                    </ul>

                  </div>
                </div>

                <div className="px-5 pb-5 grid gap-4 lg:grid-cols-2">
                  <div className="card p-5">
                    <div className="font-extrabold">Quy trình</div>
                    <ol className="mt-3 text-sm text-slate-700 space-y-2">
                      {service.process.length ? service.process.map((p, idx) => (
                        <li key={idx}><b>{idx + 1})</b> {p}</li>
                      )) : <li>Đang cập nhật.</li>}
                    </ol>
                  </div>

                  <div className="card p-5">
                    <div className="font-extrabold">Dành cho ai?</div>
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {service.suitableFor.length ? service.suitableFor.map((label, idx) => (
                        <span key={idx} className="chip"><i className="fa-solid fa-user-check text-amber-600" />{label}</span>
                      )) : <span className="text-sm muted">Đang cập nhật.</span>}
                    </div>
                    <div className="font-extrabold mt-2">Mô tả: </div>
                    {service.description ? <div className="mt-1 text-sm">{service.description}</div> : null}
                  </div>
                </div>

                <div className="mx-5 mb-5 card p-5">
                  <div className="font-extrabold">Đánh giá khách hàng</div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {service.reviews.length ? service.reviews.map((r) => (
                      <div key={r.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                        <div className="flex items-center justify-between">
                          <div className="font-extrabold">{r.customerName || "Khách hàng"}</div>
                          <div className="text-sm"><i className="fa-solid fa-star star" /> {r.stars.toFixed(1)}</div>
                        </div>
                        <div className="text-sm text-slate-700 mt-2">{r.comment || "Khách hàng chưa để lại nhận xét."}</div>
                      </div>
                    )) : <div className="text-sm muted">Chưa có đánh giá cho dịch vụ này.</div>}
                  </div>
                </div>
              </section>

              <aside className="card p-6">
                <div className="font-extrabold">Đặt lịch nhanh</div>
                <div className="text-sm muted mt-1">Nhập nhanh như form đặt lịch: không cần chọn dịch vụ, hệ thống dùng dịch vụ đang xem.</div>

                <div className="mt-3 grid gap-2">
                  <input className="field" value={service.name} readOnly />
                  <input className="field" placeholder="Họ và tên" value={name} onChange={(e) => setName(e.target.value)} />
                  <input className="field" placeholder="Số điện thoại" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  <input className="field" type="email" placeholder="Email (không bắt buộc)" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <select className="field" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                    <option value="">Chọn chi nhánh</option>
                    {branches.map((item) => <option key={item.id} value={String(item.id)}>{item.name}</option>)}
                  </select>
                  <input className="field" type="date" value={date} min={todayISO} onChange={(e) => setDate(e.target.value)} />
                  <input className="field" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                  <textarea className="field" rows={4} placeholder="Ghi chú (tình trạng da, dị ứng...)" value={note} onChange={(e) => setNote(e.target.value)} />
                  <button onClick={submitBooking} className="btn btn-primary" type="button" disabled={submitting || !service}>
                    <i className="fa-solid fa-calendar-check" />
                    {submitting ? "Đang đặt lịch..." : "Xác nhận đặt"}
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
              </aside>
            </div>
          ) : null}
        </main>

      </div>
    </div>
  );
}
