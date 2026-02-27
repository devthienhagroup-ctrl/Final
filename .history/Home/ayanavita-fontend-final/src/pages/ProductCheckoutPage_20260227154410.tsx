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

function upper(s: string) {
  return (s || "").toString().trim().toUpperCase();
}

function nowISO() {
  return new Date().toISOString();
}

function genOrderCode() {
  return "AYA-" + Math.random().toString(16).slice(2, 8).toUpperCase();
}

export default function ProductCheckoutPage() {
  const [state, setState] = useState<CheckoutState>(() => loadCheckoutState());

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

  const orderCodePreview = orderResult?.code || "AYA-ORDER";

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
      return { ok: true, note: "Đã xóa voucher." };
    }

    if (c === "AYA10") {
      setState((s) => ({ ...s, voucher: { code: c, discount: 0.1, freeShip: false } }));
      setToast({ open: true, title: "Voucher", msg: "Đã áp dụng AYA10" });
      return { ok: true, note: "Áp dụng AYA10: giảm 10% tạm tính (demo)." };
    }

    if (c === "FREESHIP") {
      setState((s) => ({ ...s, voucher: { code: c, discount: 0, freeShip: true } }));
      setToast({ open: true, title: "Voucher", msg: "Đã áp dụng FREESHIP" });
      return { ok: true, note: "Áp dụng FREESHIP: miễn phí vận chuyển (demo)." };
    }

    setToast({ open: true, title: "Voucher", msg: "Mã không hợp lệ." });
    return { ok: false, note: "Voucher không hợp lệ (demo)." };
  }, []);

  const saveDraft = useCallback(() => {
    setState((s) => ({ ...s, customerDraft: { ...customer } }));
    setToast({ open: true, title: "Đã lưu", msg: "Đã lưu thông tin giao hàng (demo)." });
  }, [customer]);

  const payStatusByMethod = useCallback((m: PayMethod) => {
    if (m === "bank") return "Chờ thanh toán" as const;
    return "Đã thanh toán" as const;
  }, []);

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
    const order: Order = {
      id: uid("ORD"),
      code: genOrderCode(),
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
  }, [customer, payStatusByMethod, pricing, state.cart, state.payMethod, state.shipping, state.voucher]);

  const onPay = useCallback(() => {
    setShowError(false);

    if (!validate()) {
      setShowError(true);
      setToast({ open: true, title: "Thiếu thông tin", msg: "Vui lòng nhập đủ thông tin và đồng ý điều khoản." });
      return;
    }

    const order = createOrder();
    setOrderResult(order);
    setStep3Active(true);
    setToast({ open: true, title: "Order", msg: "Đã tạo đơn " + order.code + " (demo)." });
  }, [createOrder, validate]);

  const onMarkPaid = useCallback(() => {
    setState((s) => {
      if (!s.orders?.length) return s;
      const first = { ...s.orders[0], payStatus: "Đã thanh toán" as const };
      const next = [first, ...s.orders.slice(1)];
      // sync local current result if it is the same order
      setOrderResult((cur) => (cur && cur.id === first.id ? first : cur));
      return { ...s, orders: next };
    });
    setToast({ open: true, title: "Thanh toán", msg: "Đã cập nhật trạng thái: Đã thanh toán (demo)." });
  }, []);

  const onViewOrders = useCallback(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "var(--aya-soft)" }}>
      <CheckoutHeader step2Active={step2Active} step3Active={step3Active} />

      <main className="grad">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="grid gap-6 lg:grid-cols-3 items-start">
            {/* Left: Form */}
            <section className="lg:col-span-2 grid gap-5">
              <CustomerShippingCard
                customer={customer}
                onChange={setCustomer}
                shipping={state.shipping}
                onShippingChange={setShipping}
              />

              <PaymentCard
                payMethod={state.payMethod}
                onPayMethodChange={setPayMethod}
                agree={agree}
                onAgreeChange={setAgree}
                orderCodePreview={orderCodePreview}
                onStep2Seen={() => setStep2Active(true)}
              />

              <ConfirmCard
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
              state={state}
              onCartPlus={cartPlus}
              onCartMinus={cartMinus}
              onCartRemove={cartRemove}
              onApplyVoucher={applyVoucher}
            />
          </div>

          <div className="mt-8 text-center text-sm muted">
            © 2025 AYANAVITA • Checkout prototype (React) – sẵn sàng nối API thanh toán.
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
