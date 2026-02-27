import React from "react";
import { useNavigate } from "react-router-dom";

export function CheckoutHeader({
  step2Active,
  step3Active,
}: {
  step2Active: boolean;
  step3Active: boolean;
}) {
  const nav = useNavigate();

  return (
    <>
      {/* Top mini bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="chip">
              <i className="fa-solid fa-shield-halved text-indigo-600" />
              Checkout bảo mật (demo)
            </span>
            <span className="chip">
              <i className="fa-solid fa-truck-fast text-amber-600" />
              Giao nhanh
            </span>
            <span className="chip">
              <i className="fa-solid fa-rotate-left text-indigo-600" />
              Đổi trả 7 ngày
            </span>
          </div>
          <div className="text-sm font-extrabold text-slate-700">
            Hotline:{" "}
            <a className="underline" href="tel:0900000000">
              0900 000 000
            </a>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="h-11 w-11 rounded-2xl flex items-center justify-center text-white font-extrabold"
              style={{
                background: "linear-gradient(135deg,var(--aya-primary),var(--aya-secondary))",
              }}
            >
              A
            </div>
            <div>
              <div className="text-lg font-extrabold leading-5">AYANAVITA</div>
              <div className="text-xs font-extrabold text-slate-500">Thanh toán sản phẩm</div>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <div className="step active">
              <span className="dot">1</span>Thông tin
            </div>
            <div className={`step ${step2Active ? "active" : ""}`}>
              <span className="dot">2</span>Thanh toán
            </div>
            <div className={`step ${step3Active ? "active" : ""}`}>
              <span className="dot">3</span>Xác nhận
            </div>
          </div>

          <button className="btn" type="button" onClick={() => nav(-1)}>
            <i className="fa-solid fa-arrow-left mr-2" />
            Quay lại
          </button>
        </div>
      </header>
    </>
  );
}
