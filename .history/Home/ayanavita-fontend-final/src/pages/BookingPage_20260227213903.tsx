// src/pages/BookingPage.tsx
import React from "react";
import { useSearchParams } from "react-router-dom";
import { BookingHero } from "../components/booking/BookingHero";
import { BookingForm } from "../components/booking/BookingForm";
import { SlotPicker } from "../components/booking/SlotPicker";
import { TrustSection } from "../components/booking/TrustSection";
import { PolicyModal } from "../components/booking/PolicyModal";
import { ToastStack } from "../components/booking/ToastStack";

import { bookingApi } from "../api/booking.api";
import { http } from "../api/http";
import { useToast } from "../services/useToast";
import { useBookingSlots } from "../services/useBookingSlots";
import { getAuth, type AuthUser } from "../services/auth.storage";
import { Footer } from "../components/layout/Footer";

type Opt = { id: string; name: string; duration?: number; price?: number; address?: string };

const defaultToastCmsData = {
  // ===== TOASTS =====
  demoFilled: {
    title: "Đã điền demo",
    message: "Hãy chọn khung giờ và tạo lịch hẹn.",
  },
  myBookings: {
    title: "Lịch của tôi",
    message: "Xem phần sidebar bên phải.",
  },
  resetDone: {
    title: "Đã reset",
    message: "Bạn có thể đặt lịch lại.",
  },
  bookingsCleared: {
    title: "Đã xóa lịch hẹn",
    message: "LocalStorage đã được làm sạch.",
  },
  statusUpdated: {
    title: "Đã cập nhật trạng thái",
    message: "{id} • {status}",
  },
  slotsRefreshed: {
    title: "Đã làm mới slot",
    message: "Một số khung giờ có thể hết chỗ (demo).",
  },

  // ✅ BỔ SUNG: các toast đang còn hardcode trong file
  loadFailed: {
    title: "Không tải được dữ liệu",
    message: "Vui lòng kiểm tra backend (localhost:8090).",
  },
  branchLoadFailed: {
    title: "Không tải được chi nhánh theo dịch vụ",
    message: "Vui lòng thử lại.",
  },
  createSuccess: {
    title: "Tạo lịch hẹn thành công",
    message: "{date} {time}",
  },
  createFailed: {
    title: "Không thể tạo lịch",
    message: "{error}",
  },

  // ===== UI TEXT (nhét tạm ở đây) =====
  uiSelectedSlotLabel: {
    title: "UI",
    message: "Khung giờ đã chọn:",
  },
  uiNotSelected: {
    title: "UI",
    message: "Chưa chọn",
  },
  uiResetAll: {
    title: "UI",
    message: "Reset toàn bộ",
  },
  uiTipRefreshSlots: {
    title: "UI",
    message: 'Tip: bấm “Làm mới” ở khung giờ để random available/unavailable (demo).',
  },
  uiConfirmClearBookings: {
    title: "UI",
    message: "Xóa toàn bộ lịch hẹn (demo)?",
  },
  // ✅ BỔ SUNG: text UI còn hardcode trong file này
  uiLoading: {
    title: "UI",
    message: "Loading...",
  },
} as const;

type ToastCmsData = Record<string, { title: string; message: string }>;
type ToastCmsKey = keyof typeof defaultToastCmsData;

function formatTemplate(template: string, vars?: Record<string, string | number | undefined | null>) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => {
    const v = vars[k];
    return v === undefined || v === null ? "" : String(v);
  });
}

export default function BookingPage() {
  const [searchParams] = useSearchParams();
  const preselectedService = searchParams.get("serviceId") || "";

  const [currentLanguage, setCurrentLanguage] = React.useState<string>(() => {
    return localStorage.getItem("preferred-language") || "vi";
  });

  const [bookingData, setBookingData] = React.useState<any>(null);
  const [toastCmsData, setToastCmsData] = React.useState<ToastCmsData>(() => ({
    ...(defaultToastCmsData as unknown as ToastCmsData),
  }));

  const { items: toasts, push: toast, remove } = useToast();
  const slots = useBookingSlots();
  const { clearPick } = slots;

  const [services, setServices] = React.useState<Opt[]>([]);
  const [branches, setBranches] = React.useState<Opt[]>([]);
  const [loadingCatalog, setLoadingCatalog] = React.useState(true);

  const [serviceId, setServiceId] = React.useState<string>("");
  const [branchId, setBranchId] = React.useState<string>("");
  const [date, setDate] = React.useState<string>(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [customTime, setCustomTime] = React.useState("");

  const [authOpen] = React.useState(false);
  const [policyOpen, setPolicyOpen] = React.useState(false);
  const [user, setUser] = React.useState<AuthUser | null>(() => {
    try {
      return getAuth();
    } catch {
      return null;
    }
  });

  const [resetSignal, setResetSignal] = React.useState(0);
  const formRef = React.useRef<HTMLDivElement | null>(null);

  const getCmsToast = React.useCallback(
    (key: ToastCmsKey, vars?: Record<string, string | number | undefined | null>) => {
      const src = toastCmsData?.[key] ?? (defaultToastCmsData as unknown as ToastCmsData)[key];
      const title = src?.title ?? (defaultToastCmsData as any)[key]?.title ?? "Thông báo";
      const message = formatTemplate(src?.message ?? "", vars);
      return { title, message };
    },
    [toastCmsData],
  );

  const toastByKey = React.useCallback(
    (key: ToastCmsKey, vars?: Record<string, string | number | undefined | null>) => {
      const { title, message } = getCmsToast(key, vars);
      toast(title, message);
    },
    [getCmsToast, toast],
  );

  // Lắng nghe sự kiện thay đổi ngôn ngữ
  React.useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => {
      setCurrentLanguage(event.detail.language);
    };

    window.addEventListener("languageChange", handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener("languageChange", handleLanguageChange as EventListener);
    };
  }, []);

  // gọi API theo ngôn ngữ, gán res.data vào bookingData để truyền props
  React.useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await http.get(`/public/pages/booking?lang=${currentLanguage}`);
        if (!alive) return;
        setBookingData(res.data);
      } catch {
        // optional debug
      }
    })();

    return () => {
      alive = false;
    };
  }, [currentLanguage]);

  // ghi đè toastCmsData bằng bookingData?.sections[5]?.data (giữ nguyên logic bạn đang dùng)
  React.useEffect(() => {
    const next = bookingData?.sections?.[5]?.data;
    if (next && typeof next === "object") {
      setToastCmsData(next as ToastCmsData);
    } else {
      setToastCmsData({ ...(defaultToastCmsData as unknown as ToastCmsData) });
    }
  }, [bookingData]);

  const refreshSlots = React.useCallback(
    async (sid: string, bid: string, d: string) => {
      await slots.refresh({
        serviceId: sid ? Number(sid) : undefined,
        branchId: bid ? Number(bid) : undefined,
        date: d,
      });
    },
    [slots.refresh],
  );

  const normalizeServices = React.useCallback(
    (input: any[]) =>
      input.map((s: any) => ({
        id: String(s.id),
        name: s.name,
        duration: Number(s.durationMin || 0),
        price: Number(s.price || 0),
      })),
    [],
  );

  const normalizeBranches = React.useCallback(
    (input: any[]) => input.map((b: any) => ({ id: String(b.id), name: b.name, address: b.address })),
    [],
  );

  const bootstrapCatalog = React.useCallback(async () => {
    setLoadingCatalog(true);
    try {
      const serviceRows = await bookingApi.services();
      const normalizedServices = normalizeServices(serviceRows);
      setServices(normalizedServices);

      const preferred = normalizedServices.find((s) => s.id === preselectedService)?.id;
      const nextService = preferred || normalizedServices[0]?.id || "";
      setServiceId(nextService);

      const branchRows = nextService ? await bookingApi.branches({ serviceId: Number(nextService) }) : [];
      const normalizedBranches = normalizeBranches(branchRows);
      setBranches(normalizedBranches);

      const nextBranch = normalizedBranches[0]?.id || "";
      setBranchId(nextBranch);

      await refreshSlots(nextService, nextBranch, date);
    } catch {
      toastByKey("loadFailed");
    } finally {
      setLoadingCatalog(false);
    }
  }, [date, normalizeBranches, normalizeServices, preselectedService, refreshSlots, toastByKey]);

  React.useEffect(() => {
    bootstrapCatalog();
  }, [bootstrapCatalog]);

  const onBranchChange = React.useCallback(
    async (nextBranch: string) => {
      setBranchId(nextBranch);
      setCustomTime("");
      clearPick();
      await refreshSlots(serviceId, nextBranch, date);
    },
    [clearPick, date, refreshSlots, serviceId],
  );

  const onServiceChange = React.useCallback(
    async (nextService: string) => {
      setServiceId(nextService);
      setCustomTime("");
      clearPick();
      try {
        const branchRows = await bookingApi.branches(nextService ? { serviceId: Number(nextService) } : undefined);
        const normalizedBranches = normalizeBranches(branchRows);
        setBranches(normalizedBranches);
        const nextBranch = normalizedBranches[0]?.id || "";
        setBranchId(nextBranch);
        await refreshSlots(nextService, nextBranch, date);
      } catch {
        toastByKey("branchLoadFailed");
      }
    },
    [clearPick, date, normalizeBranches, refreshSlots, toastByKey],
  );

  const onDateChange = React.useCallback(
    async (nextDate: string) => {
      setDate(nextDate);
      setCustomTime("");
      clearPick();
      await refreshSlots(serviceId, branchId, nextDate);
    },
    [branchId, clearPick, refreshSlots, serviceId],
  );

  const fillDemo = () => {
    if (!user) {
      const demoUser: AuthUser = { email: "demo@ayanavita.vn", name: "Khách Demo", remember: false };
      setUser(demoUser);
    }
    toastByKey("demoFilled");
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const resetAll = async () => {
    setResetSignal((x) => x + 1);
    setCustomTime("");
    clearPick();
    await bootstrapCatalog();
    toastByKey("resetDone");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-7xl px-4 py-6">
        <BookingHero onViewMyBookings={null} cmsData={bookingData?.sections[0]?.data} onFillDemo={fillDemo} onScrollForm={scrollToForm} />

        <section id="form" className="mt-5 grid gap-4 lg:grid-cols-3" ref={formRef}>
          <div className="lg:col-span-2 space-y-4">
            <BookingForm
              cmsData={bookingData?.sections[1]?.data}
              services={services as any}
              branches={branches as any}
              selectedServiceId={serviceId}
              selectedBranchId={branchId}
              selectedSlot={customTime || slots.selectedSlot}
              onToast={toast}
              onCreate={async (b) => {
                try {
                  await http.post("/booking/appointments", {
                    customerName: b.name,
                    customerPhone: b.phone,
                    customerEmail: b.email || undefined,
                    appointmentAt: `${b.date}T${b.time}:00`,
                    note: b.note || undefined,
                    branchId: Number(b.branchId),
                    serviceId: Number(b.serviceId),
                  });
                  toastByKey("createSuccess", { date: b.date, time: b.time });
                  await refreshSlots(serviceId, branchId, date);
                } catch (error: any) {
                  toastByKey("createFailed", {
                    error: error?.response?.data?.message || "Khung giờ có thể đã hết chỗ.",
                  });
                }
              }}
              onResetSignal={resetSignal}
              initialName={user?.name || ""}
              onServiceChange={onServiceChange}
              onBranchChange={onBranchChange}
              onDateChange={onDateChange}
            />

            {loadingCatalog && <div className="text-sm text-slate-500">{getCmsToast("uiLoading").message}</div>}
          </div>

          <div className="space-y-4">
            <SlotPicker
              cmsData={bookingData?.sections[2]?.data}
              slots={slots.slots}
              selected={slots.selectedSlot}
              customTime={customTime}
              loading={slots.loading}
              durationMin={slots.durationMin}
              capacity={slots.capacity}
              onPick={(t) => {
                setCustomTime("");
                slots.pick(t);
              }}
              onCustomTime={(v) => {
                setCustomTime(v);
                if (v) clearPick();
              }}
              onRefresh={() => refreshSlots(serviceId, branchId, date)}
            />
          </div>
        </section>

        <TrustSection cmsData={bookingData?.sections[4]?.data} onPolicy={() => setPolicyOpen(true)} />

        <Footer />
      </main>

      <PolicyModal cmsData={bookingData?.sections[5]?.data} open={policyOpen} onClose={() => setPolicyOpen(false)} />

      <ToastStack items={toasts} onClose={remove} />
    </div>
  );
}