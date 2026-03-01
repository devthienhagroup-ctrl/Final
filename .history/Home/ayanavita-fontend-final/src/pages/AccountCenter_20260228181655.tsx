// AccountCenter.tsx
import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { authApi } from "../api/auth.api";
import { http } from "../api/http";

type ToastKind = "success" | "error" | "info";
type ActiveSection = "profile" | "changePassword" | "forgotPassword" | "myOrders";

type OrderStatus = "processing" | "paid" | "cancelled" | "expired";

type MyOrderItem = {
  name: string;
  sku: string;
  qty: number;
  price: number;
  image: string;
};

type MyOrder = {
  id: number;
  code: string;
  status: OrderStatus;
  createdAt: string;
  branch: string;
  payment: { method: string; paidAt: string | null; ref: string | null };
  pricing: { subtotal: number; shipping: number; discount: number; total: number };
  note: string;
  items: MyOrderItem[];
  shippingInfo: {
    receiverName: string;
    phone: string;
    addressLine: string;
    district: string;
    city: string;
    carrier: string;
    trackingCode: string | null;
    expectedDelivery: string;
    note: string;
  };
};

type ApiProductOrder = {
  id: number;
  code: string;
  status: string;
  createdAt: string;
  paymentMethod: string;
  paymentStatus: string;
  paymentCode: string | null;
  paidAt: string | null;
  note: string | null;
  subtotal: number | string;
  shippingFee: number | string;
  discount: number | string;
  total: number | string;
  shippingUnit?: string | null;
  trackingCode?: string | null;
  expectedDelivery?: string | null;
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  district: string;
  city: string;
  details: Array<{
    productName: string;
    productSku: string;
    quantity: number;
    unitPrice: number | string;
    productImage?: string | null;
  }>;
};

type CmsData = {
  page: {
    title: string;
    subtitle?: string;
    icons: {
      page: string;
    };
  };

  sidebar: {
    header: { title: string; subtitle?: string };
    items: Array<{
      key: ActiveSection;
      label: string;
      desc?: string;
      iconClass: string; // FontAwesome class
    }>;
    footerHint?: string;
  };

  common: {
    loadingText: string;
    requiredMark: string;
    actions: {
      back: string;
      save: string;
      verify: string;
      sendOtp: string;
      verifyOtp: string;
      resetPassword: string;
      updatePassword: string;
    };
  };

  profile: {
    cardTitle: string;
    cardDesc?: string;
    fields: {
      fullName: { label: string; placeholder: string; iconClass: string };
      phone: { label: string; placeholder: string; iconClass: string };
      email: { label: string; placeholder: string; iconClass: string; helper?: string };
      birthDate: { label: string; placeholder: string; iconClass: string };
      gender: {
        label: string;
        iconClass: string;
        options: {
          male: string;
          female: string;
          other: string;
        };
      };
      address: { label: string; placeholder: string; iconClass: string };
    };
    toasts: {
      saveSuccess: { title: string; message: string };
      saveFailed: { title: string; message: string };
      loadFailed: { title: string; message: string };
    };
  };

  changePassword: {
    cardTitle: string;
    cardDesc?: string;
    steps: {
      verifyCurrent: {
        title: string;
        currentPassword: { label: string; placeholder: string; iconClass: string };
        buttonText: string;
      };
      setNew: {
        title: string;
        newPassword: { label: string; placeholder: string; iconClass: string };
        confirmPassword: { label: string; placeholder: string; iconClass: string };
        buttonText: string;
      };
    };
    validates: {
      currentRequired: string;
      confirmMismatch: string;
    };
    toasts: {
      verifiedOk: { title: string; message: string };
      verifyFailed: { title: string; message: string };
      changeOk: { title: string; message: string };
      changeFailed: { title: string; message: string };
    };
  };

  forgotPassword: {
    cardTitle: string;
    cardDesc?: string;
    noteRegisteredEmail: string;
    steps: {
      email: {
        title: string;
        email: { label: string; placeholder: string; iconClass: string };
      };
      otp: {
        title: string;
        otp: { label: string; placeholder: string; iconClass: string };
      };
      newPassword: {
        title: string;
        newPassword: { label: string; placeholder: string; iconClass: string };
        confirmPassword: { label: string; placeholder: string; iconClass: string };
      };
    };
    validates: {
      emailRequired: string;
      emailMismatch: string;
      otpRequired: string;
      confirmMismatch: string;
    };
    toasts: {
      otpSent: { title: string; message: string };
      otpSendFailed: { title: string; message: string };
      otpVerified: { title: string; message: string };
      otpVerifyFailed: { title: string; message: string };
      resetOk: { title: string; message: string };
      resetFailed: { title: string; message: string };
    };
  };

  myOrders: {
    cardTitle: string;
    cardDesc?: string;
    filters: {
      keyword: { label: string; placeholder: string; iconClass: string };
      status: { label: string; iconClass: string; all: string };
    };
    list: {
      title: string;
      seeDetail: string;
    };
    statuses: Record<"all" | OrderStatus, string>;
    emptyText: string;
    detailTitle: string;
    productsTitle: string;
    fields: {
      createdAt: string;
      branch: string;
      paymentMethod: string;
      paymentRef: string;
      paidAt: string;
      receiver: string;
      phone: string;
      address: string;
      carrier: string;
      trackingCode: string;
      expectedDelivery: string;
      orderNote: string;
      shippingNote: string;
      subtotal: string;
      shipping: string;
      discount: string;
      total: string;
      quantity: string;
      product: string;
      sku: string;
    };
  };

  ui: {
    badges: {
      secure: { text: string; iconClass: string };
    };
  };
};

// ✅ CMS mặc định
const defaultCmsData: CmsData = {
  page: {
    title: "Quản lý tài khoản",
    subtitle: "Cập nhật thông tin cá nhân và bảo mật tài khoản",
    icons: { page: "fa-solid fa-user-gear" },
  },

  sidebar: {
    header: {
      title: "Account Center",
      subtitle: "Thiết lập tài khoản",
    },
    items: [
      {
        key: "profile",
        label: "Thông tin cá nhân",
        desc: "Họ tên, liên hệ, địa chỉ",
        iconClass: "fa-regular fa-id-card",
      },
      {
        key: "changePassword",
        label: "Đổi mật khẩu",
        desc: "Tăng cường bảo mật",
        iconClass: "fa-solid fa-key",
      },
      {
        key: "forgotPassword",
        label: "Quên mật khẩu",
        desc: "OTP qua email",
        iconClass: "fa-solid fa-shield-halved",
      },
      {
        key: "myOrders",
        label: "Đơn hàng của tôi",
        desc: "Xem & lọc các đơn đã đặt",
        iconClass: "fa-solid fa-box-open",
      },
    ],
    footerHint: "Tip: Hãy đặt mật khẩu mạnh và không chia sẻ OTP.",
  },

  common: {
    loadingText: "Đang xử lý...",
    requiredMark: "*",
    actions: {
      back: "Quay lại",
      save: "Lưu thay đổi",
      verify: "Kiểm tra",
      sendOtp: "Gửi OTP",
      verifyOtp: "Xác nhận OTP",
      resetPassword: "Đặt lại mật khẩu",
      updatePassword: "Cập nhật mật khẩu",
    },
  },

  profile: {
    cardTitle: "Chỉnh sửa thông tin cá nhân",
    cardDesc: "Thông tin này giúp cá nhân hoá trải nghiệm và hỗ trợ chăm sóc tốt hơn.",
    fields: {
      fullName: { label: "Họ và tên", placeholder: "Nhập họ và tên", iconClass: "fa-regular fa-user" },
      phone: { label: "Số điện thoại", placeholder: "Nhập số điện thoại", iconClass: "fa-solid fa-phone" },
      email: {
        label: "Email",
        placeholder: "Email",
        iconClass: "fa-regular fa-envelope",
        helper: "Email không thể thay đổi tại đây.",
      },
      birthDate: { label: "Ngày sinh", placeholder: "Chọn ngày sinh", iconClass: "fa-regular fa-calendar" },
      gender: {
        label: "Giới tính",
        iconClass: "fa-solid fa-venus-mars",
        options: { male: "Nam", female: "Nữ", other: "Khác" },
      },
      address: { label: "Địa chỉ", placeholder: "Nhập địa chỉ", iconClass: "fa-solid fa-location-dot" },
    },
    toasts: {
      saveSuccess: { title: "Thành công", message: "Đã lưu thông tin cá nhân." },
      saveFailed: { title: "Thất bại", message: "Cập nhật thông tin thất bại." },
      loadFailed: { title: "Không tải được", message: "Không tải được thông tin tài khoản." },
    },
  },

  changePassword: {
    cardTitle: "Đổi mật khẩu",
    cardDesc: "Xác thực mật khẩu hiện tại trước khi đặt mật khẩu mới.",
    steps: {
      verifyCurrent: {
        title: "Xác thực mật khẩu hiện tại",
        currentPassword: { label: "Mật khẩu hiện tại", placeholder: "Nhập mật khẩu hiện tại", iconClass: "fa-solid fa-lock" },
        buttonText: "Kiểm tra mật khẩu",
      },
      setNew: {
        title: "Thiết lập mật khẩu mới",
        newPassword: { label: "Mật khẩu mới", placeholder: "Nhập mật khẩu mới", iconClass: "fa-solid fa-lock" },
        confirmPassword: { label: "Xác nhận mật khẩu", placeholder: "Nhập lại mật khẩu mới", iconClass: "fa-solid fa-lock" },
        buttonText: "Cập nhật mật khẩu",
      },
    },
    validates: {
      currentRequired: "Vui lòng nhập mật khẩu hiện tại.",
      confirmMismatch: "Mật khẩu xác nhận chưa khớp.",
    },
    toasts: {
      verifiedOk: { title: "OK", message: "Mật khẩu hiện tại chính xác. Hãy nhập mật khẩu mới." },
      verifyFailed: { title: "Sai mật khẩu", message: "Mật khẩu hiện tại không chính xác." },
      changeOk: { title: "Thành công", message: "Đổi mật khẩu thành công." },
      changeFailed: { title: "Thất bại", message: "Đổi mật khẩu thất bại." },
    },
  },

  forgotPassword: {
    cardTitle: "Quên mật khẩu",
    cardDesc: "Xác minh OTP qua email để đặt lại mật khẩu.",
    noteRegisteredEmail: "Email đã đăng ký",
    steps: {
      email: {
        title: "Nhập email tài khoản",
        email: { label: "Email", placeholder: "Nhập đúng email tài khoản", iconClass: "fa-regular fa-envelope" },
      },
      otp: {
        title: "Nhập OTP",
        otp: { label: "OTP", placeholder: "Nhập mã OTP", iconClass: "fa-solid fa-hashtag" },
      },
      newPassword: {
        title: "Đặt mật khẩu mới",
        newPassword: { label: "Mật khẩu mới", placeholder: "Nhập mật khẩu mới", iconClass: "fa-solid fa-lock" },
        confirmPassword: { label: "Xác nhận mật khẩu", placeholder: "Nhập lại mật khẩu mới", iconClass: "fa-solid fa-lock" },
      },
    },
    validates: {
      emailRequired: "Vui lòng nhập email tài khoản.",
      emailMismatch: "Email không khớp với email tài khoản của bạn.",
      otpRequired: "Vui lòng nhập OTP.",
      confirmMismatch: "Mật khẩu xác nhận chưa khớp.",
    },
    toasts: {
      otpSent: { title: "Đã gửi OTP", message: "OTP đã được gửi tới email của bạn." },
      otpSendFailed: { title: "Không gửi được", message: "Không gửi được OTP." },
      otpVerified: { title: "OTP hợp lệ", message: "OTP hợp lệ. Vui lòng nhập mật khẩu mới." },
      otpVerifyFailed: { title: "OTP không hợp lệ", message: "OTP không hợp lệ hoặc đã hết hạn." },
      resetOk: { title: "Thành công", message: "Đặt lại mật khẩu thành công." },
      resetFailed: { title: "Thất bại", message: "Không thể đặt lại mật khẩu." },
    },
  },

  myOrders: {
    cardTitle: "Đơn hàng của tôi",
    cardDesc: "Xem lịch sử đặt hàng và kiểm tra thông tin thanh toán, giao hàng.",
    filters: {
      keyword: { label: "Tìm đơn", placeholder: "Mã đơn, mã giao vận, ghi chú...", iconClass: "fa-solid fa-magnifying-glass" },
      status: { label: "Trạng thái", iconClass: "fa-solid fa-filter", all: "Tất cả" },
    },
    list: {
      title: "Danh sách đơn hàng",
      seeDetail: "Xem chi tiết đơn hàng",
    },
    statuses: {
      all: "Tất cả",
      processing: "Chờ xử lý",
      paid: "Đã thanh toán",
      cancelled: "Đã hủy",
      expired: "Hết hạn",
    },
    emptyText: "Không có đơn hàng phù hợp bộ lọc.",
    detailTitle: "Chi tiết đơn hàng",
    productsTitle: "Sản phẩm đã đặt",
    fields: {
      createdAt: "Ngày tạo",
      branch: "Chi nhánh",
      paymentMethod: "Phương thức thanh toán",
      paymentRef: "Mã giao dịch",
      paidAt: "Ngày thanh toán",
      receiver: "Người nhận",
      phone: "SĐT nhận hàng",
      address: "Địa chỉ giao hàng",
      carrier: "Đơn vị vận chuyển",
      trackingCode: "Mã vận đơn",
      expectedDelivery: "Dự kiến giao",
      orderNote: "Ghi chú đơn hàng",
      shippingNote: "Ghi chú giao vận",
      subtotal: "Tạm tính",
      shipping: "Phí vận chuyển",
      discount: "Giảm giá",
      total: "Tổng thanh toán",
      quantity: "Số lượng",
      product: "Sản phẩm",
      sku: "SKU",
    },
  },

  ui: {
    badges: {
      secure: { text: "Bảo mật", iconClass: "fa-solid fa-shield" },
    },
  },
};

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

/** ✅ Deep merge: object merge sâu, array bị override bởi server */
function isPlainObject(v: any): v is Record<string, any> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}
function deepMerge<T>(base: T, override: any): T {
  if (Array.isArray(base)) return (Array.isArray(override) ? override : base) as any;

  if (isPlainObject(base)) {
    const out: Record<string, any> = { ...(base as any) };

    if (isPlainObject(override)) {
      for (const k of Object.keys(override)) {
        const bv = (base as any)[k];
        const ov = override[k];

        if (bv === undefined) out[k] = ov;
        else if (Array.isArray(bv)) out[k] = Array.isArray(ov) ? ov : bv;
        else if (isPlainObject(bv) && isPlainObject(ov)) out[k] = deepMerge(bv, ov);
        else out[k] = ov;
      }
    }
    return out as T;
  }

  return (override ?? base) as T;
}

function ToastStack({
  toasts,
  onClose,
}: {
  toasts: Array<{ id: string; kind: ToastKind; title: string; message: string }>;
  onClose: (id: string) => void;
}) {
  const kindStyles: Record<ToastKind, { wrap: string; icon: string }> = {
    success: { wrap: "border-emerald-200 bg-emerald-50 text-emerald-800", icon: "fa-solid fa-circle-check" },
    error: { wrap: "border-rose-200 bg-rose-50 text-rose-800", icon: "fa-solid fa-circle-xmark" },
    info: { wrap: "border-sky-200 bg-sky-50 text-sky-800", icon: "fa-solid fa-circle-info" },
  };

  return (
    <div className="fixed right-5 top-[75px] z-100 flex w-[360px] max-w-[calc(100vw-40px)] flex-col gap-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={classNames("rounded-2xl border px-4 py-3 shadow-sm backdrop-blur", kindStyles[t.kind].wrap)}
          role="status"
        >
          <div className="flex items-start gap-3">
            <i className={classNames(kindStyles[t.kind].icon, "mt-0.5")} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold">{t.title}</p>
                <button
                  type="button"
                  className="rounded-lg px-2 py-1 text-xs font-semibold opacity-80 hover:opacity-100"
                  onClick={() => onClose(t.id)}
                  aria-label="Close toast"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
              <p className="mt-1 text-sm opacity-90">{t.message}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Field({
  label,
  iconClass,
  children,
  helper,
}: {
  label: string;
  iconClass: string;
  children: React.ReactNode;
  helper?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <i className={classNames(iconClass, "text-slate-400")} />
        {label}
      </span>
      {children}
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </label>
  );
}


const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  processing: "bg-amber-50 text-amber-700 border-amber-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
  expired: "bg-slate-100 text-slate-700 border-slate-200",
};

function toNum(v: number | string | null | undefined) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function mapOrderStatus(status: string): OrderStatus {
  switch (String(status || "").toUpperCase()) {
    case "PAID":
      return "paid";
    case "CANCELLED":
      return "cancelled";
    case "EXPIRED":
      return "expired";
    default:
      return "processing";
  }
}

function mapPaymentMethod(method: string): string {
  const m = String(method || "").toUpperCase();
  if (m === "SEPAY") return "Chuyển khoản";
  if (m === "COD") return "COD";
  return m || "-";
}

function toMyOrder(apiOrder: ApiProductOrder): MyOrder {
  return {
    id: apiOrder.id,
    code: apiOrder.code,
    status: mapOrderStatus(apiOrder.status),
    createdAt: apiOrder.createdAt,
    branch: "Online",
    payment: {
      method: mapPaymentMethod(apiOrder.paymentMethod),
      paidAt: apiOrder.paidAt,
      ref: apiOrder.paymentCode,
    },
    pricing: {
      subtotal: toNum(apiOrder.subtotal),
      shipping: toNum(apiOrder.shippingFee),
      discount: toNum(apiOrder.discount),
      total: toNum(apiOrder.total),
    },
    note: apiOrder.note || "-",
    items: (apiOrder.details || []).map((it, idx) => ({
      name: it.productName,
      sku: it.productSku,
      qty: Number(it.quantity || 1),
      price: toNum(it.unitPrice),
      image: it.productImage || `https://picsum.photos/seed/order-${apiOrder.id}-${idx}/96/96`,
    })),
    shippingInfo: {
      receiverName: apiOrder.receiverName,
      phone: apiOrder.receiverPhone,
      addressLine: apiOrder.shippingAddress,
      district: apiOrder.district || "-",
      city: apiOrder.city || "-",
      carrier: apiOrder.shippingUnit || "-",
      trackingCode: apiOrder.trackingCode || null,
      expectedDelivery: apiOrder.expectedDelivery || apiOrder.createdAt,
      note: apiOrder.note || "-",
    },
  };
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

function formatDate(date: string | null) {
  if (!date) return "—";
  const normalized = date.includes("T") ? date : `${date}T12:00:00`;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("vi-VN");
}

export default function AccountCenter() {
  const [active, setActive] = useState<ActiveSection>("profile");

  const [profile, setProfile] = useState({
    fullName: "",
    phone: "",
    email: "",
    birthDate: "",
    gender: "OTHER",
    address: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordStep, setPasswordStep] = useState<"verifyCurrent" | "setNew">("verifyCurrent");

  const [forgotForm, setForgotForm] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [accountEmail, setAccountEmail] = useState("");
  const [forgotStep, setForgotStep] = useState<"email" | "otp" | "newPassword">("email");

  const [loading, setLoading] = useState<boolean>(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState<"all" | OrderStatus>("all");
  const [orderKeyword, setOrderKeyword] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<MyOrder | null>(null);
  const [myOrders, setMyOrders] = useState<MyOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // ✅ CMS runtime (render UI bằng state này)
  const [cms, setCms] = useState<CmsData>(defaultCmsData);

  // ✅ Toast system
  const [toasts, setToasts] = useState<Array<{ id: string; kind: ToastKind; title: string; message: string }>>([]);

  const pushToast = (kind: ToastKind, title: string, message: string) => {
    const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { id, kind, title, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const closeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const activeMeta = useMemo(() => cms.sidebar.items.find((x) => x.key === active), [active, cms]);


  const filteredOrders = useMemo(() => {
    const kw = orderKeyword.trim().toLowerCase();
    return myOrders.filter((order) => {
      if (orderStatusFilter !== "all" && order.status !== orderStatusFilter) return false;
      if (!kw) return true;
      const haystack = [
        order.code,
        order.branch,
        order.note,
        order.shippingInfo.receiverName,
        order.shippingInfo.phone,
        order.shippingInfo.trackingCode || "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(kw);
    });
  }, [myOrders, orderKeyword, orderStatusFilter]);

  const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
    return localStorage.getItem("preferred-language") || "vi";
  });

  // Lắng nghe sự kiện thay đổi ngôn ngữ
  useEffect(() => {
    const handleLanguageChange = (event: Event) => {
      const e = event as CustomEvent<{ language: string }>;
      if (e?.detail?.language) setCurrentLanguage(e.detail.language);
    };

    window.addEventListener("languageChange", handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener("languageChange", handleLanguageChange as EventListener);
    };
  }, []);

  // ✅ Gọi API global khi ngôn ngữ thay đổi -> ghi đè CMS
  useEffect(() => {
    const fetchGlobal = async () => {
      try {
        const res = await http.get(`/public/pages/accountCenter?lang=${currentLanguage}`);
        const remoteCms = res.data?.sections?.[0]?.data;

        if (remoteCms && typeof remoteCms === "object") {
          // reset về default theo lang, rồi merge dữ liệu server
          setCms(deepMerge(defaultCmsData, remoteCms));
        } else {
          // nếu server trả rỗng, vẫn reset về default cho an toàn
          setCms(defaultCmsData);
        }
      } catch (error) {
        console.error("Lỗi gọi API global:", error);
        // optional: toast nếu muốn
        // pushToast("error", cms.profile.toasts.loadFailed.title, cms.profile.toasts.loadFailed.message);
      }
    };

    fetchGlobal();
  }, [currentLanguage]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!localStorage.getItem("aya_access_token")) return;
      setLoading(true);

      try {
        const [data, me] = await Promise.all([authApi.profile(), authApi.me()]);

        setAccountEmail(me?.email ?? "");
        setProfile({
          fullName: data?.name ?? "",
          phone: data?.phone ?? "",
          email: data?.email ?? "",
          birthDate: data?.birthDate ? String(data.birthDate).slice(0, 10) : "",
          gender: data?.gender ?? "OTHER",
          address: data?.address ?? "",
        });

        setForgotForm((prev) => ({ ...prev, email: "" }));
      } catch (e: any) {
        pushToast(
          "error",
          cms.profile.toasts.loadFailed.title,
          e?.response?.data?.message || cms.profile.toasts.loadFailed.message
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    if (!localStorage.getItem("aya_access_token")) return;

    const fetchMyOrders = async () => {
      setOrdersLoading(true);
      try {
        const res = await http.get<ApiProductOrder[]>("/api/product-orders/me");
        const rows = Array.isArray(res.data) ? res.data.map(toMyOrder) : [];
        setMyOrders(rows);
      } catch (e: any) {
        pushToast("error", "Đơn hàng", e?.response?.data?.message || "Không tải được danh sách đơn hàng.");
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchMyOrders();
  }, []);

  const onProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authApi.updateProfile({
        name: profile.fullName,
        phone: profile.phone,
        birthDate: profile.birthDate || undefined,
        gender: profile.gender as "MALE" | "FEMALE" | "OTHER",
        address: profile.address,
      });

      pushToast("success", cms.profile.toasts.saveSuccess.title, cms.profile.toasts.saveSuccess.message);
    } catch (e: any) {
      pushToast(
        "error",
        cms.profile.toasts.saveFailed.title,
        e?.response?.data?.message || cms.profile.toasts.saveFailed.message
      );
    } finally {
      setLoading(false);
    }
  };

  const onVerifyCurrentPassword = async (e: FormEvent) => {
    e.preventDefault();

    if (!passwordForm.currentPassword.trim()) {
      pushToast("error", "Validate", cms.changePassword.validates.currentRequired);
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.checkPassword(passwordForm.currentPassword);
      setPasswordStep("setNew");
      pushToast(
        "success",
        cms.changePassword.toasts.verifiedOk.title,
        res?.message || cms.changePassword.toasts.verifiedOk.message
      );
    } catch (e: any) {
      pushToast(
        "error",
        cms.changePassword.toasts.verifyFailed.title,
        e?.response?.data?.message || cms.changePassword.toasts.verifyFailed.message
      );
    } finally {
      setLoading(false);
    }
  };

  const onChangePassword = async (e: FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      pushToast("error", "Validate", cms.changePassword.validates.confirmMismatch);
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      pushToast("success", cms.changePassword.toasts.changeOk.title, res?.message || cms.changePassword.toasts.changeOk.message);

      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordStep("verifyCurrent");
    } catch (e: any) {
      pushToast(
        "error",
        cms.changePassword.toasts.changeFailed.title,
        e?.response?.data?.message || cms.changePassword.toasts.changeFailed.message
      );
    } finally {
      setLoading(false);
    }
  };

  const onSendForgotOtp = async (e: FormEvent) => {
    e.preventDefault();

    const enteredEmail = forgotForm.email.trim().toLowerCase();
    if (!enteredEmail) {
      pushToast("error", "Validate", cms.forgotPassword.validates.emailRequired);
      return;
    }

    if (!accountEmail || enteredEmail !== accountEmail.trim().toLowerCase()) {
      pushToast("error", "Validate", cms.forgotPassword.validates.emailMismatch);
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.sendForgotPasswordOtp({ email: enteredEmail });
      setForgotStep("otp");
      pushToast("success", cms.forgotPassword.toasts.otpSent.title, res?.message || cms.forgotPassword.toasts.otpSent.message);
    } catch (e: any) {
      const serverMessage = e?.response?.data?.message;
      pushToast(
        "error",
        cms.forgotPassword.toasts.otpSendFailed.title,
        serverMessage || cms.forgotPassword.toasts.otpSendFailed.message
      );
    } finally {
      setLoading(false);
    }
  };

  const onVerifyForgotOtp = async (e: FormEvent) => {
    e.preventDefault();

    if (!forgotForm.otp.trim()) {
      pushToast("error", "Validate", cms.forgotPassword.validates.otpRequired);
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.verifyForgotPasswordOtp({
        email: forgotForm.email.trim().toLowerCase(),
        otp: forgotForm.otp.trim(),
      });

      setForgotStep("newPassword");
      pushToast(
        "success",
        cms.forgotPassword.toasts.otpVerified.title,
        res?.message || cms.forgotPassword.toasts.otpVerified.message
      );
    } catch (e: any) {
      pushToast(
        "error",
        cms.forgotPassword.toasts.otpVerifyFailed.title,
        e?.response?.data?.message || cms.forgotPassword.toasts.otpVerifyFailed.message
      );
    } finally {
      setLoading(false);
    }
  };

  const onForgotPassword = async (e: FormEvent) => {
    e.preventDefault();

    if (forgotForm.newPassword !== forgotForm.confirmPassword) {
      pushToast("error", "Validate", cms.forgotPassword.validates.confirmMismatch);
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.forgotPassword({
        email: forgotForm.email.trim().toLowerCase(),
        otp: forgotForm.otp.trim(),
        newPassword: forgotForm.newPassword,
      });

      pushToast("success", cms.forgotPassword.toasts.resetOk.title, res?.message || cms.forgotPassword.toasts.resetOk.message);

      setForgotForm((prev) => ({ ...prev, otp: "", newPassword: "", confirmPassword: "" }));
      setForgotStep("email");
    } catch (e: any) {
      pushToast(
        "error",
        cms.forgotPassword.toasts.resetFailed.title,
        e?.response?.data?.message || cms.forgotPassword.toasts.resetFailed.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-0px)] bg-slate-50">
      <ToastStack toasts={toasts} onClose={closeToast} />

      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        {/* Page header */}
        <div className="mb-6 flex flex-col gap-2 rounded-3xl border border-slate-200 bg-white px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-extrabold text-slate-900">
                <i className={classNames(cms.page.icons.page, "text-slate-700")} />
                {cms.page.title}
              </h1>
              {cms.page.subtitle ? <p className="mt-1 text-sm text-slate-600">{cms.page.subtitle}</p> : null}
            </div>

            <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 md:flex">
              <i className={classNames(cms.ui.badges.secure.iconClass, "text-slate-500")} />
              {cms.ui.badges.secure.text}
            </div>
          </div>

          {loading ? (
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
              <i className="fa-solid fa-spinner animate-spin" />
              {cms.common.loadingText}
            </div>
          ) : null}
        </div>

        {/* Layout: Sidebar + Main */}
        <div className="grid gap-6 md:grid-cols-[320px_1fr]">
          {/* Sidebar */}
          <aside className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm font-extrabold text-slate-900">{cms.sidebar.header.title}</p>
              {cms.sidebar.header.subtitle ? <p className="mt-1 text-xs text-slate-600">{cms.sidebar.header.subtitle}</p> : null}
            </div>

            <nav className="space-y-2">
              {cms.sidebar.items.map((item) => {
                const isActive = item.key === active;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActive(item.key)}
                    className={classNames(
                      "w-full rounded-2xl border px-4 py-3 text-left transition",
                      isActive ? "border-indigo-200 bg-indigo-50" : "border-slate-200 bg-white hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={classNames(
                          "mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border",
                          isActive ? "border-indigo-200 bg-white text-indigo-700" : "border-slate-200 bg-slate-50 text-slate-600"
                        )}
                      >
                        <i className={item.iconClass} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className={classNames("text-sm font-extrabold", isActive ? "text-indigo-900" : "text-slate-900")}>
                          {item.label}
                        </p>
                        {item.desc ? <p className="mt-0.5 text-xs text-slate-600">{item.desc}</p> : null}
                      </div>

                      {isActive ? <i className="fa-solid fa-chevron-right mt-1 text-indigo-600" /> : null}
                    </div>
                  </button>
                );
              })}
            </nav>

            {cms.sidebar.footerHint ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                <i className="fa-regular fa-lightbulb mr-2 text-slate-500" />
                {cms.sidebar.footerHint}
              </div>
            ) : null}
          </aside>

          {/* Main */}
          <main className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{activeMeta?.label}</p>
                  <h2 className="mt-1 text-xl font-extrabold text-slate-900">
                    {active === "profile"
                      ? cms.profile.cardTitle
                      : active === "changePassword"
                      ? cms.changePassword.cardTitle
                      : active === "forgotPassword"
                      ? cms.forgotPassword.cardTitle
                      : cms.myOrders.cardTitle}
                  </h2>

                  <p className="mt-1 text-sm text-slate-600">
                    {active === "profile"
                      ? cms.profile.cardDesc
                      : active === "changePassword"
                      ? cms.changePassword.cardDesc
                      : active === "forgotPassword"
                      ? cms.forgotPassword.cardDesc
                      : cms.myOrders.cardDesc}
                  </p>
                </div>

                <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 md:flex">
                  <i className={classNames(activeMeta?.iconClass || "fa-regular fa-circle", "text-slate-500")} />
                  {activeMeta?.label}
                </div>
              </div>

              {/* PROFILE */}
              {active === "profile" && (
                <form className="grid gap-4 md:grid-cols-2" onSubmit={onProfileSubmit}>
                  <Field label={cms.profile.fields.fullName.label} iconClass={cms.profile.fields.fullName.iconClass}>
                    <input
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                      placeholder={cms.profile.fields.fullName.placeholder}
                      value={profile.fullName}
                      onChange={(e) => setProfile((prev) => ({ ...prev, fullName: e.target.value }))}
                    />
                  </Field>

                  <Field label={cms.profile.fields.phone.label} iconClass={cms.profile.fields.phone.iconClass}>
                    <input
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                      placeholder={cms.profile.fields.phone.placeholder}
                      value={profile.phone}
                      onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
                    />
                  </Field>

                  <Field label={cms.profile.fields.email.label} iconClass={cms.profile.fields.email.iconClass} helper={cms.profile.fields.email.helper}>
                    <input
                      className="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
                      type="text"
                      placeholder={cms.profile.fields.email.placeholder}
                      value={profile.email}
                      readOnly
                    />
                  </Field>

                  <Field label={cms.profile.fields.birthDate.label} iconClass={cms.profile.fields.birthDate.iconClass}>
                    <input
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                      type="date"
                      value={profile.birthDate}
                      onChange={(e) => setProfile((prev) => ({ ...prev, birthDate: e.target.value }))}
                    />
                  </Field>

                  <Field label={cms.profile.fields.gender.label} iconClass={cms.profile.fields.gender.iconClass}>
                    <select
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                      value={profile.gender}
                      onChange={(e) => setProfile((prev) => ({ ...prev, gender: e.target.value }))}
                    >
                      <option value="MALE">{cms.profile.fields.gender.options.male}</option>
                      <option value="FEMALE">{cms.profile.fields.gender.options.female}</option>
                      <option value="OTHER">{cms.profile.fields.gender.options.other}</option>
                    </select>
                  </Field>

                  <div className="md:col-span-2">
                    <Field label={cms.profile.fields.address.label} iconClass={cms.profile.fields.address.iconClass}>
                      <input
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                        placeholder={cms.profile.fields.address.placeholder}
                        value={profile.address}
                        onChange={(e) => setProfile((prev) => ({ ...prev, address: e.target.value }))}
                      />
                    </Field>
                  </div>

                  <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="text-xs text-slate-500">
                      <i className="fa-solid fa-circle-exclamation mr-2 text-slate-400" />
                      {cms.profile.fields.email.helper}
                    </div>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
                      disabled={loading}
                    >
                      <i className="fa-regular fa-floppy-disk" />
                      {cms.common.actions.save}
                    </button>
                  </div>
                </form>
              )}

              {/* CHANGE PASSWORD */}
              {active === "changePassword" && (
                <div className="space-y-4">
                  {passwordStep === "verifyCurrent" ? (
                    <form className="grid gap-4 md:grid-cols-2" onSubmit={onVerifyCurrentPassword}>
                      <div className="md:col-span-2">
                        <Field
                          label={cms.changePassword.steps.verifyCurrent.currentPassword.label}
                          iconClass={cms.changePassword.steps.verifyCurrent.currentPassword.iconClass}
                        >
                          <input
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                            type="password"
                            placeholder={cms.changePassword.steps.verifyCurrent.currentPassword.placeholder}
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                          />
                        </Field>
                      </div>

                      <div className="md:col-span-2 flex justify-end">
                        <button
                          type="submit"
                          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-extrabold text-white hover:bg-slate-800 disabled:opacity-60"
                          disabled={loading}
                        >
                          <i className="fa-solid fa-magnifying-glass" />
                          {cms.changePassword.steps.verifyCurrent.buttonText}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form className="grid gap-4 md:grid-cols-2" onSubmit={onChangePassword}>
                      <Field label={cms.changePassword.steps.setNew.newPassword.label} iconClass={cms.changePassword.steps.setNew.newPassword.iconClass}>
                        <input
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                          type="password"
                          placeholder={cms.changePassword.steps.setNew.newPassword.placeholder}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                        />
                      </Field>

                      <Field
                        label={cms.changePassword.steps.setNew.confirmPassword.label}
                        iconClass={cms.changePassword.steps.setNew.confirmPassword.iconClass}
                      >
                        <input
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                          type="password"
                          placeholder={cms.changePassword.steps.setNew.confirmPassword.placeholder}
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                        />
                      </Field>

                      <div className="md:col-span-2 flex flex-wrap justify-end gap-2 pt-2">
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-50"
                          onClick={() => setPasswordStep("verifyCurrent")}
                          disabled={loading}
                        >
                          <i className="fa-solid fa-arrow-left" />
                          {cms.common.actions.back}
                        </button>

                        <button
                          type="submit"
                          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-extrabold text-white hover:bg-slate-800 disabled:opacity-60"
                          disabled={loading}
                        >
                          <i className="fa-solid fa-key" />
                          {cms.common.actions.updatePassword}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* FORGOT PASSWORD */}
              {active === "forgotPassword" && (
                <div className="space-y-4">
                  {/* Step: email */}
                  {forgotStep === "email" && (
                    <form className="space-y-4" onSubmit={onSendForgotOtp}>
                      <Field label={cms.forgotPassword.steps.email.email.label} iconClass={cms.forgotPassword.steps.email.email.iconClass}>
                        <input
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                          type="email"
                          placeholder={cms.forgotPassword.steps.email.email.placeholder}
                          value={forgotForm.email}
                          onChange={(e) => setForgotForm((prev) => ({ ...prev, email: e.target.value }))}
                        />
                      </Field>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                        <i className="fa-regular fa-envelope mr-2 text-slate-500" />
                        {cms.forgotPassword.noteRegisteredEmail}:{" "}
                        <span className="font-extrabold">{profile.email || "(chưa có)"}</span>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-sm font-extrabold text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
                          disabled={loading}
                        >
                          <i className="fa-solid fa-paper-plane" />
                          {cms.common.actions.sendOtp}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Step: otp */}
                  {forgotStep === "otp" && (
                    <form className="flex flex-col gap-3 md:flex-row md:items-end" onSubmit={onVerifyForgotOtp}>
                      <div className="flex-1">
                        <Field label={cms.forgotPassword.steps.otp.otp.label} iconClass={cms.forgotPassword.steps.otp.otp.iconClass}>
                          <input
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                            type="text"
                            placeholder={cms.forgotPassword.steps.otp.otp.placeholder}
                            value={forgotForm.otp}
                            onChange={(e) => setForgotForm((prev) => ({ ...prev, otp: e.target.value }))}
                          />
                        </Field>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-50"
                          onClick={() => setForgotStep("email")}
                          disabled={loading}
                        >
                          <i className="fa-solid fa-arrow-left" />
                          {cms.common.actions.back}
                        </button>

                        <button
                          type="submit"
                          className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-sm font-extrabold text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
                          disabled={loading}
                        >
                          <i className="fa-solid fa-badge-check" />
                          {cms.common.actions.verifyOtp}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Step: new password */}
                  {forgotStep === "newPassword" && (
                    <form className="grid gap-4 md:grid-cols-2" onSubmit={onForgotPassword}>
                      <Field
                        label={cms.forgotPassword.steps.newPassword.newPassword.label}
                        iconClass={cms.forgotPassword.steps.newPassword.newPassword.iconClass}
                      >
                        <input
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                          type="password"
                          placeholder={cms.forgotPassword.steps.newPassword.newPassword.placeholder}
                          value={forgotForm.newPassword}
                          onChange={(e) => setForgotForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                        />
                      </Field>

                      <Field
                        label={cms.forgotPassword.steps.newPassword.confirmPassword.label}
                        iconClass={cms.forgotPassword.steps.newPassword.confirmPassword.iconClass}
                      >
                        <input
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                          type="password"
                          placeholder={cms.forgotPassword.steps.newPassword.confirmPassword.placeholder}
                          value={forgotForm.confirmPassword}
                          onChange={(e) => setForgotForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                        />
                      </Field>

                      <div className="md:col-span-2 flex flex-wrap justify-end gap-2 pt-2">
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-50"
                          onClick={() => setForgotStep("otp")}
                          disabled={loading}
                        >
                          <i className="fa-solid fa-arrow-left" />
                          {cms.common.actions.back}
                        </button>

                        <button
                          type="submit"
                          className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-sm font-extrabold text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
                          disabled={loading}
                        >
                          <i className="fa-solid fa-rotate" />
                          {cms.common.actions.resetPassword}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* MY ORDERS (cập nhật giao diện) */}
              {active === "myOrders" && (
                <div className="space-y-4">
                  {/* Bộ lọc */}
                  <div className="grid gap-3 md:grid-cols-[1fr_220px]">
                    <Field label={cms.myOrders.filters.keyword.label} iconClass={cms.myOrders.filters.keyword.iconClass}>
                      <input
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                        type="text"
                        placeholder={cms.myOrders.filters.keyword.placeholder}
                        value={orderKeyword}
                        onChange={(e) => setOrderKeyword(e.target.value)}
                      />
                    </Field>

                    <Field label={cms.myOrders.filters.status.label} iconClass={cms.myOrders.filters.status.iconClass}>
                      <select
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                        value={orderStatusFilter}
                        onChange={(e) => setOrderStatusFilter(e.target.value as "all" | OrderStatus)}
                      >
                        <option value="all">{cms.myOrders.filters.status.all}</option>
                        <option value="processing">{cms.myOrders.statuses.processing}</option>
                        <option value="paid">{cms.myOrders.statuses.paid}</option>
                        <option value="cancelled">{cms.myOrders.statuses.cancelled}</option>
                        <option value="expired">{cms.myOrders.statuses.expired}</option>
                      </select>
                    </Field>
                  </div>

                  {/* Tiêu đề danh sách */}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-sm font-bold text-slate-700">{cms.myOrders.list.title}</p>
                  </div>

                  {/* Trạng thái tải / rỗng */}
                  {ordersLoading ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
                      {cms.common.loadingText}
                    </div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
                      {cms.myOrders.emptyText}
                    </div>
                  ) : (
                    /* Danh sách đơn hàng */
                    <div className="space-y-3">
                      {filteredOrders.map((order) => {
                        const firstItem = order.items[0]; // lấy ảnh đầu tiên
                        return (
                          <article
                            key={order.id}
                            className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4"
                          >
                            {/* Ảnh đại diện */}
                            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                              {firstItem ? (
                                <img
                                  src={firstItem.image}
                                  alt={firstItem.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-slate-400">
                                  <i className="fa-solid fa-box-open text-2xl" />
                                </div>
                              )}
                            </div>

                            {/* Thông tin */}
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <h3 className="truncate text-sm font-semibold text-slate-900">
                                  {order.code}
                                </h3>
                                <span
                                  className={classNames(
                                    "inline-flex shrink-0 rounded-full border px-3 py-1 text-xs font-bold",
                                    ORDER_STATUS_STYLES[order.status]
                                  )}
                                >
                                  {cms.myOrders.statuses[order.status]}
                                </span>
                              </div>

                              <p className="mt-1 text-xs text-slate-500">
                                {formatDate(order.createdAt)} • {order.payment.method}
                              </p>

                              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                                <p className="text-lg font-extrabold text-slate-900">
                                  {formatMoney(order.pricing.total)}
                                </p>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const res = await http.get<ApiProductOrder>(`/api/product-orders/${order.id}`);
                                      setSelectedOrder(toMyOrder(res.data));
                                    } catch {
                                      setSelectedOrder(order);
                                    }
                                  }}
                                  className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-extrabold text-indigo-700 hover:bg-indigo-100"
                                >
                                  <i className="fa-regular fa-eye" />
                                  {cms.myOrders.list.seeDetail}
                                </button>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}

                  {/* Modal chi tiết đơn hàng */}
                  {selectedOrder && (
                    <div
                      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/50 px-4 py-6"
                      onClick={() => setSelectedOrder(null)}
                    >
                      <div
                        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl md:p-6"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Header modal */}
                        <div className="mb-5 flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                              {cms.myOrders.detailTitle}
                            </p>
                            <h3 className="text-xl font-extrabold text-slate-900">{selectedOrder.code}</h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(null)}
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                          >
                            <i className="fa-solid fa-xmark" />
                          </button>
                        </div>

                        {/* Nội dung modal chia thành các khối */}
                        <div className="space-y-5">
                          {/* Khối thông tin chung */}
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <h4 className="mb-3 text-sm font-extrabold text-slate-900">
                              <i className="fa-regular fa-clipboard mr-2 text-slate-500" />
                              Thông tin chung
                            </h4>
                            <div className="grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                              <p>
                                <span className="font-semibold">{cms.myOrders.fields.createdAt}:</span>{' '}
                                {formatDate(selectedOrder.createdAt)}
                              </p>
                              <p>
                                <span className="font-semibold">{cms.myOrders.fields.branch}:</span>{' '}
                                {selectedOrder.branch}
                              </p>
                              <p>
                                <span className="font-semibold">Trạng thái:</span>{' '}
                                <span
                                  className={classNames(
                                    'inline-flex rounded-full border px-2 py-0.5 text-xs font-bold',
                                    ORDER_STATUS_STYLES[selectedOrder.status]
                                  )}
                                >
                                  {cms.myOrders.statuses[selectedOrder.status]}
                                </span>
                              </p>
                            </div>
                          </div>

                          {/* Khối thanh toán */}
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <h4 className="mb-3 text-sm font-extrabold text-slate-900">
                              <i className="fa-regular fa-credit-card mr-2 text-slate-500" />
                              Thanh toán
                            </h4>
                            <div className="grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                              <p>
                                <span className="font-semibold">{cms.myOrders.fields.paymentMethod}:</span>{' '}
                                {selectedOrder.payment.method}
                              </p>
                              <p>
                                <span className="font-semibold">{cms.myOrders.fields.paymentRef}:</span>{' '}
                                {selectedOrder.payment.ref || '—'}
                              </p>
                              <p>
                                <span className="font-semibold">{cms.myOrders.fields.paidAt}:</span>{' '}
                                {formatDate(selectedOrder.payment.paidAt)}
                              </p>
                            </div>
                          </div>

                          {/* Khối giao hàng */}
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <h4 className="mb-3 text-sm font-extrabold text-slate-900">
                              <i className="fa-solid fa-truck mr-2 text-slate-500" />
                              Giao hàng
                            </h4>
                            <div className="grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                              <p>
                                <span className="font-semibold">{cms.myOrders.fields.receiver}:</span>{' '}
                                {selectedOrder.shippingInfo.receiverName}
                              </p>
                              <p>
                                <span className="font-semibold">{cms.myOrders.fields.phone}:</span>{' '}
                                {selectedOrder.shippingInfo.phone}
                              </p>
                              <p className="md:col-span-2">
                                <span className="font-semibold">{cms.myOrders.fields.address}:</span>{' '}
                                {`${selectedOrder.shippingInfo.addressLine}, ${selectedOrder.shippingInfo.district}, ${selectedOrder.shippingInfo.city}`}
                              </p>
                              <p>
                                <span className="font-semibold">{cms.myOrders.fields.carrier}:</span>{' '}
                                {selectedOrder.shippingInfo.carrier}
                              </p>
                              <p>
                                <span className="font-semibold">{cms.myOrders.fields.trackingCode}:</span>{' '}
                                {selectedOrder.shippingInfo.trackingCode || '—'}
                              </p>
                              <p>
                                <span className="font-semibold">{cms.myOrders.fields.expectedDelivery}:</span>{' '}
                                {formatDate(selectedOrder.shippingInfo.expectedDelivery)}
                              </p>
                              <p className="md:col-span-2">
                                <span className="font-semibold">{cms.myOrders.fields.shippingNote}:</span>{' '}
                                {selectedOrder.shippingInfo.note}
                              </p>
                            </div>
                          </div>

                          {/* Khối sản phẩm */}
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <h4 className="mb-3 text-sm font-extrabold text-slate-900">
                              <i className="fa-solid fa-boxes-stacked mr-2 text-slate-500" />
                              {cms.myOrders.productsTitle}
                            </h4>
                            <div className="space-y-3">
                              {selectedOrder.items.map((item) => (
                                <div
                                  key={item.sku}
                                  className="grid items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 md:grid-cols-[64px_1fr_auto]"
                                >
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="h-16 w-16 rounded-xl object-cover"
                                  />
                                  <div>
                                    <p className="font-bold text-slate-900">{item.name}</p>
                                    <p className="text-xs text-slate-500">
                                      {cms.myOrders.fields.sku}: {item.sku}
                                    </p>
                                  </div>
                                  <div className="text-right text-sm text-slate-700">
                                    <p>
                                      {cms.myOrders.fields.quantity}: x{item.qty}
                                    </p>
                                    <p className="font-bold text-slate-900">{formatMoney(item.price)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Khối tổng kết */}
                          <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                              <p>
                                <span className="font-semibold">{cms.myOrders.fields.subtotal}:</span>{' '}
                                {formatMoney(selectedOrder.pricing.subtotal)}
                              </p>
                              <p>
                                <span className="font-semibold">{cms.myOrders.fields.shipping}:</span>{' '}
                                {formatMoney(selectedOrder.pricing.shipping)}
                              </p>
                              <p>
                                <span className="font-semibold">{cms.myOrders.fields.discount}:</span> -
                                {formatMoney(selectedOrder.pricing.discount)}
                              </p>
                              <p className="font-extrabold text-slate-900">
                                <span>{cms.myOrders.fields.total}:</span>{' '}
                                {formatMoney(selectedOrder.pricing.total)}
                              </p>
                            </div>
                          </div>

                          {/* Ghi chú đơn hàng nếu có */}
                          {selectedOrder.note && selectedOrder.note !== '-' && (
                            <div className="rounded-2xl border border-slate-200 bg-amber-50/50 p-4">
                              <p className="text-sm font-semibold text-slate-700">
                                <i className="fa-regular fa-note-sticky mr-2 text-slate-500" />
                                {cms.myOrders.fields.orderNote}:
                              </p>
                              <p className="mt-1 text-sm text-slate-600">{selectedOrder.note}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

// Export CMS mặc định (để update DB / tái sử dụng)
export { defaultCmsData as cmsData, defaultCmsData, deepMerge };
