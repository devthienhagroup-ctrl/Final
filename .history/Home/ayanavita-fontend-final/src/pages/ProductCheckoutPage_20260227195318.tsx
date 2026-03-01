import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CheckoutHeader } from "../components/checkout/CheckoutHeader";
import { CustomerShippingCard } from "../components/checkout/CustomerShippingCard";
import { PaymentCard } from "../components/checkout/PaymentCard";
import { ConfirmCard } from "../components/checkout/ConfirmCard";
import { OrderSummaryAside } from "../components/checkout/OrderSummaryAside";
import { Toast } from "../components/checkout/Toast";

import {
  CheckoutState,
  CustomerDraft,
  Order,
  PayMethod,
  ShippingType,
  loadCheckoutState,
  saveCheckoutState,
  uid,
} from "../services/checkout.storage";
import { calcDiscountAmount, calcShippingFee, calcSubtotal, calcTotal } from "../services/checkout.pricing";
import { http } from "../api/http"; // <-- THÊM IMPORT

// ==================== Default CMS Data ====================
const defaultToastCms = {
  // Toast titles & messages
  toastVoucherTitle: "Voucher",
  toastVoucherAppliedAYA10: "Đã áp dụng AYA10",
  toastVoucherAppliedFREESHIP: "Đã áp dụng FREESHIP",
  toastVoucherInvalid: "Mã không hợp lệ.",

  toastSaveDraftTitle: "Đã lưu",
  toastSaveDraftMessage: "Đã lưu thông tin giao hàng (demo).",

  toastOrderCreatedTitle: "Order",
  toastOrderCreatedMessageTemplate: "Đã tạo đơn {code} (demo).",

  toastMarkPaidTitle: "Thanh toán",
  toastMarkPaidMessage: "Đã cập nhật trạng thái: Đã thanh toán (demo).",

  toastValidationErrorTitle: "Thiếu thông tin",
  toastValidationErrorMessage: "Vui lòng nhập đủ thông tin và đồng ý điều khoản.",

  // Notes trả về từ applyVoucher (dùng trong demo)
  voucherNoteCleared: "Đã xóa voucher.",
  voucherNoteAppliedAYA10: "Áp dụng AYA10: giảm 10% tạm tính (demo).",
  voucherNoteAppliedFREESHIP: "Áp dụng FREESHIP: miễn phí vận chuyển (demo).",
  voucherNoteInvalid: "Voucher không hợp lệ (demo).",

  // Trạng thái thanh toán
  payStatusPending: "Chờ thanh toán",
  payStatusPaid: "Đã thanh toán",

  // Mã đơn hàng mẫu và tiền tố
  orderCodePreview: "AYA-ORDER",
  orderCodePrefix: "AYA-",
} as const;
// ===========================================================

function upper(s: string) {
  return (s || "").toString().trim().toUpperCase();
}

function nowISO() {
  return new Date().toISOString();
}

function genOrderCode() {
  // Sử dụng giá trị từ state, nhưng ở đây là hàm thuần túy, sẽ lấy prefix từ toastCms khi dùng
  // Tạm thời để cứng, sau này có thể sửa thành tham số
  return "AYA-" + Math.random().toString(16).slice(2, 8).toUpperCase();
}

export default function ProductCheckoutPage() {
  const [state, setState] = useState<CheckoutState>(() => loadCheckoutState());

  // ========== API & LANGUAGE ==========
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
    return localStorage.getItem("preferred-language") || "vi";
  });
  const [toastCms, setToastCms] = useState(defaultToastCms); // state động cho CMS data

  // Lắng nghe sự kiện thay đổi ngôn ngữ từ Header
  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => {
      setCurrentLanguage(event.detail.language);
    };
    window.addEventListener('languageChange', handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener('languageChange', handleLanguageChange as EventListener);
    };
  }, []);

  // Gọi API khi language thay đổi
  useEffect(() => {
    const fetchCheckout = async () => {
      try {
        const res = await http.get(`/public/pages/checkout?lang=${currentLanguage}`);
        setCheckoutData(res.data);
        // Ghi đè (merge) dữ liệu từ sections[4] vào toastCms
        if (res.data?.sections?.[4]?.data) {
          setToastCms(prev => ({ ...prev, ...res.data.sections[4].data }));
        }
      } catch (error) {
        console.error("Lỗi gọi API checkout:", error);
      }
    };
    fetchCheckout();
  }, [currentLanguage]);
  // =====================================

  // controlled customer form (draft)
  const [customer, setCustomer] = useState<CustomerDraft>(() => {
    const d = state.customerDraft;
    return (
        d || {
          name: "",
          phone: "",
          email: "",
          addr: "",
          city: "",
          district: "",
          note: "",
        }
    );
  });

  // stepper states
  const [step2Active, setStep2Active] = useState(true);
  const [step3Active, setStep3Active] = useState(false);

  // agree checkbox
  const [agree, setAgree] = useState(false);

  // order result
  const [orderResult, setOrderResult] = useState<Order | null>(null);
  const [showError, setShowError] = useState(false);

  // toast
  const [toast, setToast] = useState<{ open: boolean; title: string; msg: string }>({
    open: false,
    title: "",
    msg: "",
  });

  const orderCodePreview = orderResult?.code || toastCms.orderCodePreview;

  // persist state
  useEffect(() => {
    saveCheckoutState(state);
  }, [state]);

  // ESC close toast
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setToast((t) => ({ ...t, open: false }));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // init: load draft into controlled form (if exists)
  useEffect(() => {
    if (state.customerDraft) setCustomer(state.customerDraft);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pricing = useMemo(() => {
    const sub = calcSubtotal(state);
    const disc = calcDiscountAmount(state);
    const ship = calcShippingFee(state);
    const total = calcTotal(state);
    return { sub, disc, ship, total };
  }, [state]);

  const setShipping = useCallback((t: ShippingType) => {
    setState((s) => ({ ...s, shipping: t }));
  }, []);

  const setPayMethod = useCallback((m: PayMethod) => {
    setState((s) => ({ ...s, payMethod: m }));
    setStep2Active(true);
  }, []);

  const cartPlus = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      cart: s.cart.map((x) => (x.id === id ? { ...x, qty: Number(x.qty || 1) + 1 } : x)),
    }));
  }, []);

  const cartMinus = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      cart: s.cart.map((x) =>
          x.id === id ? { ...x, qty: Math.max(1, Number(x.qty || 1) - 1) } : x
      ),
    }));
  }, []);

  const cartRemove = useCallback((id: string) => {
    setState((s) => ({ ...s, cart: s.cart.filter((x) => x.id !== id) }));
  }, []);

  const applyVoucher = useCallback((code: string) => {
    const c = upper(code);
    if (!c) {
      setState((s) => ({ ...s, voucher: { code: "", discount: 0, freeShip: false } }));
      return { ok: true, note: toastCms.voucherNoteCleared };
    }

    if (c === "AYA10") {
      setState((s) => ({ ...s, voucher: { code: c, discount: 0.1, freeShip: false } }));
      setToast({
        open: true,
        title: toastCms.toastVoucherTitle,
        msg: toastCms.toastVoucherAppliedAYA10,
      });
      return { ok: true, note: toastCms.voucherNoteAppliedAYA10 };
    }

    if (c === "FREESHIP") {
      setState((s) => ({ ...s, voucher: { code: c, discount: 0, freeShip: true } }));
      setToast({
        open: true,
        title: toastCms.toastVoucherTitle,
        msg: toastCms.toastVoucherAppliedFREESHIP,
      });
      return { ok: true, note: toastCms.voucherNoteAppliedFREESHIP };
    }

    setToast({
      open: true,
      title: toastCms.toastVoucherTitle,
      msg: toastCms.toastVoucherInvalid,
    });
    return { ok: false, note: toastCms.voucherNoteInvalid };
  }, [toastCms]); // Thêm toastCms vào deps

  const saveDraft = useCallback(() => {
    setState((s) => ({ ...s, customerDraft: { ...customer } }));
    setToast({
      open: true,
      title: toastCms.toastSaveDraftTitle,
      msg: toastCms.toastSaveDraftMessage,
    });
  }, [customer, toastCms]); // Thêm toastCms

  // Nhờ 'as const' của default, nhưng giờ dùng state nên type vẫn suy ra tốt
  const payStatusByMethod = useCallback((m: PayMethod) => {
    if (m === "bank") return toastCms.payStatusPending;
    return toastCms.payStatusPaid;
  }, [toastCms]); // Thêm toastCms

  const validate = useCallback(() => {
    if (!customer.name.trim()) return false;
    if (!customer.phone.trim()) return false;
    if (!customer.addr.trim()) return false;
    if (!customer.city) return false;
    if (!customer.district.trim()) return false;
    if (!agree) return false;
    if (!state.cart.length) return false;
    return true;
  }, [agree, customer, state.cart.length]);

  const createOrder = useCallback((): Order => {
    // Dùng toastCms.orderCodePrefix thay vì hằng cứng
    const orderCode = toastCms.orderCodePrefix + Math.random().toString(16).slice(2, 8).toUpperCase();
    const order: Order = {
      id: uid("ORD"),
      code: orderCode,
      createdAt: nowISO(),

      customer: { ...customer },
      items: state.cart.map((i) => ({
        productId: i.productId,
        name: i.name,
        sku: i.sku,
        price: i.price,
        qty: i.qty,
      })),

      shipping: state.shipping,
      payMethod: state.payMethod,
      voucher: state.voucher,

      subtotal: pricing.sub,
      discount: pricing.disc,
      shipFee: pricing.ship,
      total: pricing.total,

      payStatus: payStatusByMethod(state.payMethod),
    };

    setState((s) => ({ ...s, orders: [order, ...(s.orders || [])] }));
    return order;
  }, [customer, payStatusByMethod, pricing, state.cart, state.payMethod, state.shipping, state.voucher, toastCms]); // Thêm toastCms

  const onPay = useCallback(() => {
    setShowError(false);

    if (!validate()) {
      setShowError(true);
      setToast({
        open: true,
        title: toastCms.toastValidationErrorTitle,
        msg: toastCms.toastValidationErrorMessage,
      });
      return;
    }

    const order = createOrder();
    setOrderResult(order);
    setStep3Active(true);
    setToast({
      open: true,
      title: toastCms.toastOrderCreatedTitle,
      msg: toastCms.toastOrderCreatedMessageTemplate.replace("{code}", order.code),
    });
  }, [createOrder, validate, toastCms]); // Thêm toastCms

  const onMarkPaid = useCallback(() => {
    setState((s) => {
      if (!s.orders?.length) return s;
      const first = { ...s.orders[0], payStatus: toastCms.payStatusPaid };
      const next = [first, ...s.orders.slice(1)];
      // sync local current result if it is the same order
      setOrderResult((cur) => (cur && cur.id === first.id ? first : cur));
      return { ...s, orders: next };
    });
    setToast({
      open: true,
      title: toastCms.toastMarkPaidTitle,
      msg: toastCms.toastMarkPaidMessage,
    });
  }, [toastCms]); // Thêm toastCms

  const onViewOrders = useCallback(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }, []);

  return (
      <div className="min-h-screen" style={{ background: "var(--aya-soft)" }}>
        <CheckoutHeader
            cmsData={checkoutData?.sections?.[0]?.data}
            step2Active={step2Active} step3Active={step3Active}
        />

        <main className="grad">
          <div className="mx-auto max-w-7xl px-4 py-8">
            <div className="grid gap-6 lg:grid-cols-3 items-start">
              {/* Left: Form */}
              <section className="lg:col-span-2 grid gap-5">
                <CustomerShippingCard
                    cmsData={checkoutData?.sections?.[1]?.data}
                    customer={customer}
                    onChange={setCustomer}
                    shipping={state.shipping}
                    onShippingChange={setShipping}
                />

                <PaymentCard
                    cmsData={checkoutData?.sections?.[2]?.data}
                    payMethod={state.payMethod}
                    onPayMethodChange={setPayMethod}
                    agree={agree}
                    onAgreeChange={setAgree}
                    orderCodePreview={orderCodePreview}
                    onStep2Seen={() => setStep2Active(true)}
                />

                <ConfirmCard
                    cmsData={checkoutData?.sections?.[3]?.data}
                    onPay={onPay}
                    onSaveDraft={saveDraft}
                    showError={showError}
                    order={orderResult}
                    onMarkPaid={onMarkPaid}
                    onViewOrders={onViewOrders}
                />
              </section>

              {/* Right: Summary */}
              <OrderSummaryAside
                  cmsData={checkoutData?.sections?.[5]?.data}
                  state={state}
                  onCartPlus={cartPlus}
                  onCartMinus={cartMinus}
                  onCartRemove={cartRemove}
                  onApplyVoucher={applyVoucher}
              />
            </div>

            <div className="mt-8 text-center text-sm muted">
            </div>
          </div>
        </main>

        <Toast
            open={toast.open}
            title={toast.title}
            message={toast.msg}
            onClose={() => setToast((t) => ({ ...t, open: false }))}
        />
      </div>
  );
}