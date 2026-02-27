import React from "react";
import type { Order } from "../../services/checkout.storage";
import { moneyVND } from "../../services/money.utils";

export function ConfirmCard({
  onPay,
  onSaveDraft,
  showError,
  order,
  onMarkPaid,
  onViewOrders,
}: {
  onPay: () => void;
  onSaveDraft: () => void;
  showError: boolean;
  order: Order | null;
  onMarkPaid: () => void;
  onViewOrders: () => void;
}) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xs font-extrabold muted">Bước 3</div>
          <div className="text-2xl font-extrabold">Xác nhận & tạo đơn</div>
          <div className="mt-1 text-sm text-slate-700">Nút “Thanh toán” sẽ tạo order + mô phỏng trạng thái.</div>
        </div>
        <span className="chip">
          <i className="fa-solid fa-receipt text-amber-600" />
          Order
        </span>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <button className="btn btn-primary" type="button" onClick={onPay}>
          <i className="fa-solid fa-lock mr-2" />
          Thanh toán & tạo đơn
        </button>
        <button className="btn" type="button" onClick={onSaveDraft}>
          <i className="fa-solid fa-floppy-disk mr-2" />
          Lưu thông tin (demo)
        </button>
      </div>

      {order ? (
        <div className="mt-5 rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-200">
          <div className="font-extrabold text-emerald-900">Đặt hàng thành công (demo)</div>
          <div className="mt-2 text-sm text-emerald-800">
            Mã đơn: {order.code} • Tổng: {moneyVND(order.total)} • Thanh toán:{" "}
            {order.payMethod.toUpperCase()} • Giao: {order.shipping.toUpperCase()} • Tạo lúc:{" "}
            {order.createdAt}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="chip">
              <i className={`fa-solid fa-circle ${order.payStatus === "Đã thanh toán" ? "text-emerald-500" : "text-amber-500"}`} />
              {order.payStatus}
            </span>

            <button className="btn" type="button" onClick={onMarkPaid}>
              <i className="fa-solid fa-circle-check mr-2" />
              Đánh dấu đã thanh toán
            </button>

            <button className="btn" type="button" onClick={onViewOrders}>
              <i className="fa-solid fa-list mr-2" />
              Xem lịch sử đơn
            </button>
          </div>
        </div>
      ) : null}

      {showError ? (
        <div className="mt-5 rounded-2xl bg-rose-50 p-5 ring-1 ring-rose-200 text-rose-800 text-sm font-extrabold">
          Vui lòng kiểm tra thông tin bắt buộc.
        </div>
      ) : null}
    </div>
  );
}
