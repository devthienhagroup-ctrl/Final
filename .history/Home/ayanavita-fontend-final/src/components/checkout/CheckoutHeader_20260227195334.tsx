import React from "react";
import { useNavigate } from "react-router-dom";

interface ChipItem {
  icon: string;   // FontAwesome class
  text: string;
}

interface CmsData {
  hotlineLabel?: string;
  hotlineNumber?: string;
  chips?: ChipItem[];               // mảng các chip với icon và text
  stepLabels?: string[];             // 3 phần tử: Thông tin, Thanh toán, Xác nhận
  backButtonText?: string;
  backButtonIcon?: string;           // class FontAwesome cho nút quay lại
}

interface CheckoutHeaderProps {
  step2Active: boolean;
  step3Active: boolean;
  cmsData?: CmsData;
}

export function CheckoutHeader({
                                 step2Active,
                                 step3Active,
                                 cmsData,
                               }: CheckoutHeaderProps) {
  const nav = useNavigate();

  // Default content (lấy từ giao diện hiện tại)
  const defaultCms: Required<CmsData> = {
    hotlineLabel: "Hotline:",
    hotlineNumber: "0900 000 000",
    chips: [
      { icon: "fa-solid fa-shield-halved", text: "Checkout bảo mật (demo)" },
      { icon: "fa-solid fa-truck-fast", text: "Giao nhanh" },
      { icon: "fa-solid fa-rotate-left", text: "Đổi trả 7 ngày" },
    ],
    stepLabels: ["Thông tin", "Thanh toán", "Xác nhận"],
    backButtonText: "Quay lại",
    backButtonIcon: "fa-solid fa-arrow-left",
  };

  // Merge cmsData với default
  const {
    hotlineLabel,
    hotlineNumber,
    chips,
    stepLabels,
    backButtonText,
    backButtonIcon,
  } = { ...defaultCms, ...cmsData };

  return (
      <>
        {/* Top mini bar */}
        <div className="bg-white border-b border-slate-200">
          <div className="mx-auto max-w-7xl px-4 py-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              {chips.map((chip, index) => (
                  <span key={index} className="chip">
                <i className={`${chip.icon} text-indigo-600`} />
                    {chip.text}
              </span>
              ))}
            </div>
            <div className="text-sm font-extrabold text-slate-700">
              {hotlineLabel}{" "}
              <a className="underline" href={`tel:${hotlineNumber.replace(/\s/g, '')}`}>
                {hotlineNumber}
              </a>
            </div>
          </div>
        </div>

        {/* Header */}
        <header className="sticky top-[70px] z-50 bg-white/80 backdrop-blur border-b border-slate-200">
          <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Logo area (giữ nguyên comment) */}
            </div>

            <div className="hidden lg:flex items-center gap-2">
              <div className="step active">
                <span className="dot">1</span>{stepLabels[0]}
              </div>
              <div className={`step ${step2Active ? "active" : ""}`}>
                <span className="dot">2</span>{stepLabels[1]}
              </div>
              <div className={`step ${step3Active ? "active" : ""}`}>
                <span className="dot">3</span>{stepLabels[2]}
              </div>
            </div>

            <button className="btn" type="button" onClick={() => nav(-1)}>
              <i className={`${backButtonIcon} mr-2`} />
              {backButtonText}
            </button>
          </div>
        </header>
      </>
  );
}