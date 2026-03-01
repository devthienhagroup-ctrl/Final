// src/components/booking/BookingForm.tsx
import React, { useEffect, useMemo, useState } from "react";
import type { DemoBranch, DemoService } from "../../services/booking.demo";
import type { Booking } from "../../services/booking.storage";
import { uid, money, isValidPhone, toISODate } from "../../services/booking.utils";

export type BookingDraft = {
  name: string;
  phone: string;
  email: string;
  date: string;
  note: string;
};

export function BookingForm({
  services,
  branches,
  selectedServiceId,
  selectedBranchId,
  selectedSlot,
  onToast,
  onCreate,
  onResetSignal,
  initialName,
  onServiceChange,
  onBranchChange,
  onDateChange,
                                cmsData,

}: {
  services: DemoService[];
  branches: DemoBranch[];
  selectedServiceId: string;
  selectedBranchId: string;
  selectedSlot: string | null;
  onToast: (t: string, d?: string) => void;
  onCreate: (b: Booking) => void;
  onResetSignal: number;
  initialName?: string;
  onServiceChange: (serviceId: string) => void;
  onBranchChange: (branchId: string) => void;
  onDateChange: (date: string) => void;
}) {
  const tomorrow = useMemo(() => toISODate(new Date(Date.now() + 86400000)), []);
  const [draft, setDraft] = useState<BookingDraft>(() => ({
    name: initialName || "",
    phone: "",
    email: "",
    date: tomorrow,
    note: "",
  }));

  useEffect(() => {
    if (initialName) setDraft((d) => ({ ...d, name: initialName }));
  }, [initialName]);

  useEffect(() => {
    setDraft({
      name: initialName || "",
      phone: "",
      email: "",
      date: tomorrow,
      note: "",
    });
    onDateChange(tomorrow);
  }, [onResetSignal, initialName, onDateChange, tomorrow]);

  const svc = useMemo(() => services.find((s) => s.id === selectedServiceId), [services, selectedServiceId]);
  const branchPick = useMemo(() => branches.find((b) => b.id === selectedBranchId), [branches, selectedBranchId]);

  const update = <K extends keyof BookingDraft>(k: K, v: BookingDraft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const create = () => {
    const name = draft.name.trim();
    const phone = draft.phone.trim();
    const date = draft.date;
    const pickedTime = selectedSlot;

    if (!name) return onToast("Thiếu thông tin", "Vui lòng nhập họ và tên.");
    if (!isValidPhone(phone)) return onToast("Số điện thoại chưa đúng", "Vui lòng nhập số bắt đầu bằng 0 và đủ 10–11 số.");
    if (!date) return onToast("Thiếu ngày", "Vui lòng chọn ngày.");
    if (!svc) return onToast("Thiếu dịch vụ", "Vui lòng chọn dịch vụ trước.");
    if (!branchPick) return onToast("Thiếu chi nhánh", "Vui lòng chọn chi nhánh.");
    if (!pickedTime) return onToast("Chưa chọn giờ", "Vui lòng chọn khung giờ hoặc nhập giờ tùy chọn.");

    const booking: Booking = {
      id: uid("BK"),
      createdAt: new Date().toISOString(),
      name,
      phone,
      email: draft.email.trim(),
      notify: "email",
      serviceId: svc.id,
      serviceName: svc.name,
      duration: svc.duration,
      price: svc.price,
      staffId: null,
      staffName: "Hệ thống phân bổ",
      branchId: branchPick.id,
      branchName: branchPick.name,
      date,
      time: pickedTime,
      note: draft.note.trim(),
      status: "confirmed",
    };

    onCreate(booking);
    onToast("Tạo lịch hẹn thành công", `Mã: ${booking.id} • ${booking.date} ${booking.time}`);
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-extrabold text-slate-500">Form đặt lịch</div>
          <div className="text-2xl font-extrabold">Thông tin & lựa chọn</div>
          <div className="mt-1 text-sm text-slate-600">Bạn có thể đặt cho bản thân hoặc người thân.</div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-extrabold">
          🔒 Bảo mật
        </span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-extrabold text-slate-700">Họ và tên *</label>
          <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:ring-4 focus:ring-indigo-100" placeholder="Ví dụ: Lê Hiếu" value={draft.name} onChange={(e) => update("name", e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-extrabold text-slate-700">Số điện thoại *</label>
          <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:ring-4 focus:ring-indigo-100" placeholder="09xx xxx xxx" value={draft.phone} onChange={(e) => update("phone", e.target.value)} />
        </div>

        <div>
          <label className="text-sm font-extrabold text-slate-700">Email (tuỳ chọn)</label>
          <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:ring-4 focus:ring-indigo-100" placeholder="email@example.com" value={draft.email} onChange={(e) => update("email", e.target.value)} />
        </div>

        <div>
          <label className="text-sm font-extrabold text-slate-700">Dịch vụ *</label>
          <select
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-4 focus:ring-indigo-100"
            value={selectedServiceId}
            onChange={(e) => onServiceChange(e.target.value)}
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} • {s.duration} phút • {money(s.price)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-extrabold text-slate-700">Chi nhánh *</label>
          <select
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-4 focus:ring-indigo-100"
            value={selectedBranchId}
            disabled={!selectedServiceId || !branches.length}
            onChange={(e) => onBranchChange(e.target.value)}
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-extrabold text-slate-700">Ngày *</label>
          <input
            type="date"
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:ring-4 focus:ring-indigo-100"
            value={draft.date}
            onChange={(e) => {
              update("date", e.target.value);
              onDateChange(e.target.value);
            }}
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-extrabold text-slate-700">Ghi chú</label>
          <textarea rows={3} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:ring-4 focus:ring-indigo-100" placeholder="Tình trạng da, nhu cầu…" value={draft.note} onChange={(e) => update("note", e.target.value)} />
        </div>
      </div>

      <div className="mt-4 rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
        <div className="text-sm text-slate-700">
          Khung giờ đã chọn: <b>{selectedSlot || "Chưa chọn"}</b>
          <span className="text-slate-500"> • Dự kiến: </span>
          <b>{svc ? `${svc.duration} phút` : "—"}</b>
        </div>

        <div className="mt-3 flex gap-2">
          <button type="button" className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 px-4 py-3 text-sm font-extrabold text-white ring-1 ring-indigo-200 hover:opacity-95" onClick={create}>
            ➕ Tạo lịch hẹn
          </button>
        </div>

        <div className="mt-2 text-sm text-slate-600">
          Giá tham khảo: <b>{svc ? money(svc.price) : "—"}</b> <span className="text-slate-500">• Có thể thay đổi theo tình trạng/ liệu trình.</span>
        </div>
      </div>
    </div>
  );
}
