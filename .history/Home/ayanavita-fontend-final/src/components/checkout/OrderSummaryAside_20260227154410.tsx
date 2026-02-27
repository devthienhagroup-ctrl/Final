import React, { useMemo, useState } from "react";
import type { CheckoutState, CartItem, Order } from "../../services/checkout.storage";
import { calcDiscountAmount, calcShippingFee, calcSubtotal, calcTotal } from "../../services/checkout.pricing";
import { moneyVND } from "../../services/money.utils";

function upper(s: string) {
  return (s || "").toString().trim().toUpperCase();
}

export function OrderSummaryAside({
  state,
  onCartPlus,
  onCartMinus,
  onCartRemove,
  onApplyVoucher,
}: {
  state: CheckoutState;
  onCartPlus: (id: string) => void;
  onCartMinus: (id: string) => void;
  onCartRemove: (id: string) => void;
  onApplyVoucher: (code: string) => { ok: boolean; note: string };
}) {
  const [voucherInput, setVoucherInput] = useState(state.voucher.code || "");
  const [voucherNote, setVoucherNote] = useState(
    "Voucher demo: AYA10 (10%), FREESHIP (miễn phí ship)."
  );

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
      <div className="card p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-extrabold muted">Tóm tắt</div>
            <div className="text-2xl font-extrabold">Đơn hàng</div>
          </div>
          <span className="badge">
            <i className="fa-solid fa-tags" /> Niêm yết
          </span>
        </div>

        <div className="mt-5 grid gap-3">
          {(state.cart || []).length ? (
            state.cart.map((i: CartItem) => (
              <div key={i.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      className="h-14 w-14 rounded-2xl object-cover border border-slate-200"
                      src={i.img}
                      alt={i.name}
                    />
                    <div className="min-w-0">
                      <div className="font-extrabold truncate">{i.name}</div>
                      <div className="text-sm muted">
                        {i.sku} • {moneyVND(i.price)} (niêm yết)
                      </div>
                      <div className="text-sm text-slate-700">
                        Số lượng: <b>{i.qty}</b>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-extrabold text-amber-600">
                      {moneyVND(Number(i.price) * Number(i.qty))}
                    </div>
                    <div className="mt-2 flex items-center justify-end gap-2">
                      <button className="btn w-11 h-11 p-0" type="button" onClick={() => onCartMinus(i.id)}>
                        <i className="fa-solid fa-minus" />
                      </button>
                      <button className="btn w-11 h-11 p-0" type="button" onClick={() => onCartPlus(i.id)}>
                        <i className="fa-solid fa-plus" />
                      </button>
                      <button className="btn" type="button" onClick={() => onCartRemove(i.id)}>
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 text-sm text-slate-700">
              Giỏ hàng trống.
            </div>
          )}
        </div>

        <div className="mt-5 divider" />

        <div className="mt-5 grid gap-3">
          <div>
            <label className="text-sm font-extrabold text-slate-700">Voucher (demo)</label>
            <div className="mt-2 flex gap-2">
              <input
                className="field"
                value={voucherInput}
                onChange={(e) => setVoucherInput(e.target.value)}
                placeholder="AYA10 / FREESHIP"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submitVoucher();
                  }
                }}
              />
              <button className="btn btn-accent" type="button" onClick={submitVoucher}>
                <i className="fa-solid fa-ticket mr-2" />
                Áp dụng
              </button>
            </div>
            <div className="mt-2 text-sm muted">{voucherNote}</div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
            <div className="flex items-center justify-between text-sm">
              <span className="muted font-extrabold">Tạm tính</span>
              <b>{moneyVND(sub)}</b>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="muted font-extrabold">Giảm giá</span>
              <b>{"-" + moneyVND(disc)}</b>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="muted font-extrabold">Vận chuyển</span>
              <b>{moneyVND(ship)}</b>
            </div>
            <div className="mt-3 divider" />
            <div className="mt-3 flex items-center justify-between">
              <span className="font-extrabold">Tổng thanh toán</span>
              <span className="text-2xl font-extrabold text-amber-600">{moneyVND(total)}</span>
            </div>
            <div className="mt-3 text-xs muted">Prototype: giá có thể tính server-side để tránh gian lận.</div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
          <div className="font-extrabold">Hỗ trợ nhanh</div>
          <div className="mt-2 text-sm text-slate-700">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-phone text-indigo-600" /> 0900 000 000
            </div>
            <div className="flex items-center gap-2 mt-1">
              <i className="fa-solid fa-message text-indigo-600" /> Zalo AYANAVITA
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 card p-6">
        <div className="font-extrabold">Lịch sử đơn (demo)</div>
        <div className="mt-3 text-sm muted">Lưu localStorage. Khi làm thật: /orders của user.</div>

        <div className="mt-3 grid gap-2">
          {ordersMini.length ? (
            ordersMini.map((o: Order) => (
              <div key={o.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-extrabold">{o.code}</div>
                    <div className="text-sm muted">{o.createdAt}</div>
                    <div className="text-sm text-slate-700 mt-1">
                      Tổng: <b>{moneyVND(o.total)}</b>
                    </div>
                  </div>
                  <span className="chip">
                    <i
                      className={`fa-solid fa-circle ${
                        o.payStatus === "Đã thanh toán" ? "text-emerald-500" : "text-amber-500"
                      }`}
                    />
                    {o.payStatus}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 text-sm text-slate-700">
              Chưa có đơn.
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
