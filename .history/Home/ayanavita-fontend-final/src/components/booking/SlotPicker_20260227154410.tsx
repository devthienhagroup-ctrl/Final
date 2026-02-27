// src/components/booking/SlotPicker.tsx
import React from "react";
import type { Slot } from "../../services/useBookingSlots";

export function SlotPicker({
  slots,
  selected,
  customTime,
  onPick,
  onCustomTime,
  onRefresh,
  loading,
  durationMin,
  capacity,
}: {
  slots: Slot[];
  selected: string | null;
  customTime: string;
  onPick: (t: string) => void;
  onCustomTime: (value: string) => void;
  onRefresh: () => void;
  loading?: boolean;
  durationMin?: number;
  capacity?: number;
}) {
  return (
    <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-extrabold text-slate-500">Khung giờ gợi ý</div>
          <div className="text-xl font-extrabold">Chọn giờ phù hợp</div>
          <div className="mt-1 text-xs text-slate-500">{durationMin ? `Mỗi slot ${durationMin} phút` : "Chọn chi nhánh + dịch vụ + ngày"}{capacity ? ` • Năng lực: ${capacity} slot đồng thời` : ""}</div>
        </div>
        <button className="rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-300 px-4 py-2 text-sm font-extrabold text-slate-900 ring-1 ring-amber-200 hover:opacity-95" onClick={onRefresh} type="button">
          ↻ Làm mới
        </button>
      </div>

      {loading ? <div className="mt-4 text-sm text-slate-500">Đang tải khung giờ...</div> : null}

      <div className="mt-4 grid grid-cols-3 gap-2">
        {slots.map((s) => {
          const disabled = !s.available;
          const active = selected === s.t;
          return (
            <button
              key={s.t}
              type="button"
              disabled={disabled}
              onClick={() => onPick(s.t)}
              className={[
                "aspect-square rounded-2xl p-2 text-center ring-1 ring-slate-200 transition-all",
                disabled ? "cursor-not-allowed bg-slate-100 opacity-60" : "bg-white hover:bg-slate-50",
                active
                  ? "-translate-y-0.5 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500 shadow-[0_0_0_3px_rgba(99,102,241,0.18)]"
                  : "",
              ].join(" ")}
            >
              <div className="text-sm font-extrabold">{s.t}</div>
              <div className={["mt-1 text-[11px]", active ? "text-indigo-700" : "text-slate-500"].join(" ")}>{disabled ? "Hết chỗ" : "Còn chỗ"}</div>
            </button>
          );
        })}
      </div>

      <div className={["mt-4 rounded-2xl border p-3", customTime ? "border-indigo-500 ring-2 ring-indigo-100" : "border-slate-200"].join(" ")}>
        <div className="text-sm font-extrabold text-slate-700">Giờ tuỳ chọn</div>
        <input
          type="time"
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-4 focus:ring-indigo-100"
          value={customTime}
          onChange={(e) => onCustomTime(e.target.value)}
        />
        <div className="mt-1 text-xs text-slate-500">Khi dùng giờ tuỳ chọn, ô này sẽ được active thay cho khung giờ gợi ý.</div>
      </div>
    </aside>
  );
}
