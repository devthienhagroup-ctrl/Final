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

type ToastKind = "success" | "error" | "info";
type ActiveSection = "profile" | "changePassword" | "forgotPassword" | "myOrders" | "subscriptions";
type PassRenewalState = "AUTO_RENEW_ACTIVE" | "AUTO_RENEW_CANCELED" | "NONE";

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
      cancelAutoRenewalSuccess: { title: "G\u00f3i \u0111\u0103ng k\u00fd", message: "\u0110\u00e3 h\u1ee7y t\u1ef1 \u0111\u1ed9ng gia h\u1ea1n th\u00e0nh c\u00f4ng." },
      cancelAutoRenewalAlready: { title: "G\u00f3i \u0111\u0103ng k\u00fd", message: "G\u00f3i n\u00e0y \u0111\u00e3 \u1edf tr\u1ea1ng th\u00e1i kh\u00f4ng t\u1ef1 \u0111\u1ed9ng gia h\u1ea1n." },
      cancelAutoRenewalFailed: { title: "G\u00f3i \u0111\u0103ng k\u00fd", message: "Kh\u00f4ng th\u1ec3 h\u1ee7y t\u1ef1 \u0111\u1ed9ng gia h\u1ea1n." },
      resumeAutoRenewalSuccess: { title: "G\u00f3i \u0111\u0103ng k\u00fd", message: "\u0110\u00e3 b\u1eadt l\u1ea1i t\u1ef1 \u0111\u1ed9ng gia h\u1ea1n th\u00e0nh c\u00f4ng." },
      resumeAutoRenewalAlready: { title: "G\u00f3i \u0111\u0103ng k\u00fd", message: "G\u00f3i n\u00e0y \u0111\u00e3 b\u1eadt t\u1ef1 \u0111\u1ed9ng gia h\u1ea1n." },
      resumeAutoRenewalFailed: { title: "G\u00f3i \u0111\u0103ng k\u00fd", message: "Kh\u00f4ng th\u1ec3 b\u1eadt l\u1ea1i t\u1ef1 \u0111\u1ed9ng gia h\u1ea1n." },
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
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  PENDING_PAYMENT: "bg-orange-50 text-orange-700 border-orange-200",
  CANCEL_REQUESTED: "bg-red-50 text-red-700 border-red-200",
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  SHIPPING: "bg-sky-50 text-sky-700 border-sky-200",
  SUCCESS: "bg-green-50 text-green-700 border-green-200",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
  EXPIRED: "bg-slate-100 text-slate-700 border-slate-200",
};

const PASS_STATUS_STYLES: Record<CoursePassStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  GRACE: "bg-amber-50 text-amber-700 border-amber-200",
  EXPIRED: "bg-slate-100 text-slate-700 border-slate-200",
  CANCELED: "bg-rose-50 text-rose-700 border-rose-200",
};

const PLAN_PAYMENT_STATUS_STYLES: Record<CoursePlanPaymentStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  FAILED: "bg-rose-50 text-rose-700 border-rose-200",
  EXPIRED: "bg-slate-100 text-slate-700 border-slate-200",
};

function getPassStatusLabel(
    status: CoursePassStatus,
    labels: CmsData["subscriptions"]["statuses"]["pass"],
) {
  return labels[status];
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
    return myPasses.find((pass) => pass.computedStatus === "ACTIVE" || pass.computedStatus === "GRACE") || null;
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

    if (!window.confirm(confirmMessage)) {
      return;
    }

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
                              <span className="font-extrabold">{profile.email || cms.common.labels.noEmail}</span>
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
                {active === "subscriptions" && (
                    <div className="space-y-4">
                      {subscriptionLoading ? (
                          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
                            {cms.common.loadingText}
                          </div>
                      ) : null}

                      {subscriptionError ? (
                          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {subscriptionError}
                          </div>
                      ) : null}

                      {!subscriptionLoading ? (
                          <>
                            {currentPass ? (
                                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                      <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">{cms.subscriptions.summary.currentPlanTitle}</p>
                                      <p className="mt-1 text-lg font-extrabold text-slate-900">{currentPass.plan.name}</p>
                                      <p className="mt-1 text-sm text-slate-700">
                                        {cms.subscriptions.summary.cycleLabel}: {formatDate(currentPass.startAt)} - {formatDate(currentPass.endAt)} | {cms.subscriptions.summary.graceUntilLabel} {formatDate(currentPass.graceUntil)}
                                      </p>
                                    </div>
                                    <span
                                        className={classNames(
                                            "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
                                            PASS_STATUS_STYLES[currentPass.computedStatus],
                                        )}
                                    >
                              {getPassStatusLabel(currentPass.computedStatus, cms.subscriptions.statuses.pass)}
                            </span>
                                  </div>

                                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                                    <div className="rounded-xl border border-white/60 bg-white px-3 py-3">
                                      <p className="text-xs text-slate-500">{cms.subscriptions.summary.remainingQuota}</p>
                                      <p className="mt-1 text-xl font-extrabold text-slate-900">{currentPass.remainingUnlocks}</p>
                                    </div>
                                    <div className="rounded-xl border border-white/60 bg-white px-3 py-3">
                                      <p className="text-xs text-slate-500">{cms.subscriptions.summary.unlockedCount}</p>
                                      <p className="mt-1 text-xl font-extrabold text-slate-900">{currentPass.unlockCount}</p>
                                    </div>
                                    <div className="rounded-xl border border-white/60 bg-white px-3 py-3">
                                      <p className="text-xs text-slate-500">{cms.subscriptions.summary.unlockNew}</p>
                                      <p className="mt-1 text-xl font-extrabold text-slate-900">
                                        {(currentPass.computedStatus === "ACTIVE" || currentPass.computedStatus === "GRACE") && currentPass.remainingUnlocks > 0
                                            ? cms.subscriptions.summary.canUnlockYes
                                            : cms.subscriptions.summary.canUnlockNo}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="mt-4 flex flex-wrap gap-2">
                                    {currentPassRenewalState === "AUTO_RENEW_ACTIVE" ? (
                                      <button
                                        type="button"
                                        className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-extrabold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                                        disabled={subscriptionActionPlanId === currentPass.plan.id}
                                        onClick={() => void onCancelAutoRenewal(currentPass)}
                                      >
                                        {cms.subscriptions.actions.cancelAutoRenewal}
                                      </button>
                                    ) : (
                                      <>
                                        <button
                                          type="button"
                                          className="inline-flex items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-extrabold text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
                                          disabled={subscriptionActionPlanId === currentPass.plan.id}
                                          onClick={() => void onRenewCurrentPass(currentPass)}
                                        >
                                          {cms.subscriptions.actions.renewNow}
                                        </button>
                                        <button
                                          type="button"
                                          className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-extrabold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                                          disabled={subscriptionActionPlanId === currentPass.plan.id}
                                          onClick={() => void onRegisterAutoRenewCurrentPass(currentPass)}
                                        >
                                          {cms.subscriptions.actions.registerAutoRenewal}
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                                  {cms.subscriptions.summary.noActivePass}
                                </div>
                            )}

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                              <p className="text-sm font-bold text-slate-700">{cms.subscriptions.planList.title}</p>
                            </div>

                            {publicPlans.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
                                  {cms.subscriptions.planList.emptyText}
                                </div>
                            ) : (
                                <div className="grid gap-3 md:grid-cols-2">
                                  {publicPlans.map((plan) => {
                                    const highlighted = focusedPlanId === plan.id;
                                    return (
                                        <div
                                            key={plan.id}
                                            className={classNames(
                                                "rounded-2xl border bg-white p-4",
                                                highlighted ? "border-indigo-300 ring-2 ring-indigo-100" : "border-slate-200",
                                            )}
                                        >
                                          <div className="flex items-start justify-between gap-3">
                                            <div>
                                              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{plan.code}</p>
                                              <p className="mt-1 text-base font-extrabold text-slate-900">{plan.name}</p>
                                            </div>
                                            <p className="text-sm font-semibold text-slate-700">{formatMoney(plan.price)}</p>
                                          </div>

                                          <div className="mt-2 space-y-1 text-xs text-slate-600">
                                            <p>- {cms.subscriptions.planCard.quotaLabel}: {plan.maxUnlocks} {cms.subscriptions.planCard.perCycleLabel}</p>
                                            <p>- {cms.subscriptions.planCard.durationLabel}: {formatDurationDays(plan.durationDays, cms.subscriptions.planCard.durationUnits)} + {cms.subscriptions.planCard.graceLabel} {plan.graceDays} {cms.subscriptions.planCard.durationUnits.day}</p>
                                            <p>- {cms.subscriptions.planCard.maxCoursePriceLabel}: {plan.maxCoursePrice != null ? formatMoney(plan.maxCoursePrice) : cms.subscriptions.planCard.unlimited}</p>
                                            <p>
                                              - {cms.subscriptions.planCard.blockedTagsLabel}: {plan.excludedTags.length > 0 ? plan.excludedTags.map((tag) => tag.code).join(", ") : cms.subscriptions.planCard.noBlockedTags}
                                            </p>
                                          </div>

                                          <button
                                              type="button"
                                              className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-extrabold text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
                                              disabled={subscriptionActionPlanId === plan.id}
                                              onClick={() => {
                                                if (!localStorage.getItem("aya_access_token")) {
                                                  window.location.href = "/login";
                                                  return;
                                                }
                                                void onStartPlanCheckout(plan);
                                              }}
                                          >
                                            {subscriptionActionPlanId === plan.id
                                                ? cms.subscriptions.actions.processing
                                                : currentPass
                                                    ? cms.subscriptions.actions.renewOrBuyMore
                                                    : cms.subscriptions.actions.subscribe}
                                          </button>
                                        </div>
                                    );
                                  })}
                                </div>
                            )}

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                              <p className="text-sm font-bold text-slate-700">{cms.subscriptions.history.passTitle}</p>
                            </div>

                            {passHistory.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
                                  {cms.subscriptions.history.passEmptyText}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                  {passHistory.map((pass) => (
                                      <article key={pass.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                          <div>
                                            <p className="text-sm font-extrabold text-slate-900">{pass.plan.name}</p>
                                            <p className="mt-1 text-xs text-slate-600">
                                              {formatDate(pass.startAt)} - {formatDate(pass.endAt)} | {cms.subscriptions.summary.graceUntilLabel} {formatDate(pass.graceUntil)}
                                            </p>
                                          </div>
                                          <span
                                              className={classNames(
                                                  "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
                                                  PASS_STATUS_STYLES[pass.computedStatus],
                                              )}
                                          >
                                  {getPassStatusLabel(pass.computedStatus, cms.subscriptions.statuses.pass)}
                                </span>
                                        </div>
                                        <div className="mt-2 grid gap-2 text-xs text-slate-600 md:grid-cols-3">
                                          <p>{cms.subscriptions.history.remainingQuota}: <span className="font-bold text-slate-800">{pass.remainingUnlocks}</span></p>
                                          <p>{cms.subscriptions.history.unlockCount}: <span className="font-bold text-slate-800">{pass.unlockCount}</span></p>
                                          <p>{cms.subscriptions.history.paymentCode}: <span className="font-bold text-slate-800">{pass.purchaseId || cms.common.emptyValue}</span></p>
                                        </div>
                                      </article>
                                  ))}
                                </div>
                            )}

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                              <p className="text-sm font-bold text-slate-700">{cms.subscriptions.history.paymentTitle}</p>
                            </div>

                            {paymentHistory.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
                                  {cms.subscriptions.history.paymentEmptyText}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                  {paymentHistory.map((payment) => (
                                      <article key={payment.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                          <div>
                                            <p className="text-sm font-extrabold text-slate-900">{payment.plan.name}</p>
                                            <p className="mt-1 text-xs text-slate-600">
                                              {cms.subscriptions.history.amount}: {formatMoney(payment.amount)} | {cms.subscriptions.history.createdAt} {formatDateTime(payment.createdAt)}
                                            </p>
                                          </div>
                                          <span
                                              className={classNames(
                                                  "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
                                                  PLAN_PAYMENT_STATUS_STYLES[payment.computedStatus],
                                              )}
                                          >
                                  {getPaymentStatusLabel(payment.computedStatus, cms.subscriptions.statuses.payment)}
                                </span>
                                        </div>

                                        <div className="mt-2 grid gap-2 text-xs text-slate-600 md:grid-cols-2">
                                          <p>{cms.subscriptions.history.transferContent}: <span className="font-bold text-slate-800">{payment.transferContent}</span></p>
                                          <p>{cms.subscriptions.history.paidAt}: <span className="font-bold text-slate-800">{formatDateTime(payment.paidAt)}</span></p>
                                        </div>

                                        {payment.computedStatus === "PENDING" && payment.sepay ? (
                                            <div className="mt-3">
                                              <button
                                                  type="button"
                                                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-extrabold text-emerald-700 hover:bg-emerald-100"
                                                  onClick={() => openPlanPaymentModal(payment)}
                                              >
                                                <i className="fa-solid fa-qrcode" />
                                                {cms.subscriptions.actions.openPaymentQr}
                                              </button>
                                            </div>
                                        ) : null}
                                      </article>
                                  ))}
                                </div>
                            )}
                          </>
                      ) : null}

                      {planPaymentModal?.sepay ? (
                          <div
                              className="fixed inset-0 z-[135] flex items-center justify-center bg-black/60 px-4"
                              onClick={() => setPlanPaymentModal(null)}
                          >
                            <div
                                className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <h3 className="text-lg font-bold text-slate-900">{cms.subscriptions.qrModal.title}</h3>
                                <button
                                    type="button"
                                    onClick={() => setPlanPaymentModal(null)}
                                    className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                                >
                                  {cms.common.actions.close}
                                </button>
                              </div>

                              <p className="mt-1 text-xs text-slate-500">{cms.subscriptions.qrModal.planLabel}: {planPaymentModal.plan.name}</p>

                              <div className="relative mx-auto mt-4 h-64 w-64">
                                <img
                                    src={planPaymentModal.sepay.qrUrl}
                                    alt={cms.subscriptions.qrModal.qrAlt}
                                    className={
                                        "h-64 w-64 rounded-xl border border-slate-200 transition " +
                                        (planQrCountdown.expired ? "opacity-40 blur-[2px]" : "")
                                    }
                                />
                              </div>

                              <div className="mt-4 space-y-1 text-sm text-slate-700">
                                <p><span className="font-semibold">{cms.subscriptions.qrModal.amount}:</span> {formatMoney(Number(planPaymentModal.sepay.amount || 0))}</p>
                                <p><span className="font-semibold">{cms.subscriptions.qrModal.transferContent}:</span> {planPaymentModal.sepay.transferContent}</p>
                                <p><span className="font-semibold">{cms.subscriptions.qrModal.timeLeft}:</span> {planQrCountdown.text}</p>
                                <p><span className="font-semibold">{cms.subscriptions.qrModal.expiresAt}:</span> {formatDateTime(planQrExpiresAt)}</p>
                              </div>

                              {planQrCountdown.expired ? (
                                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                                    {cms.subscriptions.qrModal.expiredMessage}
                                  </div>
                              ) : (
                                  <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                                    {cms.subscriptions.qrModal.waitingMessage}
                                  </div>
                              )}
                            </div>
                          </div>
                      ) : null}
                    </div>
                )}
                {/* MY ORDERS */}
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
                            <option value="PENDING">{cms.myOrders.statuses.PENDING}</option>
                            <option value="PENDING_PAYMENT">{cms.myOrders.statuses.PENDING_PAYMENT}</option>
                            <option value="CANCEL_REQUESTED">{cms.myOrders.statuses.CANCEL_REQUESTED}</option>
                            <option value="PAID">{cms.myOrders.statuses.PAID}</option>
                            <option value="SHIPPING">{cms.myOrders.statuses.SHIPPING}</option>
                            <option value="SUCCESS">{cms.myOrders.statuses.SUCCESS}</option>
                            <option value="CANCELLED">{cms.myOrders.statuses.CANCELLED}</option>
                            <option value="EXPIRED">{cms.myOrders.statuses.EXPIRED}</option>
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
                                        <div className="flex flex-wrap items-center gap-2">
                                          {order.status === "PENDING_PAYMENT" && (
                                              <button
                                                  type="button"
                                                  onClick={() => void onPayPendingOrder(order)}
                                                  disabled={payingOrderId === order.id}
                                                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-extrabold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                              >
                                                <i className="fa-solid fa-qrcode" />
                                                {payingOrderId === order.id ? cms.myOrders.list.generatingQr : cms.myOrders.list.pay}
                                              </button>
                                          )}
                                          <button
                                              type="button"
                                              onClick={async () => {
                                                try {
                                                  const res = await http.get<ApiProductOrder>(`/api/product-orders/${order.id}`);
                                                  setSelectedOrder(toMyOrder(res.data, cms));
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
                                    {cms.myOrders.sections.general}
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
                                      <span className="font-semibold">{cms.myOrders.fields.status}:</span>{' '}
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
                                    {cms.myOrders.sections.payment}
                                  </h4>
                                  <div className="grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                                    <p>
                                      <span className="font-semibold">{cms.myOrders.fields.paymentMethod}:</span>{' '}
                                      {selectedOrder.payment.method}
                                    </p>
                                    <p>
                                      <span className="font-semibold">{cms.myOrders.fields.paymentRef}:</span>{' '}
                                      {selectedOrder.payment.ref || cms.common.emptyValue}
                                    </p>
                                    <p>
                                      <span className="font-semibold">{cms.myOrders.fields.paidAt}:</span>{' '}
                                      {formatDate(selectedOrder.payment.paidAt)}
                                    </p>
                                  </div>
                                  {selectedOrder.status === "PENDING" && (
                                      <div className="mt-3">
                                        <button
                                            type="button"
                                            onClick={() => onRequestCancelOrder(selectedOrder)}
                                            disabled={cancelRequestingOrderId === selectedOrder.id}
                                            className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                          {cancelRequestingOrderId === selectedOrder.id
                                              ? cms.myOrders.actions.requestingCancel
                                              : cms.myOrders.actions.requestCancel}
                                        </button>
                                      </div>
                                  )}
                                  {selectedOrder.status === "PENDING_PAYMENT" && (
                                      <div className="mt-3">
                                        <button
                                            type="button"
                                            onClick={() => void onPayPendingOrder(selectedOrder)}
                                            disabled={payingOrderId === selectedOrder.id}
                                            className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-extrabold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                          <i className="fa-solid fa-qrcode" />
                                          {payingOrderId === selectedOrder.id
                                              ? cms.myOrders.list.generatingQr
                                              : cms.myOrders.actions.payThisOrder}
                                        </button>
                                      </div>
                                  )}
                                </div>

                                {/* Khối giao hàng */}
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                  <h4 className="mb-3 text-sm font-extrabold text-slate-900">
                                    <i className="fa-solid fa-truck mr-2 text-slate-500" />
                                    {cms.myOrders.sections.shipping}
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
                                      {selectedOrder.shippingInfo.trackingCode || cms.common.emptyValue}
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
                                  <h4 className="mb-3 text-sm font-extrabold text-slate-900">
                                    <i className="fa-solid fa-receipt mr-2 text-slate-500" />
                                    {cms.myOrders.sections.summary}
                                  </h4>
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
                                {selectedOrder.note && selectedOrder.note !== cms.common.emptyValue && (
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

                      {qrModalOrder && qrPayload && (
                          <div
                              className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 px-4"
                              onClick={() => {
                                setQrModalOrder(null);
                                setQrPayload(null);
                              }}
                          >
                            <div
                                className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-slate-900">{cms.myOrders.qrModal.title}</h3>
                                <div className="flex items-center gap-2">
                            <span
                                className={
                                    "rounded-full px-2 py-1 text-[11px] font-semibold " +
                                    (qrCountdown.expired
                                        ? "bg-slate-100 text-slate-500"
                                        : "bg-emerald-50 text-emerald-700")
                                }
                                title={qrExpiresAt ? `${cms.myOrders.qrModal.expiresAtTitle}: ${formatDateTime(qrExpiresAt)}` : undefined}
                            >
                              <i className="fa-regular fa-clock mr-1" />
                              {qrCountdown.text}
                            </span>
                                  <button
                                      type="button"
                                      onClick={() => {
                                        setQrModalOrder(null);
                                        setQrPayload(null);
                                      }}
                                      className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                                  >
                                    {cms.common.actions.close}
                                  </button>
                                </div>
                              </div>

                              <p className="mt-1 text-xs text-slate-500">{cms.myOrders.fields.orderCode}: {qrModalOrder.code}</p>

                              <div className="relative mx-auto mt-4 h-64 w-64">
                                <img
                                    src={qrPayload.qrUrl}
                                    alt={cms.myOrders.qrModal.qrAlt}
                                    className={
                                        "h-64 w-64 rounded-xl border border-slate-200 transition " +
                                        (qrCountdown.expired ? "opacity-40 blur-[2px]" : "")
                                    }
                                />

                                {qrCountdown.expired && (
                                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/40">
                                      <div className="rounded-xl bg-white/90 px-4 py-3 text-center shadow">
                                        <p className="text-sm font-bold text-slate-900">{cms.myOrders.qrModal.expiredTitle}</p>
                                        <p className="mt-1 text-xs text-slate-600">
                                          {cms.myOrders.qrModal.expiredSubtitle}
                                        </p>
                                      </div>
                                    </div>
                                )}
                              </div>

                              <div className="mt-4 space-y-1 text-sm text-slate-700">
                                <p><span className="font-semibold">{cms.myOrders.fields.amount}:</span> {formatMoney(Number(qrPayload.amount || 0))}</p>
                                <p><span className="font-semibold">{cms.myOrders.fields.transferContent}:</span> {qrPayload.transferContent || cms.common.emptyValue}</p>
                              </div>

                              {!qrCountdown.expired ? (
                                  <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                                    {cms.myOrders.qrModal.activeHint}<br />
                                    {cms.myOrders.fields.timeLeft}: <span className="font-semibold">{qrCountdown.text}</span>. {cms.myOrders.fields.expiresAt}:{" "}
                                    <span className="font-semibold">{formatDateTime(qrExpiresAt)}</span>.
                                  </div>
                              ) : (
                                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                                    <div className="font-semibold">{cms.myOrders.qrModal.expiredBoxTitle}</div>
                                    <div className="mt-1">{cms.myOrders.qrModal.expiredBoxSubtitle}</div>
                                  </div>
                              )}

                              <p className="mt-3 text-xs text-slate-500">
                                {cms.myOrders.qrModal.autoUpdateNote}
                              </p>
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

