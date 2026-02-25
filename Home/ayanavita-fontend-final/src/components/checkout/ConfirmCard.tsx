import React from "react";
import type { Order } from "../../services/checkout.storage";
import { moneyVND } from "../../services/money.utils";

// Type cho CMS content – chỉ chứa text, không chứa style
export interface ConfirmCardCMS {
  stepTitle?: string;
  mainTitle?: string;
  description?: string;
  chipLabel?: string;
  payButtonText?: string;
  draftButtonText?: string;
  successTitle?: string;
  orderCodeLabel?: string;
  orderTotalLabel?: string;
  orderPayMethodLabel?: string;
  orderShippingLabel?: string;
  orderCreatedAtLabel?: string;
  markPaidButtonText?: string;
  viewOrdersButtonText?: string;
  errorMessage?: string;
}

// Nội dung mặc định (dùng khi không có cmsData)
export const DEFAULT_CONFIRM_CARD_CMS: ConfirmCardCMS = {
  stepTitle: "Bước 3",
  mainTitle: "Xác nhận & tạo đơn",
  description: "Nút “Thanh toán” sẽ tạo order + mô phỏng trạng thái.",
  chipLabel: "Order",
  payButtonText: "Thanh toán & tạo đơn",
  draftButtonText: "Lưu thông tin (demo)",
  successTitle: "Đặt hàng thành công (demo)",
  orderCodeLabel: "Mã đơn:",
  orderTotalLabel: "Tổng:",
  orderPayMethodLabel: "Thanh toán:",
  orderShippingLabel: "Giao:",
  orderCreatedAtLabel: "Tạo lúc:",
  markPaidButtonText: "Đánh dấu đã thanh toán",
  viewOrdersButtonText: "Xem lịch sử đơn",
  errorMessage: "Vui lòng kiểm tra thông tin bắt buộc.",
};

export function ConfirmCard({
                              onPay,
                              onSaveDraft,
                              showError,
                              order,
                              onMarkPaid,
                              onViewOrders,
                              cmsData, // <-- thêm prop
                            }: {
  onPay: () => void;
  onSaveDraft: () => void;
  showError: boolean;
  order: Order | null;
  onMarkPaid: () => void;
  onViewOrders: () => void;
  cmsData?: ConfirmCardCMS; // optional
}) {
  // Gộp nội dung mặc định với nội dung từ CMS (nếu có)
  const cms = { ...DEFAULT_CONFIRM_CARD_CMS, ...cmsData };

  return (
      <div className="card p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-xs font-extrabold muted">{cms.stepTitle}</div>
            <div className="text-2xl font-extrabold">{cms.mainTitle}</div>
            <div className="mt-1 text-sm text-slate-700">{cms.description}</div>
          </div>
          <span className="chip">
          <i className="fa-solid fa-receipt text-amber-600" />
            {cms.chipLabel}
        </span>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button className="btn btn-primary" type="button" onClick={onPay}>
            <i className="fa-solid fa-lock mr-2" />
            {cms.payButtonText}
          </button>
          <button className="btn" type="button" onClick={onSaveDraft}>
            <i className="fa-solid fa-floppy-disk mr-2" />
            {cms.draftButtonText}
          </button>
        </div>

        {order ? (
            <div className="mt-5 rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-200">
              <div className="font-extrabold text-emerald-900">{cms.successTitle}</div>
              <div className="mt-2 text-sm text-emerald-800">
                {cms.orderCodeLabel} {order.code} • {cms.orderTotalLabel}{" "}
                {moneyVND(order.total)} • {cms.orderPayMethodLabel}{" "}
                {order.payMethod.toUpperCase()} • {cms.orderShippingLabel}{" "}
                {order.shipping.toUpperCase()} • {cms.orderCreatedAtLabel}{" "}
                {order.createdAt}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
            <span className="chip">
              <i
                  className={`fa-solid fa-circle ${
                      order.payStatus === "Đã thanh toán"
                          ? "text-emerald-500"
                          : "text-amber-500"
                  }`}
              />
              {order.payStatus}
            </span>

                <button className="btn" type="button" onClick={onMarkPaid}>
                  <i className="fa-solid fa-circle-check mr-2" />
                  {cms.markPaidButtonText}
                </button>

                <button className="btn" type="button" onClick={onViewOrders}>
                  <i className="fa-solid fa-list mr-2" />
                  {cms.viewOrdersButtonText}
                </button>
              </div>
            </div>
        ) : null}

        {showError ? (
            <div className="mt-5 rounded-2xl bg-rose-50 p-5 ring-1 ring-rose-200 text-rose-800 text-sm font-extrabold">
              {cms.errorMessage}
            </div>
        ) : null}
      </div>
  );
}