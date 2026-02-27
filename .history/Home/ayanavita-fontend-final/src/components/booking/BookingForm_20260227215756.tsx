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

export type BookingFormCmsField = {
  label: string;
  placeholder?: string;
};

export type BookingFormCmsData = {
  headerEyebrow: string;
  headerTitle: string;
  headerDescription: string;
  securityBadge: string;
  errorMesssage: string;
  fields: {
    fullName: BookingFormCmsField;
    phone: BookingFormCmsField;
    email: BookingFormCmsField;
    service: BookingFormCmsField;
    branch: BookingFormCmsField;
    date: BookingFormCmsField;
    note: BookingFormCmsField;
  };

  summary: {
    selectedSlotText: string;
    notSelectedText: string;
    durationText: string;
    priceText: string;
    priceNote: string;
  };

  buttons: {
    create: string;
  };

  validationToasts: {
    missingName: string;
    invalidPhone: string;
    missingDate: string;
    missingService: string;
    missingBranch: string;
    missingTime: string;
  };

  successToast: {
    title: string;
    description: string; // supports {{id}} {{date}} {{time}}
  };
};

const DEFAULT_CMS_DATA: BookingFormCmsData = {
  errorMesssage: "Lỗi",
  headerEyebrow: "Form đặt lịch",
  headerTitle: "Thông tin & lựa chọn",
  headerDescription: "Bạn có thể đặt cho bản thân hoặc người thân.",
  securityBadge: "Bảo mật",

  fields: {
    fullName: { label: "Họ và tên *", placeholder: "Ví dụ: Lê Hiếu" },
    phone: { label: "Số điện thoại *", placeholder: "09xx xxx xxx" },
    email: { label: "Email (tuỳ chọn)", placeholder: "email@example.com" },
    service: { label: "Dịch vụ *" },
    branch: { label: "Chi nhánh *" },
    date: { label: "Ngày *" },
    note: { label: "Ghi chú", placeholder: "Tình trạng da, nhu cầu…" },
  },

  summary: {
    selectedSlotText: "Khung giờ đã chọn:",
    notSelectedText: "Chưa chọn",
    durationText: "Dự kiến:",
    priceText: "Giá tham khảo:",
    priceNote: "Có thể thay đổi theo tình trạng/ liệu trình.",
  },

  buttons: {
    create: "➕ Tạo lịch hẹn",
  },

  validationToasts: {
    missingName: "Vui lòng nhập họ và tên.",
    invalidPhone: "Số điện thoại phải bắt đầu bằng 0 và đủ 10–11 số.",
    missingDate: "Vui lòng chọn ngày.",
    missingService: "Vui lòng chọn dịch vụ.",
    missingBranch: "Vui lòng chọn chi nhánh.",
    missingTime: "Vui lòng chọn khung giờ hoặc nhập giờ tùy chọn.",
  },

  successToast: {
    title: "Tạo lịch hẹn thành công",
    description: "Mã: {{id}} • {{date}} {{time}}",
  },
};

const resolveCmsData = (cmsData?: Partial<BookingFormCmsData>): BookingFormCmsData => ({
  ...DEFAULT_CMS_DATA,
  ...(cmsData ?? {}),
});

const formatTemplate = (tpl: string, vars: Record<string, string>) =>
  tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");

export function BookingForm(props: any) {
  const {
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
  } = props;

  const data = resolveCmsData(cmsData);

  const tomorrow = useMemo(() => toISODate(new Date(Date.now() + 86400000)), []);
  const [draft, setDraft] = useState<BookingDraft>({
    name: initialName || "",
    phone: "",
    email: "",
    date: tomorrow,
    note: "",
  });

  useEffect(() => {
    setDraft({
      name: initialName || "",
      phone: "",
      email: "",
      date: tomorrow,
      note: "",
    });
    onDateChange(tomorrow);
  }, [onResetSignal]);

  const svc = services.find((s: any) => s.id === selectedServiceId);
  const branchPick = branches.find((b: any) => b.id === selectedBranchId);

  const update = (k: keyof BookingDraft, v: string) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const create = () => {
    if (!draft.name.trim()) return onToast(data.errorMesssage, data.validationToasts.missingName);
    if (!isValidPhone(draft.phone.trim())) return onToast(data.errorMesssage, data.validationToasts.invalidPhone);
    if (!draft.date) return onToast(data.errorMesssage, data.validationToasts.missingDate);
    if (!svc) return onToast("Lỗi", data.validationToasts.missingService);
    if (!branchPick) return onToast("Lỗi", data.validationToasts.missingBranch);
    if (!selectedSlot) return onToast("Lỗi", data.validationToasts.missingTime);

    const booking: Booking = {
      id: uid("BK"),
      createdAt: new Date().toISOString(),
      name: draft.name.trim(),
      phone: draft.phone.trim(),
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
      date: draft.date,
      time: selectedSlot,
      note: draft.note.trim(),
      status: "confirmed",
    };

    onCreate(booking);

    onToast(
      data.successToast.title,
      formatTemplate(data.successToast.description, {
        id: booking.id,
        date: booking.date,
        time: booking.time,
      })
    );
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <div className="text-xs font-extrabold text-slate-500">{data.headerEyebrow}</div>
        <div className="text-2xl font-extrabold">{data.headerTitle}</div>
        <div className="mt-1 text-sm text-slate-600">{data.headerDescription}</div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-extrabold">{data.fields.fullName.label}</label>
          <input className="mt-2 w-full rounded-2xl border px-4 py-3"
                 placeholder={data.fields.fullName.placeholder}
                 value={draft.name}
                 onChange={(e) => update("name", e.target.value)} />
        </div>

        <div>
          <label className="text-sm font-extrabold">{data.fields.phone.label}</label>
          <input className="mt-2 w-full rounded-2xl border px-4 py-3"
                 placeholder={data.fields.phone.placeholder}
                 value={draft.phone}
                 onChange={(e) => update("phone", e.target.value)} />
        </div>

        <div>
          <label className="text-sm font-extrabold">{data.fields.email.label}</label>
          <input className="mt-2 w-full rounded-2xl border px-4 py-3"
                 placeholder={data.fields.email.placeholder}
                 value={draft.email}
                 onChange={(e) => update("email", e.target.value)} />
        </div>

        <div>
          <label className="text-sm font-extrabold">{data.fields.service.label}</label>
          <select className="mt-2 w-full rounded-2xl border px-4 py-3"
                  value={selectedServiceId}
                  onChange={(e) => onServiceChange(e.target.value)}>
            {services.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.name} • {s.duration} phút • {money(s.price)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-extrabold">{data.fields.branch.label}</label>
          <select className="mt-2 w-full rounded-2xl border px-4 py-3"
                  value={selectedBranchId}
                  onChange={(e) => onBranchChange(e.target.value)}>
            {branches.map((b: any) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-extrabold">{data.fields.date.label}</label>
          <input type="date"
                 className="mt-2 w-full rounded-2xl border px-4 py-3"
                 value={draft.date}
                 onChange={(e) => {
                   update("date", e.target.value);
                   onDateChange(e.target.value);
                 }} />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-extrabold">{data.fields.note.label}</label>
          <textarea rows={3}
                    className="mt-2 w-full rounded-2xl border px-4 py-3"
                    placeholder={data.fields.note.placeholder}
                    value={draft.note}
                    onChange={(e) => update("note", e.target.value)} />
        </div>
      </div>

      <div className="mt-4 rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
        <div className="text-sm">
          {data.summary.selectedSlotText}{" "}
          <b>{selectedSlot || data.summary.notSelectedText}</b>
          <span className="text-slate-500"> • {data.summary.durationText} </span>
          <b>{svc ? `${svc.duration} phút` : "—"}</b>
        </div>

        <div className="mt-3">
          <button type="button"
                  className="rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-extrabold text-white"
                  onClick={create}>
            {data.buttons.create}
          </button>
        </div>

        <div className="mt-2 text-sm text-slate-600">
          {data.summary.priceText}{" "}
          <b>{svc ? money(svc.price) : "—"}</b>{" "}
          <span className="text-slate-500">• {data.summary.priceNote}</span>
        </div>
      </div>
    </div>
  );
}