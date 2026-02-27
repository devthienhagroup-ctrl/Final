// src/components/booking/PolicyModal.tsx
import React, { useEffect } from "react";

export type PolicyModalCmsData = {
  headerKicker: string;
  headerTitle: string;
  items: string[];
  noteText: string;
  confirmButtonText: string;
  closeAriaLabel: string;
};

const defaultCmsData: PolicyModalCmsData = {
  headerKicker: "Chính sách",
  headerTitle: "Hủy/đổi lịch (demo)",
  items: [
    "Hủy trước 2 giờ: miễn phí.",
    "Hủy dưới 2 giờ: có thể giữ cọc (tuỳ dịch vụ).",
    "Trễ quá 15 phút: slot có thể bị chuyển.",
  ],
  noteText: "Prototype: quy định thật sẽ lấy từ CMS/Backend.",
  confirmButtonText: "Đã hiểu",
  closeAriaLabel: "Đóng",
};

export function PolicyModal({
                              open,
                              onClose,
                              cmsData,
                            }: {
  open: boolean;
  onClose: () => void;
  cmsData?: Partial<PolicyModalCmsData>;
}) {
  const cms: PolicyModalCmsData = { ...defaultCmsData, ...(cmsData || {}) };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
      <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
      >
        <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <div className="text-xs font-extrabold text-slate-500">{cms.headerKicker}</div>
              <div className="text-lg font-extrabold">{cms.headerTitle}</div>
            </div>
            <button
                className="h-10 w-10 rounded-2xl border border-slate-200 bg-white font-extrabold"
                onClick={onClose}
                aria-label={cms.closeAriaLabel}
                type="button"
            >
              ✕
            </button>
          </div>

          <div className="p-6">
            <ul className="space-y-2 text-sm text-slate-700">
              {cms.items.map((t, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="font-extrabold text-amber-600">•</span> {t}
                  </li>
              ))}
            </ul>

            <div className="mt-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 text-sm text-slate-700">
              {cms.noteText}
            </div>
          </div>

          <div className="flex justify-end px-6 pb-6">
            <button
                className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 px-4 py-3 text-sm font-extrabold text-white ring-1 ring-indigo-200 hover:opacity-95"
                onClick={onClose}
                type="button"
            >
              {cms.confirmButtonText}
            </button>
          </div>
        </div>
      </div>
  );
}