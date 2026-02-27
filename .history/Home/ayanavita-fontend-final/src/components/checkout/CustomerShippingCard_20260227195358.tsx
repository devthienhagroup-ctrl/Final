import React from "react";
import type { CustomerDraft, ShippingType } from "../../services/checkout.storage";

// Định nghĩa kiểu cho dữ liệu CMS (chỉ chứa nội dung văn bản)
export interface CustomerShippingCmsData {
  stepLabel: string;
  title: string;
  prototypeNote: string;
  sslText: string;
  nameLabel: string;
  namePlaceholder: string;
  phoneLabel: string;
  phonePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  addressLabel: string;
  addressPlaceholder: string;
  cityLabel: string;
  cityPlaceholder: string;
  districtLabel: string;
  districtPlaceholder: string;
  noteLabel: string;
  notePlaceholder: string;
  shippingTitle: string;
  standardTitle: string;
  standardDescription: string;
  fastTitle: string;
  fastDescription: string;
}

// Nội dung mẫu (giống hardcoded hiện tại)
const defaultCmsData: CustomerShippingCmsData = {
  stepLabel: "Bước 1",
  title: "Thông tin giao hàng",
  prototypeNote: "Prototype: bạn sẽ nối API để tạo order + payment sau.",
  sslText: "SSL",
  nameLabel: "Họ và tên *",
  namePlaceholder: "Ví dụ: Lê Hiếu",
  phoneLabel: "Số điện thoại *",
  phonePlaceholder: "Ví dụ: 090xxxxxxx",
  emailLabel: "Email",
  emailPlaceholder: "email@example.com",
  addressLabel: "Địa chỉ *",
  addressPlaceholder: "Số nhà, đường, phường/xã...",
  cityLabel: "Tỉnh/TP *",
  cityPlaceholder: "Chọn Tỉnh/TP",
  districtLabel: "Quận/Huyện *",
  districtPlaceholder: "Ví dụ: Quận 1",
  noteLabel: "Ghi chú (tuỳ chọn)",
  notePlaceholder: "Khung giờ nhận hàng, lưu ý cho shipper...",
  shippingTitle: "Tuỳ chọn giao hàng",
  standardTitle: "Giao tiêu chuẩn",
  standardDescription: "24–48h (demo) • ₫ 30.000 (miễn phí đơn ≥ ₫ 1.000.000)",
  fastTitle: "Giao nhanh",
  fastDescription: "2–4h nội thành (demo) • ₫ 60.000",
};

function RadioCard({
                     active,
                     onClick,
                     children,
                     name,
                   }: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  name: string;
}) {
  return (
      <label className={`radio ${active ? "active" : ""}`} onClick={onClick}>
        <input type="radio" name={name} checked={active} readOnly className="mt-1" />
        <div className="w-full">{children}</div>
      </label>
  );
}

export function CustomerShippingCard({
                                       customer,
                                       onChange,
                                       shipping,
                                       onShippingChange,
                                       cmsData,
                                     }: {
  customer: CustomerDraft;
  onChange: (next: CustomerDraft) => void;
  shipping: ShippingType;
  onShippingChange: (t: ShippingType) => void;
  cmsData?: CustomerShippingCmsData; // Props mới
}) {
  // Sử dụng dữ liệu từ CMS nếu có, nếu không thì dùng mẫu
  const content = { ...defaultCmsData, ...cmsData };

  const set = (k: keyof CustomerDraft) => (v: string) => onChange({ ...customer, [k]: v });

  return (
      <div className="card p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-xs font-extrabold muted">{content.stepLabel}</div>
            <div className="text-2xl font-extrabold">{content.title}</div>
            <div className="mt-1 text-sm text-slate-700">{content.prototypeNote}</div>
          </div>
          <span className="badge">
          <i className="fa-solid fa-lock" /> {content.sslText}
        </span>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-extrabold text-slate-700">{content.nameLabel}</label>
            <input
                className="field mt-2"
                value={customer.name}
                onChange={(e) => set("name")(e.target.value)}
                placeholder={content.namePlaceholder}
            />
          </div>
          <div>
            <label className="text-sm font-extrabold text-slate-700">{content.phoneLabel}</label>
            <input
                className="field mt-2"
                value={customer.phone}
                onChange={(e) => set("phone")(e.target.value)}
                placeholder={content.phonePlaceholder}
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-extrabold text-slate-700">{content.emailLabel}</label>
            <input
                className="field mt-2"
                value={customer.email}
                onChange={(e) => set("email")(e.target.value)}
                placeholder={content.emailPlaceholder}
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-extrabold text-slate-700">{content.addressLabel}</label>
            <input
                className="field mt-2"
                value={customer.addr}
                onChange={(e) => set("addr")(e.target.value)}
                placeholder={content.addressPlaceholder}
            />
          </div>

          <div>
            <label className="text-sm font-extrabold text-slate-700">{content.cityLabel}</label>
            <select
                className="field mt-2"
                value={customer.city}
                onChange={(e) => set("city")(e.target.value)}
            >
              <option value="">{content.cityPlaceholder}</option>
              <option>TP. Hồ Chí Minh</option>
              <option>Hà Nội</option>
              <option>Đà Nẵng</option>
              <option>Cần Thơ</option>
              <option>Hải Phòng</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-extrabold text-slate-700">{content.districtLabel}</label>
            <input
                className="field mt-2"
                value={customer.district}
                onChange={(e) => set("district")(e.target.value)}
                placeholder={content.districtPlaceholder}
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-extrabold text-slate-700">{content.noteLabel}</label>
            <textarea
                className="field mt-2"
                rows={3}
                value={customer.note}
                onChange={(e) => set("note")(e.target.value)}
                placeholder={content.notePlaceholder}
            />
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
          <div className="font-extrabold">{content.shippingTitle}</div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <RadioCard
                name="ship"
                active={shipping === "standard"}
                onClick={() => onShippingChange("standard")}
            >
              <div className="font-extrabold">{content.standardTitle}</div>
              <div className="text-sm muted">{content.standardDescription}</div>
            </RadioCard>

            <RadioCard
                name="ship"
                active={shipping === "fast"}
                onClick={() => onShippingChange("fast")}
            >
              <div className="font-extrabold">{content.fastTitle}</div>
              <div className="text-sm muted">{content.fastDescription}</div>
            </RadioCard>
          </div>
        </div>
      </div>
  );
}