// src/components/booking/SlotPicker.tsx
import React from "react";
import type { Slot } from "../../services/useBookingSlots";

export type SlotPickerCmsData = {
  headingKicker?: string;        // "Khung giờ"
  headingTitle?: string;         // "Chọn giờ phù hợp"
  refreshButtonText?: string;    // "↻ Làm mới"
  availableText?: string;        // "Còn chỗ"
  unavailableText?: string;      // "Hết chỗ"
  availableMark?: string;        // "○"
  unavailableMark?: string;      // "⛔"
  badgeText?: string;            // "Slot"
  badgeIconClass?: string;       // "fa-solid fa-clock"
};

const DEFAULT_CMS_DATA: Required<SlotPickerCmsData> = {
  headingKicker: "Khung giờ",
  headingTitle: "Chọn giờ phù hợp",
  refreshButtonText: "↻ Làm mới",
  availableText: "Còn chỗ",
  unavailableText: "Hết chỗ",
  availableMark: "○",
  unavailableMark: "⛔",
  badgeText: "Slot",
  badgeIconClass: "fa-solid fa-clock",
};

export function SlotPicker({
                             slots,
                             selected,
                             onPick,
                             onRefresh,
                             cmsData,
                           }: {
  slots: Slot[];
  selected: string | null;
  onPick: (t: string) => void;
  onRefresh: () => void;
  cmsData?: SlotPickerCmsData;
}) {
  const cms = { ...DEFAULT_CMS_DATA, ...(cmsData ?? {}) };

  return (
      <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-extrabold text-slate-500">{cms.headingKicker}</div>
            <div className="text-xl font-extrabold">{cms.headingTitle}</div>
          </div>
          <button
              className="rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-300 px-4 py-2 text-sm font-extrabold text-slate-900 ring-1 ring-amber-200 hover:opacity-95"
              onClick={onRefresh}
              type="button"
          >
            {cms.refreshButtonText}
          </button>
        </div>

        <div className="mt-4 grid gap-2">
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
                      "flex w-full items-center justify-between rounded-3xl p-3 text-left ring-1 ring-slate-200",
                      disabled ? "cursor-not-allowed bg-slate-100 opacity-60" : "bg-white hover:bg-slate-50",
                      active ? "ring-2 ring-indigo-500" : "",
                    ].join(" ")}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">{disabled ? cms.unavailableMark : cms.availableMark}</span>
                    <div>
                      <div className="font-extrabold">{s.t}</div>
                      <div className="text-xs text-slate-500">{disabled ? cms.unavailableText : cms.availableText}</div>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-extrabold">
                <i className={cms.badgeIconClass}></i> {cms.badgeText}
              </span>
                </button>
            );
          })}
        </div>
      </aside>
  );
}