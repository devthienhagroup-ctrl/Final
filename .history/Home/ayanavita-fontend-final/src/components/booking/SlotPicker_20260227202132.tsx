// src/components/booking/SlotPicker.tsx
import React from "react";
import type { Slot } from "../../services/useBookingSlots";

export type SlotPickerCmsData = {
  headingKicker?: string;
  headingTitle?: string;
  refreshButtonText?: string;

  durationText?: string;          // "Mỗi slot {duration} phút"
  capacityText?: string;          // "Năng lực: {capacity} slot đồng thời"
  instructionText?: string;       // "Chọn chi nhánh + dịch vụ + ngày"

  loadingText?: string;           // "Đang tải khung giờ..."

  availableText?: string;
  unavailableText?: string;
  availableMark?: string;
  unavailableMark?: string;

  badgeText?: string;
  badgeIconClass?: string;

  customTimeTitle?: string;       // "Giờ tuỳ chọn"
  customTimeDescription?: string; // mô tả bên dưới input
};

const DEFAULT_CMS_DATA: Required<SlotPickerCmsData> = {
  headingKicker: "Khung giờ",
  headingTitle: "Chọn giờ phù hợp",
  refreshButtonText: "↻ Làm mới",

  durationText: "Mỗi slot {duration} phút",
  capacityText: "Năng lực: {capacity} slot đồng thời",
  instructionText: "Chọn chi nhánh + dịch vụ + ngày",

  loadingText: "Đang tải khung giờ...",

  availableText: "Còn chỗ",
  unavailableText: "Hết chỗ",
  availableMark: "○",
  unavailableMark: "⛔",

  badgeText: "Slot",
  badgeIconClass: "fa-solid fa-clock",

  customTimeTitle: "Giờ tuỳ chọn",
  customTimeDescription:
    "Khi dùng giờ tuỳ chọn, ô này sẽ được active thay cho khung giờ gợi ý.",
};

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
  cmsData,
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
  cmsData?: SlotPickerCmsData;
}) {
  const data = { ...DEFAULT_CMS_DATA, ...(cmsData || {}) };

  const metaText = durationMin
    ? data.durationText.replace("{duration}", String(durationMin))
    : data.instructionText;

  const capacityMeta = capacity
    ? ` • ${data.capacityText.replace("{capacity}", String(capacity))}`
    : "";

  return (
    <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-extrabold text-slate-500">
            {data.headingKicker}
          </div>

          <div className="text-xl font-extrabold flex items-center gap-2">
            <i className={data.badgeIconClass}></i>
            {data.headingTitle}
          </div>

          <div className="mt-1 text-xs text-slate-500">
            {metaText}
            {capacityMeta}
          </div>
        </div>

        <button
          className="rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-300 px-4 py-2 text-sm font-extrabold text-slate-900 ring-1 ring-amber-200 hover:opacity-95"
          onClick={onRefresh}
          type="button"
        >
          {data.refreshButtonText}
        </button>
      </div>

      {loading ? (
        <div className="mt-4 text-sm text-slate-500">
          {data.loadingText}
        </div>
      ) : null}

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
                disabled
                  ? "cursor-not-allowed bg-slate-100 opacity-60"
                  : "bg-white hover:bg-slate-50",
                active
                  ? "-translate-y-0.5 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500 shadow-[0_0_0_3px_rgba(99,102,241,0.18)]"
                  : "",
              ].join(" ")}
            >
              <div className="text-sm font-extrabold">{s.t}</div>

              <span className="text-slate-500">
                {disabled ? data.unavailableMark : data.availableMark}
              </span>
            </button>
          );
        })}
      </div>

      <div
        className={[
          "mt-4 rounded-2xl border p-3",
          customTime
            ? "border-indigo-500 ring-2 ring-indigo-100"
            : "border-slate-200",
        ].join(" ")}
      >
        <div className="text-sm font-extrabold text-slate-700">
          {data.customTimeTitle}
        </div>

        <input
          type="time"
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-4 focus:ring-indigo-100"
          value={customTime}
          onChange={(e) => onCustomTime(e.target.value)}
        />

        <div className="mt-1 text-xs text-slate-500">
          {data.customTimeDescription}
        </div>
      </div>
    </aside>
  );
}