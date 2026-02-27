import React, { useMemo, useState } from "react";
import type { CheckoutState, CartItem, Order } from "../../services/checkout.storage";
import { calcDiscountAmount, calcShippingFee, calcSubtotal, calcTotal } from "../../services/checkout.pricing";
import { moneyVND } from "../../services/money.utils";

// Định nghĩa interface cho dữ liệu nội dung từ CMS (chỉ chứa text, không chứa style)
export interface OrderSummaryCmsData {
  summaryTitle: string;
  orderTitle: string;
  badgeText: string;
  removeButtonText: string;
  emptyCartMessage: string;
  voucherLabel: string;
  voucherPlaceholder: string;
  voucherButtonText: string;
  voucherNoteDefault: string;
  subtotalLabel: string;
  discountLabel: string;
  shippingLabel: string;
  totalLabel: string;
  prototypeNote: string;
  supportTitle: string;
  supportPhone: string;
  supportZalo: string;
  orderHistoryTitle: string;
  orderHistoryNote: string;
  emptyOrderMessage: string;
  cartItemQuantityLabel: string;
  orderTotalPrefix: string;
}

// Nội dung mặc định (dùng khi không có cmsData)
const defaultCmsData: OrderSummaryCmsData = {
  summaryTitle: "Tóm tắt",
  orderTitle: "Đơn hàng",
  badgeText: "Niêm yết",
  removeButtonText: "Xóa",
  emptyCartMessage: "Giỏ hàng trống.",
  voucherLabel: "Voucher (demo)",
  voucherPlaceholder: "AYA10 / FREESHIP",
  voucherButtonText: "Áp dụng",
  voucherNoteDefault: "Voucher demo: AYA10 (10%), FREESHIP (miễn phí ship).",
  subtotalLabel: "Tạm tính",
  discountLabel: "Giảm giá",
  shippingLabel: "Vận chuyển",
  totalLabel: "Tổng thanh toán",
  prototypeNote: "Prototype: giá có thể tính server-side",
  supportTitle: "Hỗ trợ nhanh",
  supportPhone: "0900 000 000",
  supportZalo: "Zalo AYANAVITA",
  orderHistoryTitle: "Lịch sử đơn (demo)",
  orderHistoryNote: "Lưu localStorage. Khi làm thật: /orders của user.",
  emptyOrderMessage: "Chưa có đơn.",
  cartItemQuantityLabel: "SL:",
  orderTotalPrefix: "Tổng:",
};

function upper(s: string) {
  return (s || "").toString().trim().toUpperCase();
}

export function OrderSummaryAside({
                                    state,
                                    onCartPlus,
                                    onCartMinus,
                                    onCartRemove,
                                    onApplyVoucher,
                                    cmsData = {}, // nhận dữ liệu từ CMS, mặc định rỗng
                                  }: {
  state: CheckoutState;
  onCartPlus: (id: string) => void;
  onCartMinus: (id: string) => void;
  onCartRemove: (id: string) => void;
  onApplyVoucher: (code: string) => { ok: boolean; note: string };
  cmsData?: Partial<OrderSummaryCmsData>;
}) {
  // Gộp dữ liệu mặc định với dữ liệu từ CMS
  const content = { ...defaultCmsData, ...cmsData };

  const [voucherInput, setVoucherInput] = useState(state.voucher.code || "");
  const [voucherNote, setVoucherNote] = useState(content.voucherNoteDefault);

  const sub = useMemo(() => calcSubtotal(state), [state]);
  const disc = useMemo(() => calcDiscountAmount(state), [state]);
  const ship = useMemo(() => calcShippingFee(state), [state]);
  const total = useMemo(() => calcTotal(state), [state]);

  function submitVoucher() {
    const res = onApplyVoucher(upper(voucherInput));
    setVoucherNote(res.note);
  }

  const ordersMini = (state.orders || []).slice(0, 5);

  return (
      <aside className="stickyBox">
        <div className="card p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[10px] font-bold muted">{content.summaryTitle}</div>
              <div className="text-lg font-bold">{content.orderTitle}</div>
            </div>
            <span className="badge text-xs py-1">
            <i className="fa-solid fa-tags mr-1" /> {content.badgeText}
          </span>
          </div>

          <div className="mt-3 flex flex-col gap-2 ">
            {(state.cart || []).length ? (
                state.cart.map((i: CartItem) => (
                    <div key={i.id} className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                              className="h-10 w-10 rounded-lg object-cover border border-slate-200"
                              src={i.img}
                              alt={i.name}
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-sm truncate">{i.name}</div>
                            <div className="text-xs muted">
                              {i.sku} • {moneyVND(i.price)}
                            </div>
                            <div className="text-xs text-slate-700">
                              {content.cartItemQuantityLabel} <span className="font-medium">{i.qty}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-amber-600 text-sm">
                            {moneyVND(Number(i.price) * Number(i.qty))}
                          </div>
                          <div className="mt-1 flex items-center justify-end gap-1">
                            <button
                                className="btn w-7 h-7 p-0 text-xs"
                                type="button"
                                onClick={() => onCartMinus(i.id)}
                            >
                              <i className="fa-solid fa-minus" />
                            </button>
                            <button
                                className="btn w-7 h-7 p-0 text-xs"
                                type="button"
                                onClick={() => onCartPlus(i.id)}
                            >
                              <i className="fa-solid fa-plus" />
                            </button>
                            <button
                                className="btn text-xs py-1 px-2"
                                type="button"
                                onClick={() => onCartRemove(i.id)}
                            >
                              {content.removeButtonText}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                ))
            ) : (
                <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200 text-xs text-slate-700">
                  {content.emptyCartMessage}
                </div>
            )}
          </div>

          <div className="mt-3 divider" />

          <div className="mt-3 grid gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700">{content.voucherLabel}</label>
              <div className="mt-1 flex gap-2">
                <input
                    className="field text-sm py-1.5 px-2 !flex-1"
                    value={voucherInput}
                    onChange={(e) => setVoucherInput(e.target.value)}
                    placeholder={content.voucherPlaceholder}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        submitVoucher();
                      }
                    }}
                />
                <button
                    className="btn btn-accent text-sm py-1.5 px-3 w-fit"
                    type="button"
                    onClick={submitVoucher}
                >
                  <i className="fa-solid fa-ticket mr-1 text-xs" />
                  {content.voucherButtonText}
                </button>
              </div>
              <div className="mt-1 text-xs muted">{voucherNote}</div>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
              <div className="flex items-center justify-between text-xs">
                <span className="muted font-bold">{content.subtotalLabel}</span>
                <span className="font-medium">{moneyVND(sub)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="muted font-bold">{content.discountLabel}</span>
                <span className="font-medium">{"-" + moneyVND(disc)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="muted font-bold">{content.shippingLabel}</span>
                <span className="font-medium">{moneyVND(ship)}</span>
              </div>
              <div className="mt-2 divider" />
              <div className="mt-2 flex items-center justify-between">
                <span className="font-bold text-sm">{content.totalLabel}</span>
                <span className="text-lg font-bold text-amber-600">{moneyVND(total)}</span>
              </div>
              <div className="mt-2 text-[10px] muted">{content.prototypeNote}</div>
            </div>
          </div>

          <div className="mt-3 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
            <div className="font-bold text-sm">{content.supportTitle}</div>
            <div className="mt-1 text-xs text-slate-700">
              <div className="flex items-center gap-1">
                <i className="fa-solid fa-phone text-indigo-600 text-xs" /> {content.supportPhone}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <i className="fa-solid fa-message text-indigo-600 text-xs" /> {content.supportZalo}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 card p-4">
          <div className="font-bold text-sm">{content.orderHistoryTitle}</div>
          <div className="mt-1 text-xs muted">{content.orderHistoryNote}</div>

          <div className="mt-2 grid gap-2">
            {ordersMini.length ? (
                ordersMini.map((o: Order) => (
                    <div key={o.id} className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0">
                          <div className="font-bold text-sm">{o.code}</div>
                          <div className="text-xs muted">{o.createdAt}</div>
                          <div className="text-xs text-slate-700 mt-0.5">
                            {content.orderTotalPrefix} <span className="font-medium">{moneyVND(o.total)}</span>
                          </div>
                        </div>
                        <span className="chip text-xs py-0.5 px-2">
                    <i
                        className={`fa-solid fa-circle text-[8px] mr-1 ${
                            o.payStatus === "Đã thanh toán" ? "text-emerald-500" : "text-amber-500"
                        }`}
                    />
                          {o.payStatus}
                  </span>
                      </div>
                    </div>
                ))
            ) : (
                <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200 text-xs text-slate-700">
                  {content.emptyOrderMessage}
                </div>
            )}
          </div>
        </div>
      </aside>
  );
}