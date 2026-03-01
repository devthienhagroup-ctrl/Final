// src/components/checkout/OrderSummary.tsx
import React from "react";
import { Link } from "react-router-dom";
import type { OrderItem, ShippingMethod } from "../../services/productCheckout.utils";
import { money } from "../../services/booking.utils";

export function OrderSummary({
  items,
  voucherCode,
  onVoucherChange,
  onApplyVoucher,
  voucherNote,
  subtotal,
  discount,
  shipFee,
  total,
  shipping,
}: {
  items: OrderItem[];
  voucherCode: string;
  onVoucherChange: (v: string) => void;
  onApplyVoucher: () => void;
  voucherNote: string;
  subtotal: number;
  discount: number;
  shipFee: number;
  total: number;
  shipping: ShippingMethod;
}) {
  return (
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
        {items.length ? (
          items.map((i) => (
            <div key={i.sku} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-extrabold truncate">{i.name}</div>
                  <div className="text-sm muted">
                    {i.productId} • {money(i.price)}
                  </div>
                  <div className="text-sm text-slate-700">
                    Số lượng: <b>{i.qty}</b>
                  </div>
                </div>
                <div className="font-extrabold text-amber-600">{money(i.price * i.qty)}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 text-sm text-slate-700">
            Giỏ hàng trống. <Link className="font-extrabold text-indigo-600" to="/products">Mua sắm ngay</Link>
          </div>
        )}
      </div>

      <div className="mt-5">
        <label className="text-sm font-extrabold text-slate-700">Voucher (demo)</label>
        <div className="mt-2 flex gap-2">
          <input className="field" placeholder="AYA10 / FREESHIP" value={voucherCode} onChange={(e) => onVoucherChange(e.target.value)} />
          <button className="btn btn-accent" type="button" onClick={onApplyVoucher}>
            <i className="fa-solid fa-ticket mr-2" />
            Áp dụng
          </button>
        </div>
        <div className="mt-2 text-sm muted">
          {voucherNote || "Voucher demo: AYA10 (10%), FREESHIP (miễn phí ship)."}
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
        <div className="flex items-center justify-between text-sm">
          <span className="muted font-extrabold">Tạm tính</span>
          <b>{money(subtotal)}</b>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="muted font-extrabold">Giảm giá</span>
          <b>{money(discount)}</b>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="muted font-extrabold">Vận chuyển ({shipping.toUpperCase()})</span>
          <b>{money(shipFee)}</b>
        </div>
        <div className="mt-3 divider" />
        <div className="mt-3 flex items-center justify-between">
          <span className="font-extrabold">Tổng thanh toán</span>
          <span className="text-2xl font-extrabold text-amber-600">{money(total)}</span>
        </div>
        <div className="mt-3 text-xs muted">Prototype: giá có thể tính server-side để tránh gian lận.</div>
      </div>
    </div>
  );
}
