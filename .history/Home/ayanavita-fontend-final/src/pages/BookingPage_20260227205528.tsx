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
import { getAuth, setAuth, type AuthUser } from "../services/auth.storage";

type Opt = { id: string; name: string; duration?: number; price?: number; address?: string };

const defaultToastCmsData = {
  demoFilled: {
    title: "Đã điền demo",
    message: "Hãy chọn khung giờ và tạo lịch hẹn.",
  },
  logoutConfirm: {
    title: "Xác nhận",
    message: "Bạn muốn đăng xuất?",
  },
  loggedOut: {
    title: "Đã đăng xuất",
    message: "Bạn đã đăng xuất khỏi hệ thống.",
  },
  resetDone: {
    title: "Đã reset",
    message: "Bạn có thể đặt lịch lại.",
  },
  createSuccess: {
    title: "Tạo lịch hẹn thành công",
    message: "{date} {time}",
  },
  createFailed: {
    title: "Không thể tạo lịch",
    message: "Khung giờ có thể đã hết chỗ.",
  },
  loadFailed: {
    title: "Không tải được dữ liệu",
    message: "Vui lòng kiểm tra backend (localhost:8090).",
  },
  branchLoadFailed: {
    title: "Không tải được chi nhánh theo dịch vụ",
    message: "Vui lòng thử lại.",
  },
  loadingLabel: {
    title: "Loading",
    message: "Đang tải dữ liệu...",
  },
} as const;

type ToastCmsData = Record<string, { title: string; message: string }>;

export default function BookingPage() {
  const [searchParams] = useSearchParams();
  const preselectedService = searchParams.get("serviceId") || "";

  const [currentLanguage, setCurrentLanguage] = React.useState<string>(() => {
    return localStorage.getItem("preferred-language") || "vi";
  });

  const [bookingData, setBookingData] = React.useState<any>(null);
  const [toastCmsData, setToastCmsData] = React.useState<ToastCmsData>({
    ...(defaultToastCmsData as unknown as ToastCmsData),
  });

  const { items: toasts, push: toast, remove } = useToast();
  const slots = useBookingSlots();
  const { clearPick } = slots;

  const [services, setServices] = React.useState<Opt[]>([]);
  const [branches, setBranches] = React.useState<Opt[]>([]);
  const [loadingCatalog, setLoadingCatalog] = React.useState(true);

  const [serviceId, setServiceId] = React.useState<string>("");
  const [branchId, setBranchId] = React.useState<string>("");
  const [date, setDate] = React.useState<string>(
    new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  );
  const [customTime, setCustomTime] = React.useState("");

  const [authOpen, setAuthOpen] = React.useState(false);
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

  // ================= LANGUAGE LISTENER =================
  React.useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => {
      setCurrentLanguage(event.detail.language);
    };

    window.addEventListener("languageChange", handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener("languageChange", handleLanguageChange as EventListener);
    };
  }, []);

  // ================= LOAD CMS =================
  React.useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await http.get(`/public/pages/booking?lang=${currentLanguage}`);
        if (!alive) return;
        setBookingData(res.data);
      } catch {}
    })();

    return () => {
      alive = false;
    };
  }, [currentLanguage]);

  React.useEffect(() => {
    const next = bookingData?.sections?.[5]?.data;
    if (next && typeof next === "object") {
      setToastCmsData(next as ToastCmsData);
    } else {
      setToastCmsData({ ...(defaultToastCmsData as unknown as ToastCmsData) });
    }
  }, [bookingData]);

  // ================= AUTH =================
  const onAuthClick = () => {
    if (user) {
      if (confirm(toastCmsData.logoutConfirm.message)) {
        setAuth(null);
        setUser(null);
        toast(toastCmsData.loggedOut.title, toastCmsData.loggedOut.message);
      }
      return;
    }
    setAuthOpen(true);
  };

  const fillDemo = () => {
    if (!user) {
      const demoUser: AuthUser = {
        email: "demo@ayanavita.vn",
        name: "Khách Demo",
        remember: false,
      };
      setUser(demoUser);
    }
    toast(toastCmsData.demoFilled.title, toastCmsData.demoFilled.message);
  };

  const resetAll = async () => {
    setResetSignal((x) => x + 1);
    setCustomTime("");
    clearPick();
    await bootstrapCatalog();
    toast(toastCmsData.resetDone.title, toastCmsData.resetDone.message);
  };

  // ================= CATALOG =================
  const normalizeServices = React.useCallback(
    (input: any[]) =>
      input.map((s: any) => ({
        id: String(s.id),
        name: s.name,
        duration: Number(s.durationMin || 0),
        price: Number(s.price || 0),
      })),
    []
  );

  const normalizeBranches = React.useCallback(
    (input: any[]) =>
      input.map((b: any) => ({
        id: String(b.id),
        name: b.name,
        address: b.address,
      })),
    []
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

      const branchRows = nextService
        ? await bookingApi.branches({ serviceId: Number(nextService) })
        : [];

      const normalizedBranches = normalizeBranches(branchRows);
      setBranches(normalizedBranches);

      const nextBranch = normalizedBranches[0]?.id || "";
      setBranchId(nextBranch);

      await slots.refresh({
        serviceId: Number(nextService),
        branchId: Number(nextBranch),
        date,
      });
    } catch {
      toast(toastCmsData.loadFailed.title, toastCmsData.loadFailed.message);
    } finally {
      setLoadingCatalog(false);
    }
  }, [date, normalizeBranches, normalizeServices, preselectedService, slots, toast, toastCmsData]);

  React.useEffect(() => {
    bootstrapCatalog();
  }, [bootstrapCatalog]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-7xl px-4 py-6">

        {loadingCatalog && (
          <div className="text-sm text-slate-500">
            {toastCmsData.loadingLabel.message}
          </div>
        )}

      </main>

      <PolicyModal
        cmsData={bookingData?.sections?.[5]?.data}
        open={policyOpen}
        onClose={() => setPolicyOpen(false)}
      />

      <ToastStack items={toasts} onClose={remove} />
    </div>
  );
}