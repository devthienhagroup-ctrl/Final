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

  return (
    <div className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="pointer-events-auto w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-emerald-100 to-green-100">
          <span className="text-2xl text-emerald-600">✓</span>
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
