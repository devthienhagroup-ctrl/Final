// src/pages/BookingPage.tsx
import React from "react";
import { BookingHero } from "../components/booking/BookingHero";
import { BookingForm } from "../components/booking/BookingForm";
import { SlotPicker } from "../components/booking/SlotPicker";
import { MyBookings } from "../components/booking/MyBookings";
import { TrustSection } from "../components/booking/TrustSection";
import { PolicyModal } from "../components/booking/PolicyModal";
import { ToastStack } from "../components/booking/ToastStack";

import { DEMO_BRANCHES, DEMO_SERVICES, DEMO_STAFF } from "../services/booking.demo";
import { useToast } from "../services/useToast";
import { useBookingSlots } from "../services/useBookingSlots";
import { useBookings } from "../services/useBookings";
import { getAuth, type AuthUser } from "../services/auth.storage";
import type { BookingStatus } from "../services/booking.storage";

import {http} from "../api/http";

/**
 * toastCmsData: gom toàn bộ nội dung toast + vài text UI “cắm tạm”
 * - Placeholder: "{key}" (vd: "{id}", "{status}")
 * - Viết dạng JSON (double quotes, không trailing comma)
 */
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
} as const;

type ToastCmsData = Record<string, { title: string; message: string }>;
type ToastCmsKey = keyof typeof defaultToastCmsData;

function formatTemplate(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) => {
    const v = vars[k];
    return v === undefined || v === null ? `{${k}}` : String(v);
  });
}

export default function BookingPage() {
  const { items: toasts, push: toast, remove } = useToast();
  const slots = useBookingSlots();
  const bookings = useBookings();

  const [currentLanguage, setCurrentLanguage] = React.useState<string>(() => {
    return localStorage.getItem("preferred-language") || "vi";
  });

  const [bookingData, setBookingData] = React.useState<any>(null);
  const [toastCmsData, setToastCmsData] = React.useState<ToastCmsData>(() => ({
    ...(defaultToastCmsData as unknown as ToastCmsData),
  }));

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
      } catch (e) {
        // im lặng cũng được; muốn debug thì mở console
        // console.error(e);
      }
    })();

    return () => {
      alive = false;
    };
  }, [currentLanguage]);

  // cuối cùng: ghi đè toastCmsData bằng bookingData?.sections[5]?.data
  React.useEffect(() => {
    const next = bookingData?.sections?.[5]?.data;
    if (next && typeof next === "object") {
      setToastCmsData(next as ToastCmsData);
    } else {
      setToastCmsData({ ...(defaultToastCmsData as unknown as ToastCmsData) });
    }
  }, [bookingData]);

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

  // toast theo cms + data động
  const toastFromCms = React.useCallback(
      (key: ToastCmsKey, vars?: Record<string, string | number>) => {
        const item = toastCmsData[key] ?? (defaultToastCmsData as any)[key];
        if (!item) return;
        toast(item.title, formatTemplate(item.message, vars));
      },
      [toast, toastCmsData]
  );

  // lấy message dùng cho UI text
  const cmsMsg = React.useCallback((key: ToastCmsKey, vars?: Record<string, string | number>) => {
    const item = toastCmsData[key] ?? (defaultToastCmsData as any)[key];
    return item ? formatTemplate(item.message, vars) : "";
  }, [toastCmsData]);

  const fillDemo = () => {
    if (!user) {
      const demoUser: AuthUser = { email: "demo@ayanavita.vn", name: "Khách Demo", remember: false };
      setUser(demoUser);
    }
    toastFromCms("demoFilled");
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const viewMyBookings = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    toastFromCms("myBookings");
  };

  const resetAll = () => {
    setResetSignal((x) => x + 1);
    slots.refresh();
    bookings.reload();
    toastFromCms("resetDone");
  };

  const clearBookings = () => {
    if (!confirm(cmsMsg("uiConfirmClearBookings"))) return;
    bookings.clearAll();
    toastFromCms("bookingsCleared");
  };

  const setStatus = (id: string, status: BookingStatus) => {
    bookings.setStatus(id, status);
    toastFromCms("statusUpdated", { id, status });
  };

  return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <main className="mx-auto max-w-7xl px-4 py-6">
          <BookingHero
              cmsData={bookingData?.sections[0]?.data}
              onFillDemo={fillDemo} onScrollForm={scrollToForm} onViewMyBookings={viewMyBookings} />

          <section id="form" className="mt-5 grid gap-4 lg:grid-cols-3" ref={formRef}>
            <div className="lg:col-span-2 space-y-4">
              <BookingForm
                  cmsData={bookingData?.sections[1]?.data}
                  services={DEMO_SERVICES}
                  staff={DEMO_STAFF}
                  branches={DEMO_BRANCHES}
                  selectedSlot={slots.selectedSlot}
                  onToast={toast}
                  onCreate={(b) => bookings.add(b)}
                  onResetSignal={resetSignal}
                  initialName={user?.name || ""}
              />

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="text-sm text-slate-700">
                    {cmsMsg("uiSelectedSlotLabel")} <b>{slots.selectedSlot || cmsMsg("uiNotSelected")}</b>
                    <span className="text-slate-500"> • </span>
                    <button className="font-extrabold text-indigo-600 hover:underline" onClick={resetAll} type="button">
                      {cmsMsg("uiResetAll")}
                    </button>
                  </div>
                </div>

                <div className="mt-2 text-sm text-slate-600">{cmsMsg("uiTipRefreshSlots")}</div>
              </div>
            </div>

            <div className="space-y-4">
              <SlotPicker
                  cmsData={bookingData?.sections[2]?.data}
                  slots={slots.slots}
                  selected={slots.selectedSlot}
                  onPick={(t) => slots.pick(t)}
                  onRefresh={() => {
                    slots.refresh();
                    toastFromCms("slotsRefreshed");
                  }}
              />

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <MyBookings
                    cmsData={bookingData?.sections[3]?.data}
                    list={bookings.list} onSetStatus={setStatus} onClear={clearBookings} />
              </div>
            </div>
          </section>

          <TrustSection
              cmsData={bookingData?.sections[4]?.data}
              onPolicy={() => setPolicyOpen(true)} />
        </main>

        <PolicyModal
            cmsData={bookingData?.sections[5]?.data}
            open={policyOpen} onClose={() => setPolicyOpen(false)} />
        <ToastStack items={toasts} onClose={remove} />
      </div>
  );
}