// AccountCenter.tsx
import React, { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { authApi } from "../api/auth.api";
import { http } from "../api/http";
import {
  coursePlansApi,
  type CoursePass,
  type CoursePassStatus,
  type CoursePlan,
  type CoursePlanCheckoutMethod,
  type CoursePlanPayment,
  type CoursePlanPaymentStatus,
} from "../api/coursePlans.api";
import ProfileTab from "./account-center/components/ProfileTab";
import ChangePasswordTab from "./account-center/components/ChangePasswordTab";
import ForgotPasswordTab from "./account-center/components/ForgotPasswordTab";
import MyOrdersTab from "./account-center/components/MyOrdersTab";
import SubscriptionsTab from "./account-center/components/SubscriptionsTab";

type ToastKind = "success" | "error" | "info";
type ActiveSection = "profile" | "changePassword" | "forgotPassword" | "myOrders" | "subscriptions";
type PassRenewalState = "AUTO_RENEW_ACTIVE" | "AUTO_RENEW_CANCELED" | "NONE";
type PassDisplayStatus = CoursePassStatus | "SCHEDULED";

type OrderStatus =
    | "PENDING"
    | "PENDING_PAYMENT"
    | "CANCEL_REQUESTED"
    | "PAID"
    | "SHIPPING"
    | "SUCCESS"
    | "CANCELLED"
    | "EXPIRED";

type MyOrderItem = {
  name: string;
  sku: string;
  qty: number;
  price: number;
  image: string;
};

type PaymentQrPayload = {
  amount: number;
  expiresAt?: string | null;
  accountName: string;
  accountNumber: string;
  bankName: string;
  bankCode: string;
  transferContent: string;
  qrUrl: string;
};

type MyOrder = {
  id: number;
  code: string;
  status: OrderStatus;
  createdAt: string;
  expiresAt?: string | null;
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
  expiresAt?: string | null;
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
    emptyValue: string;
    validationTitle: string;
    labels: {
      noEmail: string;
    };
    aria: {
      closeToast: string;
    };
    actions: {
      back: string;
      save: string;
      verify: string;
      sendOtp: string;
      verifyOtp: string;
      resetPassword: string;
      updatePassword: string;
      close: string;
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
    branchOnline: string;
    paymentMethods: {
      sepay: string;
      cod: string;
      unknown: string;
    };
    filters: {
      keyword: { label: string; placeholder: string; iconClass: string };
      status: { label: string; iconClass: string; all: string };
    };
    list: {
      title: string;
      seeDetail: string;
      pay: string;
      generatingQr: string;
    };
    statuses: Record<"all" | OrderStatus, string>;
    emptyText: string;
    detailTitle: string;
    productsTitle: string;
    sections: {
      general: string;
      payment: string;
      shipping: string;
      summary: string;
    };
    fields: {
      createdAt: string;
      branch: string;
      status: string;
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
      amount: string;
      transferContent: string;
      expiresAt: string;
      timeLeft: string;
      orderCode: string;
    };
    actions: {
      requestCancel: string;
      requestingCancel: string;
      payThisOrder: string;
    };
    qrModal: {
      title: string;
      qrAlt: string;
      expiredTitle: string;
      expiredSubtitle: string;
      activeHint: string;
      expiredBoxTitle: string;
      expiredBoxSubtitle: string;
      autoUpdateNote: string;
      expiresAtTitle: string;
    };
    toasts: {
      loadFailed: { title: string; message: string };
      qrFailed: { title: string; message: string };
      cancelRequestSuccess: { title: string; message: string };
      cancelRequestFailed: { title: string; message: string };
      paymentSuccess: { title: string; message: string };
      paymentExpired: { title: string; message: string };
    };
  };

  subscriptions: {
    cardTitle: string;
    cardDesc?: string;
    summary: {
      currentPlanTitle: string;
      cycleLabel: string;
      graceUntilLabel: string;
      remainingQuota: string;
      unlockedCount: string;
      unlockNew: string;
      canUnlockYes: string;
      canUnlockNo: string;
      noActivePass: string;
    };
    planList: {
      title: string;
      emptyText: string;
    };
    planCard: {
      quotaLabel: string;
      perCycleLabel: string;
      durationLabel: string;
      graceLabel: string;
      maxCoursePriceLabel: string;
      unlimited: string;
      blockedTagsLabel: string;
      noBlockedTags: string;
      durationUnits: {
        month: string;
        day: string;
      };
    };
    history: {
      passTitle: string;
      passEmptyText: string;
      paymentTitle: string;
      paymentEmptyText: string;
      remainingQuota: string;
      unlockCount: string;
      paymentCode: string;
      amount: string;
      createdAt: string;
      transferContent: string;
      paidAt: string;
    };
    actions: {
      processing: string;
      renewOrBuyMore: string;
      subscribe: string;
      openPaymentQr: string;
      renewNow: string;
      registerAutoRenewal: string;
      cancelAutoRenewal: string;
      cancelAutoRenewalConfirmMessage: string;
    };
    statuses: {
      pass: Record<CoursePassStatus, string>;
      payment: Record<CoursePlanPaymentStatus, string>;
    };
    qrModal: {
      title: string;
      planLabel: string;
      qrAlt: string;
      amount: string;
      transferContent: string;
      timeLeft: string;
      expiresAt: string;
      expiredMessage: string;
      waitingMessage: string;
    };
    toasts: {
      loadFailed: { title: string; message: string };
      registerSuccess: { title: string; message: string };
      qrCreated: { title: string; message: string };
      checkoutFailed: { title: string; message: string };
      paymentSuccess: { title: string; message: string };
      paymentExpired: { title: string; message: string };
      cancelAutoRenewalSuccess: { title: string; message: string };
      cancelAutoRenewalAlready: { title: string; message: string };
      cancelAutoRenewalFailed: { title: string; message: string };
      resumeAutoRenewalSuccess: { title: string; message: string };
      resumeAutoRenewalAlready: { title: string; message: string };
      resumeAutoRenewalFailed: { title: string; message: string };
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
        desc: "Xem và lọc các đơn đã đặt",
        iconClass: "fa-solid fa-box-open",
      },
      {
        key: "subscriptions",
        label: "Gói đăng ký",
        desc: "Quản lý quota và lịch sử gia hạn",
        iconClass: "fa-solid fa-layer-group",
      },
    ],
    footerHint: "Mẹo: Hãy đặt mật khẩu mạnh và không chia sẻ OTP.",
  },

  common: {
    loadingText: "Đang xử lý...",
    requiredMark: "*",
    emptyValue: "—",
    validationTitle: "Dữ liệu chưa hợp lệ",
    labels: {
      noEmail: "(chưa có)",
    },
    aria: {
      closeToast: "Đóng thông báo",
    },
    actions: {
      back: "Quay lại",
      save: "Lưu thay đổi",
      verify: "Kiểm tra",
      sendOtp: "Gửi OTP",
      verifyOtp: "Xác nhận OTP",
      resetPassword: "Đặt lại mật khẩu",
      updatePassword: "Cập nhật mật khẩu",
      close: "Đóng",
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
    branchOnline: "Online",
    paymentMethods: {
      sepay: "Chuyển khoản",
      cod: "COD",
      unknown: "Không xác định",
    },
    filters: {
      keyword: { label: "Tìm đơn", placeholder: "Mã đơn, mã giao vận, ghi chú...", iconClass: "fa-solid fa-magnifying-glass" },
      status: { label: "Trạng thái", iconClass: "fa-solid fa-filter", all: "Tất cả" },
    },
    list: {
      title: "Danh sách đơn hàng",
      seeDetail: "Xem chi tiết đơn hàng",
      pay: "Thanh toán",
      generatingQr: "Đang tạo QR...",
    },
    statuses: {
      all: "Tất cả",
      PENDING: "Chờ xác nhận",
      PENDING_PAYMENT: "Chờ thanh toán",
      CANCEL_REQUESTED: "Yêu cầu hủy",
      PAID: "Đã thanh toán",
      SHIPPING: "Đang giao hàng",
      SUCCESS: "Hoàn thành",
      CANCELLED: "Đã hủy",
      EXPIRED: "Hết hạn",
    },
    emptyText: "Không có đơn hàng phù hợp bộ lọc.",
    detailTitle: "Chi tiết đơn hàng",
    productsTitle: "Sản phẩm đã đặt",
    sections: {
      general: "Thông tin chung",
      payment: "Thanh toán",
      shipping: "Giao hàng",
      summary: "Tổng kết thanh toán",
    },
    fields: {
      createdAt: "Ngày tạo",
      branch: "Chi nhánh",
      status: "Trạng thái",
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
      amount: "Số tiền",
      transferContent: "Nội dung CK",
      expiresAt: "Hạn thanh toán",
      timeLeft: "Còn lại",
      orderCode: "Đơn hàng",
    },
    actions: {
      requestCancel: "Yêu cầu hủy đơn",
      requestingCancel: "Đang gửi yêu cầu hủy...",
      payThisOrder: "Thanh toán đơn hàng này",
    },
    qrModal: {
      title: "Quét mã QR để thanh toán",
      qrAlt: "QR thanh toán",
      expiredTitle: "Hết hạn thanh toán",
      expiredSubtitle: "Đơn hàng của bạn đã chuyển sang trạng thái hết hạn.",
      activeHint: "Vui lòng hoàn tất thanh toán trong 15 phút kể từ lúc tạo đơn.",
      expiredBoxTitle: "Hết hạn thanh toán",
      expiredBoxSubtitle: "Đơn hàng của bạn đã chuyển sang trạng thái hết hạn.",
      autoUpdateNote: "Sau khi thanh toán thành công, hệ thống sẽ tự động cập nhật trạng thái đơn hàng.",
      expiresAtTitle: "Hạn",
    },
    toasts: {
      loadFailed: { title: "Đơn hàng", message: "Không tải được danh sách đơn hàng." },
      qrFailed: { title: "Thanh toán", message: "Không lấy được mã QR thanh toán." },
      cancelRequestSuccess: { title: "Đơn hàng", message: "Đã gửi yêu cầu hủy đơn thành công." },
      cancelRequestFailed: { title: "Đơn hàng", message: "Không thể gửi yêu cầu hủy đơn." },
      paymentSuccess: { title: "Thanh toán", message: "Đã thanh toán thành công. Đơn hàng đã được cập nhật." },
      paymentExpired: { title: "Thanh toán", message: "Phiên thanh toán đã hết hạn hoặc bị huỷ. Vui lòng tạo lại mã QR nếu cần." },
    },
  },

  subscriptions: {
    cardTitle: "Gói đăng ký",
    cardDesc: "Đăng ký gói, theo dõi quota và lịch sử gia hạn.",
    summary: {
      currentPlanTitle: "Gói hiện tại",
      cycleLabel: "Chu kỳ",
      graceUntilLabel: "Grace đến",
      remainingQuota: "Quota còn lại",
      unlockedCount: "Đã mở khóa",
      unlockNew: "Mở khóa mới",
      canUnlockYes: "Có",
      canUnlockNo: "Không",
      noActivePass: "Bạn chưa có gói đang hoạt động. Hãy chọn một gói bên dưới để đăng ký.",
    },
    planList: {
      title: "Danh sách gói hiện có",
      emptyText: "Chưa có gói nào đang mở.",
    },
    planCard: {
      quotaLabel: "Quota",
      perCycleLabel: "khóa học / chu kỳ",
      durationLabel: "Thời hạn",
      graceLabel: "grace",
      maxCoursePriceLabel: "Giới hạn giá khóa học",
      unlimited: "Không giới hạn",
      blockedTagsLabel: "Tag bị chặn",
      noBlockedTags: "Không có",
      durationUnits: {
        month: "tháng",
        day: "ngày",
      },
    },
    history: {
      passTitle: "Lịch sử pass / gia hạn",
      passEmptyText: "Chưa có lịch sử đăng ký gói.",
      paymentTitle: "Lịch sử thanh toán gói",
      paymentEmptyText: "Chưa có lịch sử thanh toán.",
      remainingQuota: "Quota còn lại",
      unlockCount: "Số lần mở khóa",
      paymentCode: "Mã thanh toán",
      amount: "Số tiền",
      createdAt: "Tạo lúc",
      transferContent: "Nội dung CK",
      paidAt: "Thanh toán lúc",
    },
    actions: {
      processing: "Đang xử lý...",
      renewOrBuyMore: "Gia hạn / mua tiếp",
      subscribe: "Đăng ký gói",
      openPaymentQr: "Mở QR thanh toán",
      renewNow: "Gia h\u1ea1n",
      registerAutoRenewal: "\u0110\u0103ng k\u00fd t\u1ef1 \u0111\u1ed9ng gia h\u1ea1n",
      cancelAutoRenewal: "H\u1ee7y t\u1ef1 \u0111\u1ed9ng gia h\u1ea1n",
      cancelAutoRenewalConfirmMessage:
        "G\u00f3i hi\u1ec7n t\u1ea1i v\u1eabn d\u00f9ng \u0111\u1ebfn h\u1ebft chu k\u1ef3, nh\u01b0ng s\u1ebd kh\u00f4ng t\u1ef1 \u0111\u1ed9ng gia h\u1ea1n k\u1ef3 ti\u1ebfp theo. B\u1ea1n c\u00f3 ch\u1eafc ch\u1eafn h\u1ee7y kh\u00f4ng?",
    },
    statuses: {
      pass: {
        ACTIVE: "Đang hoạt động",
        GRACE: "Grace",
        EXPIRED: "Hết hạn",
        CANCELED: "Đã hủy",
      },
      payment: {
        PENDING: "Chờ thanh toán",
        PAID: "Đã thanh toán",
        FAILED: "Thất bại",
        EXPIRED: "Hết hạn",
      },
    },
    qrModal: {
      title: "Thanh toán gói bằng Sepay",
      planLabel: "Gói",
      qrAlt: "QR thanh toán gói",
      amount: "Số tiền",
      transferContent: "Nội dung CK",
      timeLeft: "Còn lại",
      expiresAt: "Hết hạn",
      expiredMessage: "QR đã hết hạn. Vui lòng tạo lại thanh toán.",
      waitingMessage: "Sau khi chuyển khoản đúng nội dung, hệ thống sẽ tự động cập nhật pass và quota.",
    },
    toasts: {
      loadFailed: { title: "Gói đăng ký", message: "Không tải được dữ liệu gói đăng ký." },
      registerSuccess: { title: "Gói đăng ký", message: "Đăng ký gói thành công." },
      qrCreated: { title: "Gói đăng ký", message: "Đã tạo QR thanh toán cho gói học." },
      checkoutFailed: { title: "Gói đăng ký", message: "Không thể tạo thanh toán cho gói này." },
      paymentSuccess: { title: "Gói đăng ký", message: "Thanh toán gói thành công. Quota đã được cập nhật." },
      paymentExpired: { title: "Gói đăng ký", message: "Phiên thanh toán gói đã hết hạn hoặc thất bại." },
      cancelAutoRenewalSuccess: { title: "Gói đăng ký", message: "Đã hủy tự động gia hạn thành công." },
      cancelAutoRenewalAlready: { title: "Gói đăng ký", message: "Gói này đã ở trạng thái không tự động gia hạn." },
      cancelAutoRenewalFailed: { title: "Gói đăng ký", message: "Không thể hủy tự động gia hạn." },

      resumeAutoRenewalSuccess: { title: "Gói đăng ký", message: "Đã bật lại tự động gia hạn thành công." },
      resumeAutoRenewalAlready: { title: "Gói đăng ký", message: "Gói này đã bật tự động gia hạn." },
      resumeAutoRenewalFailed: { title: "Gói đăng ký", message: "Không thể bật lại tự động gia hạn." },
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
                      closeLabel,
                    }: {
  toasts: Array<{ id: string; kind: ToastKind; title: string; message: string }>;
  onClose: (id: string) => void;
  closeLabel: string;
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
                        aria-label={closeLabel}
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


const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  PENDING_PAYMENT: "bg-orange-50 text-orange-700 border-orange-200",
  CANCEL_REQUESTED: "bg-red-50 text-red-700 border-red-200",
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  SHIPPING: "bg-sky-50 text-sky-700 border-sky-200",
  SUCCESS: "bg-green-50 text-green-700 border-green-200",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
  EXPIRED: "bg-slate-100 text-slate-700 border-slate-200",
};

const PASS_STATUS_STYLES: Record<PassDisplayStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  GRACE: "bg-amber-50 text-amber-700 border-amber-200",
  EXPIRED: "bg-slate-100 text-slate-700 border-slate-200",
  CANCELED: "bg-rose-50 text-rose-700 border-rose-200",
  SCHEDULED: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

const PLAN_PAYMENT_STATUS_STYLES: Record<CoursePlanPaymentStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  FAILED: "bg-rose-50 text-rose-700 border-rose-200",
  EXPIRED: "bg-slate-100 text-slate-700 border-slate-200",
};

function getPassStatusLabel(
    status: PassDisplayStatus,
    labels: CmsData["subscriptions"]["statuses"]["pass"],
) {
  if (status === "SCHEDULED") return "Đã lên lịch";
  return labels[status as CoursePassStatus];
}

function getPaymentStatusLabel(
    status: CoursePlanPaymentStatus,
    labels: CmsData["subscriptions"]["statuses"]["payment"],
) {
  return labels[status];
}

function formatDurationDays(
    days: number,
    durationUnits: CmsData["subscriptions"]["planCard"]["durationUnits"],
) {
  if (days % 30 === 0) {
    const months = Math.floor(days / 30);
    return `${months} ${durationUnits.month}`;
  }
  return `${days} ${durationUnits.day}`;
}

function toNum(v: number | string | null | undefined) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function toTime(value: string | null | undefined) {
  if (!value) return null;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? null : t;
}

function getPassDisplayStatus(pass: CoursePass, now = Date.now()): PassDisplayStatus {
  const start = toTime(pass.startAt);
  if (!pass.canceledAt && start != null && start > now) return "SCHEDULED";
  return pass.computedStatus;
}

function mapOrderStatus(status: string): OrderStatus {
  const s = String(status || "").toUpperCase();

  switch (s) {
    case "PENDING":
      return "PENDING";
    case "PENDING_PAYMENT":
      return "PENDING_PAYMENT";
    case "PAID":
      return "PAID";
    case "CANCEL_REQUESTED":
      return "CANCEL_REQUESTED";
    case "SHIPPING":
      return "SHIPPING";
    case "SUCCESS":
      return "SUCCESS";
    case "CANCELLED":
      return "CANCELLED";
    case "EXPIRED":
      return "EXPIRED";
    default:
      // fallback an toàn nếu backend gửi status lạ
      return "PENDING";
  }
}

function mapPaymentMethod(
    method: string,
    labels: CmsData["myOrders"]["paymentMethods"],
    emptyValue: string,
): string {
  const m = String(method || "").toUpperCase();
  if (m === "SEPAY") return labels.sepay;
  if (m === "COD") return labels.cod;
  return m || labels.unknown || emptyValue;
}

function toMyOrder(apiOrder: ApiProductOrder, cmsData: CmsData): MyOrder {
  return {
    id: apiOrder.id,
    code: apiOrder.code,
    status: mapOrderStatus(apiOrder.status),
    createdAt: apiOrder.createdAt,
    expiresAt: apiOrder.expiresAt || null,
    branch: cmsData.myOrders.branchOnline,
    payment: {
      method: mapPaymentMethod(apiOrder.paymentMethod, cmsData.myOrders.paymentMethods, cmsData.common.emptyValue),
      paidAt: apiOrder.paidAt,
      ref: apiOrder.paymentCode,
    },
    pricing: {
      subtotal: toNum(apiOrder.subtotal),
      shipping: toNum(apiOrder.shippingFee),
      discount: toNum(apiOrder.discount),
      total: toNum(apiOrder.total),
    },
    note: apiOrder.note || cmsData.common.emptyValue,
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
      district: apiOrder.district || cmsData.common.emptyValue,
      city: apiOrder.city || cmsData.common.emptyValue,
      carrier: apiOrder.shippingUnit || cmsData.common.emptyValue,
      trackingCode: apiOrder.trackingCode || null,
      expectedDelivery: apiOrder.expectedDelivery || apiOrder.createdAt,
      note: apiOrder.note || cmsData.common.emptyValue,
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

function formatDateTime(date: string | null | undefined) {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("vi-VN");
}

export default function AccountCenter() {
  const [active, setActive] = useState<ActiveSection>("profile");
  const [searchParams] = useSearchParams();

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
  const [payingOrderId, setPayingOrderId] = useState<number | null>(null);
  const [qrModalOrder, setQrModalOrder] = useState<MyOrder | null>(null);
  const [qrPayload, setQrPayload] = useState<PaymentQrPayload | null>(null);
  // ⏳ QR countdown (tick mỗi giây để render lại thời gian còn lại)
  const [qrTick, setQrTick] = useState<number>(() => Date.now());
  const [cancelRequestingOrderId, setCancelRequestingOrderId] = useState<number | null>(null);

  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionActionPlanId, setSubscriptionActionPlanId] = useState<number | null>(null);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [publicPlans, setPublicPlans] = useState<CoursePlan[]>([]);
  const [myPasses, setMyPasses] = useState<CoursePass[]>([]);
  const [myPlanPayments, setMyPlanPayments] = useState<CoursePlanPayment[]>([]);
  const [focusedPlanId, setFocusedPlanId] = useState<number | null>(null);
  const [planPaymentModal, setPlanPaymentModal] = useState<CoursePlanPayment | null>(null);
  const [planQrTick, setPlanQrTick] = useState<number>(() => Date.now());

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

  const subscriptionSidebarItem = useMemo(
      () =>
          defaultCmsData.sidebar.items.find((item) => item.key === "subscriptions") ?? {
            key: "subscriptions" as ActiveSection,
            label: defaultCmsData.subscriptions.cardTitle,
            desc: defaultCmsData.subscriptions.cardDesc,
            iconClass: "fa-solid fa-layer-group",
          },
      [],
  );

  const sidebarItems = useMemo(() => {
    if (cms.sidebar.items.some((item) => item.key === "subscriptions")) {
      return cms.sidebar.items;
    }
    return [...cms.sidebar.items, subscriptionSidebarItem];
  }, [cms.sidebar.items, subscriptionSidebarItem]);

  const activeMeta = useMemo(() => sidebarItems.find((x) => x.key === active), [active, sidebarItems]);

  // ⏳ Tick countdown khi đang mở modal QR
  useEffect(() => {
    if (!qrModalOrder || !qrPayload) return;
    setQrTick(Date.now());
    const t = window.setInterval(() => setQrTick(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [qrModalOrder, qrPayload]);

  useEffect(() => {
    if (!planPaymentModal?.sepay) return;
    setPlanQrTick(Date.now());
    const t = window.setInterval(() => setPlanQrTick(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [planPaymentModal?.id, planPaymentModal?.sepay?.expiresAt]);

  const qrExpiresAt = useMemo(() => {
    return qrPayload?.expiresAt || qrModalOrder?.expiresAt || null;
  }, [qrPayload?.expiresAt, qrModalOrder?.expiresAt]);

  const qrCountdown = useMemo(() => {
    if (!qrExpiresAt) return { expired: false, remainingSec: null as number | null, text: "—" };

    const expiresMs = new Date(qrExpiresAt).getTime();
    if (Number.isNaN(expiresMs)) return { expired: false, remainingSec: null as number | null, text: "—" };

    const diffMs = expiresMs - qrTick;
    const remainingSec = Math.max(0, Math.floor(diffMs / 1000));
    const expired = remainingSec <= 0;

    const mm = String(Math.floor(remainingSec / 60)).padStart(2, "0");
    const ss = String(remainingSec % 60).padStart(2, "0");
    return { expired, remainingSec, text: `${mm}:${ss}` };
  }, [qrExpiresAt, qrTick]);

  const planQrExpiresAt = useMemo(() => {
    return planPaymentModal?.sepay?.expiresAt || planPaymentModal?.expiredAt || null;
  }, [planPaymentModal?.sepay?.expiresAt, planPaymentModal?.expiredAt]);

  const planQrCountdown = useMemo(() => {
    if (!planQrExpiresAt) return { expired: false, text: "--:--" };

    const expiresMs = new Date(planQrExpiresAt).getTime();
    if (Number.isNaN(expiresMs)) return { expired: false, text: "--:--" };

    const diffMs = expiresMs - planQrTick;
    const remainingSec = Math.max(0, Math.floor(diffMs / 1000));
    const expired = remainingSec <= 0;
    const mm = String(Math.floor(remainingSec / 60)).padStart(2, "0");
    const ss = String(remainingSec % 60).padStart(2, "0");

    return { expired, text: `${mm}:${ss}` };
  }, [planQrExpiresAt, planQrTick]);


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

  const currentPass = useMemo(() => {
    const now = Date.now();
    return myPasses.find((pass) => {
      const status = getPassDisplayStatus(pass, now);
      return status === "ACTIVE" || status === "GRACE" || status === "SCHEDULED";
    }) || null;
  }, [myPasses]);

  const passHistory = useMemo(() => {
    return [...myPasses].sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
  }, [myPasses]);

  const paymentHistory = useMemo(() => {
    return [...myPlanPayments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [myPlanPayments]);

  const latestSubscriptionPaymentForCurrentPass = useMemo(() => {
    if (!currentPass) return null;
    const subscriptionPayments = myPlanPayments
      .filter((payment) => payment.planId === currentPass.planId && (payment.stripeSubscriptionId || payment.subscription))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return subscriptionPayments[0] || null;
  }, [currentPass, myPlanPayments]);

  const currentPassRenewalState = useMemo<PassRenewalState>(() => {
    const latest = latestSubscriptionPaymentForCurrentPass;
    if (!latest) return "NONE";

    const status = String(latest.subscriptionStatus ?? latest.subscription?.status ?? "").toLowerCase();
    const cancelAtPeriodEnd = Boolean(latest.cancelAtPeriodEnd ?? latest.subscription?.cancelAtPeriodEnd);

    if (cancelAtPeriodEnd || status === "canceled") {
      return "AUTO_RENEW_CANCELED";
    }

    if (["active", "trialing", "past_due", "unpaid", "incomplete"].includes(status)) {
      return "AUTO_RENEW_ACTIVE";
    }

    return "NONE";
  }, [latestSubscriptionPaymentForCurrentPass]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "subscriptions") {
      setActive("subscriptions");
    }

    const planIdParam = Number(searchParams.get("planId") || 0);
    if (Number.isInteger(planIdParam) && planIdParam > 0) {
      setFocusedPlanId(planIdParam);
    }
  }, [searchParams]);

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


  const fetchMyOrders = useCallback(async (showErrorToast = true) => {
    setOrdersLoading(true);
    try {
      const res = await http.get<ApiProductOrder[]>("/api/product-orders/me");
      const rows = Array.isArray(res.data) ? res.data.map((item) => toMyOrder(item, cms)) : [];
      setMyOrders(rows);
      return rows;
    } catch (e: any) {
      if (showErrorToast) {
        pushToast(
            "error",
            cms.myOrders.toasts.loadFailed.title,
            e?.response?.data?.message || cms.myOrders.toasts.loadFailed.message,
        );
      }
      return [];
    } finally {
      setOrdersLoading(false);
    }
  }, [cms]);

  const fetchSubscriptionData = useCallback(async (showErrorToast = true) => {
    setSubscriptionLoading(true);
    setSubscriptionError(null);

    try {
      const hasToken = Boolean(localStorage.getItem("aya_access_token"));
      const [plans, passes, payments] = await Promise.all([
        coursePlansApi.listPublicPlans(),
        hasToken ? coursePlansApi.listMyPasses() : Promise.resolve([] as CoursePass[]),
        hasToken ? coursePlansApi.listMyPayments() : Promise.resolve([] as CoursePlanPayment[]),
      ]);

      setPublicPlans((Array.isArray(plans) ? plans : []).filter((plan) => plan.isActive).sort((a, b) => a.price - b.price));
      setMyPasses(Array.isArray(passes) ? passes : []);
      setMyPlanPayments(Array.isArray(payments) ? payments : []);

      return { plans, passes, payments };
    } catch (e: any) {
      const message = e?.response?.data?.message || cms.subscriptions.toasts.loadFailed.message;
      setSubscriptionError(message);
      if (showErrorToast) {
        pushToast("error", cms.subscriptions.toasts.loadFailed.title, message);
      }
      return null;
    } finally {
      setSubscriptionLoading(false);
    }
  }, [cms]);

  const onStartPlanCheckout = useCallback(async (plan: CoursePlan, method?: CoursePlanCheckoutMethod) => {
    try {
      setSubscriptionActionPlanId(plan.id);
      const res = await coursePlansApi.purchasePlan(plan.id, method ? { method } : undefined);

      if (res.mode === "FREE") {
        pushToast(
          "success",
          cms.subscriptions.toasts.registerSuccess.title,
          cms.subscriptions.toasts.registerSuccess.message,
        );
        await fetchSubscriptionData(false);
        return;
      }

      if (res.mode === "STRIPE") {
        if (!res.checkoutUrl) {
          throw new Error("Kh\u00f4ng nh\u1eadn \u0111\u01b0\u1ee3c li\u00ean k\u1ebft thanh to\u00e1n Stripe.");
        }
        window.location.href = res.checkoutUrl;
        return;
      }

      setPlanPaymentModal(res.payment);
      setPlanQrTick(Date.now());
      pushToast(
        "info",
        cms.subscriptions.toasts.qrCreated.title,
        cms.subscriptions.toasts.qrCreated.message,
      );
    } catch (e: any) {
      pushToast(
        "error",
        cms.subscriptions.toasts.checkoutFailed.title,
        e?.response?.data?.message || e?.message || cms.subscriptions.toasts.checkoutFailed.message,
      );
    } finally {
      setSubscriptionActionPlanId(null);
    }
  }, [fetchSubscriptionData, cms]);

  const onCancelAutoRenewal = useCallback(async (pass: CoursePass) => {
    const confirmMessage = cms.subscriptions.actions.cancelAutoRenewalConfirmMessage;

    // if (!window.confirm(confirmMessage)) {
    //   return;
    // }

    try {
      setSubscriptionActionPlanId(pass.plan.id);
      const result = await coursePlansApi.cancelAutoRenewal({ passId: pass.id, planId: pass.plan.id });
      pushToast(
        "success",
        cms.subscriptions.toasts.cancelAutoRenewalSuccess.title,
        result?.alreadyCanceled
          ? cms.subscriptions.toasts.cancelAutoRenewalAlready.message
          : cms.subscriptions.toasts.cancelAutoRenewalSuccess.message,
      );
      await fetchSubscriptionData(false);
    } catch (e: any) {
      pushToast(
        "error",
        cms.subscriptions.toasts.cancelAutoRenewalFailed.title,
        e?.response?.data?.message || cms.subscriptions.toasts.cancelAutoRenewalFailed.message,
      );
    } finally {
      setSubscriptionActionPlanId(null);
    }
  }, [fetchSubscriptionData, cms]);

  const onResumeAutoRenewal = useCallback(async (pass: CoursePass) => {
    try {
      setSubscriptionActionPlanId(pass.plan.id);
      const result = await coursePlansApi.resumeAutoRenewal({ passId: pass.id, planId: pass.plan.id });
      pushToast(
        "success",
        cms.subscriptions.toasts.resumeAutoRenewalSuccess.title,
        result?.alreadyResumed
          ? cms.subscriptions.toasts.resumeAutoRenewalAlready.message
          : cms.subscriptions.toasts.resumeAutoRenewalSuccess.message,
      );
      await fetchSubscriptionData(false);
      return true;
    } catch (e: any) {
      const message = String(e?.response?.data?.message || e?.message || "");
      const normalized = message.toLowerCase();
      const shouldFallbackCheckout =
        normalized.includes("not found") ||
        normalized.includes("kh\u00f4ng t\u00ecm th\u1ea5y") ||
        normalized.includes("ended") ||
        normalized.includes("expired") ||
        normalized.includes("h\u1ebft h\u1ea1n");

      if (shouldFallbackCheckout) {
        return false;
      }

      pushToast(
        "error",
        cms.subscriptions.toasts.resumeAutoRenewalFailed.title,
        message || cms.subscriptions.toasts.resumeAutoRenewalFailed.message,
      );
      return true;
    } finally {
      setSubscriptionActionPlanId(null);
    }
  }, [fetchSubscriptionData, cms]);

  const onRenewCurrentPass = useCallback(async (pass: CoursePass) => {
    await onStartPlanCheckout(pass.plan, "STRIPE_ONE_TIME");
  }, [onStartPlanCheckout]);

  const onRegisterAutoRenewCurrentPass = useCallback(async (pass: CoursePass) => {
    if (currentPassRenewalState === "AUTO_RENEW_CANCELED") {
      const resumed = await onResumeAutoRenewal(pass);
      if (resumed) {
        return;
      }
    }

    await onStartPlanCheckout(pass.plan, "STRIPE_SUBSCRIPTION");
  }, [currentPassRenewalState, onResumeAutoRenewal, onStartPlanCheckout]);

  const openPlanPaymentModal = useCallback((payment: CoursePlanPayment) => {
    setPlanPaymentModal(payment);
    setPlanQrTick(Date.now());
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("aya_access_token")) return;
    void fetchMyOrders();
  }, [fetchMyOrders, cms]);

  useEffect(() => {
    if (active !== "subscriptions") return;
    void fetchSubscriptionData();
  }, [active, fetchSubscriptionData]);

  useEffect(() => {
    if (active !== "subscriptions") return;
    if (searchParams.get("stripe") !== "success") return;

    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      void fetchSubscriptionData(false);
      if (attempts >= 6) {
        window.clearInterval(timer);
      }
    }, 3000);

    return () => window.clearInterval(timer);
  }, [active, fetchSubscriptionData, searchParams]);

  const onPayPendingOrder = useCallback(async (order: MyOrder) => {
    if (order.status !== "PENDING_PAYMENT") return;

    try {
      setPayingOrderId(order.id);
      const res = await http.post<PaymentQrPayload>(`/api/product-orders/${order.id}/payment-qr`);
      setQrPayload(res.data);
      setQrModalOrder(order);
      await fetchMyOrders(false);
    } catch (e: any) {
      pushToast(
          "error",
          cms.myOrders.toasts.qrFailed.title,
          e?.response?.data?.message || cms.myOrders.toasts.qrFailed.message,
      );
    } finally {
      setPayingOrderId(null);
    }
  }, [fetchMyOrders, cms]);

  const onRequestCancelOrder = useCallback(async (order: MyOrder) => {
    if (order.status !== "PENDING") return;

    try {
      setCancelRequestingOrderId(order.id);
      await http.post(`/api/product-orders/${order.id}/request-cancel`);
      const nextOrders = await fetchMyOrders(false);
      const updatedOrder = nextOrders.find((x) => x.id === order.id) ?? null;
      if (updatedOrder) {
        setSelectedOrder((cur) => (cur && cur.id === updatedOrder.id ? updatedOrder : cur));
      }
      pushToast(
          "success",
          cms.myOrders.toasts.cancelRequestSuccess.title,
          cms.myOrders.toasts.cancelRequestSuccess.message,
      );
    } catch (e: any) {
      pushToast(
          "error",
          cms.myOrders.toasts.cancelRequestFailed.title,
          e?.response?.data?.message || cms.myOrders.toasts.cancelRequestFailed.message,
      );
    } finally {
      setCancelRequestingOrderId(null);
    }
  }, [fetchMyOrders, cms]);

  const onViewOrder = useCallback(async (order: MyOrder) => {
    setSelectedOrder(order);
  }, []);


  // ✅ Poll server để check trạng thái thanh toán -> tự đóng modal QR + cập nhật trạng thái đơn hàng
  useEffect(() => {
    if (!qrModalOrder?.id) return;

    const orderId = qrModalOrder.id;
    const timer = window.setInterval(async () => {
      try {
        const res = await http.get<ApiProductOrder>(`/api/product-orders/${orderId}`);
        const next = res?.data ? toMyOrder(res.data, cms) : null;
        if (!next) return;

        // Cập nhật list + order đang xem (nếu trùng)
        setMyOrders((prev) => prev.map((o) => (o.id === next.id ? next : o)));
        setSelectedOrder((cur) => (cur && cur.id === next.id ? next : cur));
        setQrModalOrder((cur) => (cur && cur.id === next.id ? next : cur));

        if (next.status === "PAID") {
          pushToast(
              "success",
              cms.myOrders.toasts.paymentSuccess.title,
              cms.myOrders.toasts.paymentSuccess.message,
          );
          setQrModalOrder(null);
          setQrPayload(null);
        }

        if (next.status === "EXPIRED" || next.status === "CANCELLED") {
          pushToast(
              "info",
              cms.myOrders.toasts.paymentExpired.title,
              cms.myOrders.toasts.paymentExpired.message,
          );
          setQrModalOrder(null);
          setQrPayload(null);
        }
      } catch {
        // nếu lỗi mạng/401/404… thì dừng polling để tránh spam
        setQrModalOrder(null);
        setQrPayload(null);
      }
    }, 5000);

    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrModalOrder?.id, cms]);

  useEffect(() => {
    if (!planPaymentModal?.id) return;

    const paymentId = planPaymentModal.id;
    const timer = window.setInterval(async () => {
      try {
        const rows = await coursePlansApi.listMyPayments();
        setMyPlanPayments(rows);

        const nextPayment = rows.find((row) => row.id === paymentId);
        if (!nextPayment) {
          setPlanPaymentModal(null);
          return;
        }

        setPlanPaymentModal(nextPayment);

        if (nextPayment.computedStatus === "PAID") {
          pushToast(
              "success",
              cms.subscriptions.toasts.paymentSuccess.title,
              cms.subscriptions.toasts.paymentSuccess.message,
          );
          setPlanPaymentModal(null);
          await fetchSubscriptionData(false);
        }

        if (nextPayment.computedStatus === "FAILED" || nextPayment.computedStatus === "EXPIRED") {
          pushToast(
              "info",
              cms.subscriptions.toasts.paymentExpired.title,
              cms.subscriptions.toasts.paymentExpired.message,
          );
          setPlanPaymentModal(null);
          await fetchSubscriptionData(false);
        }
      } catch {
        setPlanPaymentModal(null);
      }
    }, 5000);

    return () => window.clearInterval(timer);
  }, [planPaymentModal?.id, fetchSubscriptionData, cms]);

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
      pushToast("error", cms.common.validationTitle, cms.changePassword.validates.currentRequired);
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
      pushToast("error", cms.common.validationTitle, cms.changePassword.validates.confirmMismatch);
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
      pushToast("error", cms.common.validationTitle, cms.forgotPassword.validates.emailRequired);
      return;
    }

    if (!accountEmail || enteredEmail !== accountEmail.trim().toLowerCase()) {
      pushToast("error", cms.common.validationTitle, cms.forgotPassword.validates.emailMismatch);
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
      pushToast("error", cms.common.validationTitle, cms.forgotPassword.validates.otpRequired);
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
      pushToast("error", cms.common.validationTitle, cms.forgotPassword.validates.confirmMismatch);
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
  const activeTitle =
      active === "profile"
          ? cms.profile.cardTitle
          : active === "changePassword"
              ? cms.changePassword.cardTitle
              : active === "forgotPassword"
                  ? cms.forgotPassword.cardTitle
                  : active === "subscriptions"
                      ? cms.subscriptions.cardTitle
                      : cms.myOrders.cardTitle;

  const activeDescription =
      active === "profile"
          ? cms.profile.cardDesc
          : active === "changePassword"
              ? cms.changePassword.cardDesc
              : active === "forgotPassword"
                  ? cms.forgotPassword.cardDesc
                  : active === "subscriptions"
                      ? cms.subscriptions.cardDesc
                      : cms.myOrders.cardDesc;
  const cmsForTabs = useMemo(() => ({ tabs: cms, common: cms.common }), [cms]);

  const renderActiveSection = () => {
    if (active === "profile") {
      return (
        <ProfileTab
          cms={cmsForTabs}
          profile={profile}
          setProfile={setProfile}
          loading={loading}
          onSubmit={onProfileSubmit}
        />
      );
    }

    if (active === "changePassword") {
      return (
        <ChangePasswordTab
          cms={cmsForTabs}
          passwordStep={passwordStep}
          setPasswordStep={setPasswordStep}
          passwordForm={passwordForm}
          setPasswordForm={setPasswordForm}
          loading={loading}
          onVerifyCurrentPassword={onVerifyCurrentPassword}
          onChangePassword={onChangePassword}
        />
      );
    }

    if (active === "forgotPassword") {
      return (
        <ForgotPasswordTab
          cms={cmsForTabs}
          forgotStep={forgotStep}
          setForgotStep={setForgotStep}
          forgotForm={forgotForm}
          setForgotForm={setForgotForm}
          profileEmail={profile.email}
          loading={loading}
          onSendForgotOtp={onSendForgotOtp}
          onVerifyForgotOtp={onVerifyForgotOtp}
          onForgotPassword={onForgotPassword}
        />
      );
    }

    if (active === "subscriptions") {
      return (
        <SubscriptionsTab
          cms={cmsForTabs}
          subscriptionLoading={subscriptionLoading}
          subscriptionError={subscriptionError}
          currentPass={currentPass}
          publicPlans={publicPlans}
          focusedPlanId={focusedPlanId}
          subscriptionActionPlanId={subscriptionActionPlanId}
          passHistory={passHistory}
          paymentHistory={paymentHistory}
          planPaymentModal={planPaymentModal}
          planQrCountdown={planQrCountdown}
          planQrExpiresAt={planQrExpiresAt}
          setPlanPaymentModal={setPlanPaymentModal}
          onStartPlanCheckout={onStartPlanCheckout}
          openPlanPaymentModal={openPlanPaymentModal}
          onCancelAutoRenewal={onCancelAutoRenewal}
          onResumeAutoRenewal={onResumeAutoRenewal}
          formatDate={formatDate}
          formatDateTime={formatDateTime}
          formatMoney={formatMoney}
          formatDurationDays={formatDurationDays}
          getPassStatusLabel={getPassStatusLabel}
          getPaymentStatusLabel={getPaymentStatusLabel}
          passStatusStyles={PASS_STATUS_STYLES}
          planPaymentStatusStyles={PLAN_PAYMENT_STATUS_STYLES}
        />
      );
    }

    return (
      <MyOrdersTab
        cms={cmsForTabs}
        orderKeyword={orderKeyword}
        setOrderKeyword={setOrderKeyword}
        orderStatusFilter={orderStatusFilter}
        setOrderStatusFilter={setOrderStatusFilter}
        ordersLoading={ordersLoading}
        filteredOrders={filteredOrders}
        payingOrderId={payingOrderId}
        selectedOrder={selectedOrder}
        setSelectedOrder={setSelectedOrder}
        qrModalOrder={qrModalOrder}
        setQrModalOrder={setQrModalOrder}
        qrPayload={qrPayload}
        setQrPayload={setQrPayload}
        qrCountdown={qrCountdown}
        qrExpiresAt={qrExpiresAt}
        cancelRequestingOrderId={cancelRequestingOrderId}
        onPayPendingOrder={onPayPendingOrder}
        onRequestCancelOrder={onRequestCancelOrder}
        onViewOrder={onViewOrder}
        formatDate={formatDate}
        formatDateTime={formatDateTime}
        formatMoney={formatMoney}
        orderStatusStyles={ORDER_STATUS_STYLES}
      />
    );
  };
  return (
      <div className="min-h-[calc(100vh-0px)] bg-slate-50">
        <ToastStack toasts={toasts} onClose={closeToast} closeLabel={cms.common.aria.closeToast} />

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
                {sidebarItems.map((item) => {
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
                      {activeTitle}
                    </h2>

                    <p className="mt-1 text-sm text-slate-600">
                      {activeDescription}
                    </p>
                  </div>

                  <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 md:flex">
                    <i className={classNames(activeMeta?.iconClass || "fa-regular fa-circle", "text-slate-500")} />
                    {activeMeta?.label}
                  </div>
                </div>

                {renderActiveSection()}
              </div>
            </main>
          </div>
        </div>
      </div>
  );
}

// Export CMS mặc định (để update DB / tái sử dụng)
export { defaultCmsData as cmsData, defaultCmsData, deepMerge };
