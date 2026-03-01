// src/components/booking/TrustSection.tsx
import React from "react";

export function TrustSection({ onPolicy }: { onPolicy: () => void }) {
  return (
    <section className="mt-5 grid gap-4 lg:grid-cols-3">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
        <div className="flex items-center justify-between">
          <div className="text-lg font-extrabold">Quy trình đặt lịch 3 bước</div>
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-extrabold">
            ✅ Dễ thao tác
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            ["Bước 1", "Chọn dịch vụ", "Gói trị liệu + thời lượng + giá."],
            ["Bước 2", "Chọn giờ", "Gợi ý slot rảnh, ưu tiên đặt trước."],
            ["Bước 3", "Xác nhận", "Nhận mã booking, nhắc lịch tự động."],
          ].map(([k, t, d]) => (
            <div key={k} className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <div className="text-xs font-extrabold text-slate-500">{k}</div>
              <div className="mt-1 font-extrabold">{t}</div>
              <div className="mt-1 text-sm text-slate-600">{d}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-lg font-extrabold">Lưu ý</div>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          <li className="flex gap-2">
            <span className="font-extrabold text-amber-600">•</span> Đến trước 5–10 phút để check-in.
          </li>
          <li className="flex gap-2">
            <span className="font-extrabold text-amber-600">•</span> Hủy lịch: trước 2 giờ (demo).
          </li>
          <li className="flex gap-2">
            <span className="font-extrabold text-amber-600">•</span> Chuyên viên có thể thay đổi nếu phát sinh.
          </li>
        </ul>
        <button
          type="button"
          onClick={onPolicy}
          className="mt-4 w-full rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 px-4 py-3 text-sm font-extrabold text-white ring-1 ring-indigo-200 hover:opacity-95"
        >
          📄 Chính sách
        </button>
      </div>
    </section>
  );
}
