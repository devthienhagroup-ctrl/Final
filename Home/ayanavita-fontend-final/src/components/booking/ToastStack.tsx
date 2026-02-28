// src/components/booking/ToastStack.tsx
import React from "react";
import type { ToastItem } from "../../services/useToast";

export function ToastStack({
  items,
  onClose,
}: {
  items: ToastItem[];
  onClose: (id: string) => void;
}) {
  const current = items[0];
  if (!current) return null;

  const tone = {
    success: {
      ring: "border-emerald-100",
      iconWrap: "bg-gradient-to-r from-emerald-100 to-green-100",
      iconColor: "text-emerald-600",
      icon: "✓",
    },
    error: {
      ring: "border-rose-100",
      iconWrap: "bg-gradient-to-r from-rose-100 to-red-100",
      iconColor: "text-rose-600",
      icon: "!",
    },
    info: {
      ring: "border-sky-100",
      iconWrap: "bg-gradient-to-r from-sky-100 to-blue-100",
      iconColor: "text-sky-600",
      icon: "i",
    },
  }[current.status];

  return (
    <div className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className={`pointer-events-auto w-full max-w-md rounded-3xl border bg-white p-6 text-center shadow-2xl ${tone.ring}`}>
        <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${tone.iconWrap}`}>
          <span className={`text-2xl ${tone.iconColor}`}>{tone.icon}</span>
        </div>
        <div className="mt-3 font-extrabold text-slate-900">{current.title}</div>
        {current.desc ? <div className="mt-1 text-sm text-slate-600">{current.desc}</div> : null}
        <button
          className="mt-5 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 px-5 py-2 text-sm font-extrabold text-white hover:opacity-95"
          aria-label="close"
          onClick={() => onClose(current.id)}
        >
          Đóng
        </button>
      </div>
    </div>
  );
}
