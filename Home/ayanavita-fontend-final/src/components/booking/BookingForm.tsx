// src/components/booking/BookingForm.tsx
import React, { useEffect, useMemo, useState } from "react";
import type { DemoBranch, DemoService, DemoStaff } from "../../services/booking.demo";
import type { Booking } from "../../services/booking.storage";
import { uid, money, isValidPhone, toISODate } from "../../services/booking.utils";

export type BookingDraft = {
  name: string;
  phone: string;
  email: string;
  notify: "zalo" | "sms" | "email";
  serviceId: string;
  staffId: string; // "" means auto assign
  branchId: string;
  date: string; // yyyy-mm-dd
  note: string;
};

export type BookingFormCmsField = {
  label: string;
  placeholder?: string;
};

export type BookingFormCmsData = {
  headerEyebrow: string;
  headerTitle: string;
  headerDescription: string;
  securityBadge: string;

  fields: {
    fullName: BookingFormCmsField;
    phone: BookingFormCmsField;
    email: BookingFormCmsField;
    notify: BookingFormCmsField;
    service: BookingFormCmsField;
    staff: BookingFormCmsField;
    branch: BookingFormCmsField;
    date: BookingFormCmsField;
    note: BookingFormCmsField;
  };

  notifyOptions: string[];
  staffNoneOption: string;

  summaryTexts: string[];
  buttons: string[];
  resetToast: string[];
  validationToasts: string[];
  successToast: string[];
};

const DEFAULT_CMS_DATA: BookingFormCmsData = {
  headerEyebrow: "Form đặt lịch",
  headerTitle: "Thông tin & lựa chọn",
  headerDescription: "Bạn có thể đặt cho bản thân hoặc người thân.",
  securityBadge: "Bảo mật",

  fields: {
    fullName: { label: "Họ và tên *", placeholder: "Ví dụ: Lê Hiếu" },
    phone: { label: "Số điện thoại *", placeholder: "09xx xxx xxx" },
    email: { label: "Email (tuỳ chọn)", placeholder: "email@example.com" },
    notify: { label: "Kênh nhắc lịch" },
    service: { label: "Dịch vụ *" },
    staff: { label: "Chuyên viên" },
    branch: { label: "Chi nhánh *" },
    date: { label: "Ngày *" },
    note: { label: "Ghi chú", placeholder: "Tình trạng da, nhu cầu…" },
  },

  notifyOptions: ["Zalo", "SMS", "Email"],
  staffNoneOption: "Không chọn (hệ thống phân bổ)",

  summaryTexts: ["Khung giờ đã chọn:", "Chưa chọn", "Dự kiến:", "phút", "Giá tham khảo:", "Có thể thay đổi theo tình trạng/ liệu trình."],
  buttons: ["Reset", "➕ Tạo lịch hẹn"],
  resetToast: ["Reset", "Bấm Reset ở page để làm sạch toàn bộ."],

  validationToasts: [
    "Thiếu thông tin",
    "Vui lòng nhập họ và tên.",
    "Số điện thoại chưa đúng",
    "Vui lòng nhập số bắt đầu bằng 0 và đủ 10–11 số.",
    "Thiếu ngày",
    "Vui lòng chọn ngày.",
    "Chưa chọn giờ",
    "Vui lòng chọn một khung giờ.",
  ],

  successToast: ["Tạo lịch hẹn thành công", "Mã: {{id}} • {{date}} {{time}}"],
};

const resolveCmsData = (cmsData?: Partial<BookingFormCmsData>): BookingFormCmsData => {
  // Shallow merge: primitive override; arrays override as-is (đúng kiểu CMS content)
  return { ...DEFAULT_CMS_DATA, ...(cmsData ?? {}) };
};

const formatTemplate = (tpl: string, vars: Record<string, string>) =>
    tpl.replace(/\{\{(\w+)\}\}/g, (_, k: string) => (vars[k] ?? ""));

export function BookingForm({
                              services,
                              staff,
                              branches,
                              selectedSlot,
                              onToast,
                              onCreate,
                              onResetSignal,
                              initialName,
                              cmsData,
                            }: {
  services: DemoService[];
  staff: DemoStaff[];
  branches: DemoBranch[];
  selectedSlot: string | null;
  onToast: (t: string, d?: string) => void;
  onCreate: (b: Booking) => void;
  onResetSignal: number; // increase to reset
  initialName?: string;
  cmsData?: Partial<BookingFormCmsData>;
}) {
  const cms = useMemo(() => resolveCmsData(cmsData), [cmsData]);
  const tomorrow = useMemo(() => toISODate(new Date(Date.now() + 86400000)), []);

  const [draft, setDraft] = useState<BookingDraft>(() => ({
    name: initialName || "",
    phone: "",
    email: "",
    notify: "zalo",
    serviceId: services[0]?.id || "sv1",
    staffId: "",
    branchId: branches[0]?.id || "b1",
    date: tomorrow,
    note: "",
  }));

  // sync name when user login demo
  useEffect(() => {
    if (initialName) setDraft((d) => ({ ...d, name: initialName }));
  }, [initialName]);

  // external reset
  useEffect(() => {
    setDraft({
      name: initialName || "",
      phone: "",
      email: "",
      notify: "zalo",
      serviceId: services[0]?.id || "sv1",
      staffId: "",
      branchId: branches[0]?.id || "b1",
      date: tomorrow,
      note: "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onResetSignal]);

  const svc = useMemo(() => services.find((s) => s.id === draft.serviceId), [services, draft.serviceId]);
  const staffPick = useMemo(() => staff.find((s) => s.id === draft.staffId), [staff, draft.staffId]);
  const branchPick = useMemo(() => branches.find((b) => b.id === draft.branchId), [branches, draft.branchId]);

  const update = <K extends keyof BookingDraft>(k: K, v: BookingDraft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const create = () => {
    const name = draft.name.trim();
    const phone = draft.phone.trim();
    const date = draft.date;

    if (!name) return onToast(cms.validationToasts[0], cms.validationToasts[1]);
    if (!isValidPhone(phone)) return onToast(cms.validationToasts[2], cms.validationToasts[3]);
    if (!date) return onToast(cms.validationToasts[4], cms.validationToasts[5]);
    if (!selectedSlot) return onToast(cms.validationToasts[6], cms.validationToasts[7]);

    const booking: Booking = {
      id: uid("BK"),
      createdAt: new Date().toISOString(),
      name,
      phone,
      email: draft.email.trim(),
      notify: draft.notify,
      serviceId: svc?.id,
      serviceName: svc?.name,
      duration: svc?.duration,
      price: svc?.price,
      staffId: staffPick?.id || null,
      staffName: staffPick?.name || "Hệ thống phân bổ",
      branchId: branchPick?.id,
      branchName: branchPick?.name,
      date,
      time: selectedSlot,
      note: draft.note.trim(),
      status: "confirmed",
    };

    onCreate(booking);
    onToast(
        cms.successToast[0],
        formatTemplate(cms.successToast[1], { id: booking.id, date: booking.date, time: booking.time })
    );
  };

  return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-extrabold text-slate-500">{cms.headerEyebrow}</div>
            <div className="text-2xl font-extrabold">{cms.headerTitle}</div>
            <div className="mt-1 text-sm text-slate-600">{cms.headerDescription}</div>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-extrabold">
          <i className="fa-solid fa-lock"></i> {cms.securityBadge}
        </span>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-extrabold text-slate-700">{cms.fields.fullName.label}</label>
            <input
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:ring-4 focus:ring-indigo-100"
                placeholder={cms.fields.fullName.placeholder}
                value={draft.name}
                onChange={(e) => update("name", e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-extrabold text-slate-700">{cms.fields.phone.label}</label>
            <input
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:ring-4 focus:ring-indigo-100"
                placeholder={cms.fields.phone.placeholder}
                value={draft.phone}
                onChange={(e) => update("phone", e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-extrabold text-slate-700">{cms.fields.email.label}</label>
            <input
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:ring-4 focus:ring-indigo-100"
                placeholder={cms.fields.email.placeholder}
                value={draft.email}
                onChange={(e) => update("email", e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-extrabold text-slate-700">{cms.fields.notify.label}</label>
            <select
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-4 focus:ring-indigo-100"
                value={draft.notify}
                onChange={(e) => update("notify", e.target.value as any)}
            >
              <option value="zalo">{cms.notifyOptions[0]}</option>
              <option value="sms">{cms.notifyOptions[1]}</option>
              <option value="email">{cms.notifyOptions[2]}</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-extrabold text-slate-700">{cms.fields.service.label}</label>
            <select
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-4 focus:ring-indigo-100"
                value={draft.serviceId}
                onChange={(e) => update("serviceId", e.target.value)}
            >
              {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} • {s.duration} {cms.summaryTexts[3]} • {money(s.price)}
                  </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-extrabold text-slate-700">{cms.fields.staff.label}</label>
            <select
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-4 focus:ring-indigo-100"
                value={draft.staffId}
                onChange={(e) => update("staffId", e.target.value)}
            >
              <option value="">{cms.staffNoneOption}</option>
              {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} • {s.level}
                  </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-extrabold text-slate-700">{cms.fields.branch.label}</label>
            <select
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-4 focus:ring-indigo-100"
                value={draft.branchId}
                onChange={(e) => update("branchId", e.target.value)}
            >
              {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-extrabold text-slate-700">{cms.fields.date.label}</label>
            <input
                type="date"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:ring-4 focus:ring-indigo-100"
                value={draft.date}
                onChange={(e) => update("date", e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-extrabold text-slate-700">{cms.fields.note.label}</label>
            <textarea
                rows={3}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:ring-4 focus:ring-indigo-100"
                placeholder={cms.fields.note.placeholder}
                value={draft.note}
                onChange={(e) => update("note", e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-slate-700">
              {cms.summaryTexts[0]} <b>{selectedSlot || cms.summaryTexts[1]}</b>
              <span className="text-slate-500"> • {cms.summaryTexts[2]} </span>
              <b>{svc ? `${svc.duration} ${cms.summaryTexts[3]}` : "—"}</b>
            </div>

            <div className="flex gap-2">
              <button
                  type="button"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold hover:bg-slate-50"
                  onClick={() => onToast(cms.resetToast[0], cms.resetToast[1])}
              >
                {cms.buttons[0]}
              </button>

              <button
                  type="button"
                  className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 px-4 py-3 text-sm font-extrabold text-white ring-1 ring-indigo-200 hover:opacity-95"
                  onClick={create}
              >
                {cms.buttons[1]}
              </button>
            </div>
          </div>

          <div className="mt-2 text-sm text-slate-600">
            {cms.summaryTexts[4]} <b>{svc ? money(svc.price) : "—"}</b>{" "}
            <span className="text-slate-500">• {cms.summaryTexts[5]}</span>
          </div>
        </div>
      </div>
  );
}

export const BOOKING_FORM_DEFAULT_CMS_DATA: BookingFormCmsData = DEFAULT_CMS_DATA;
