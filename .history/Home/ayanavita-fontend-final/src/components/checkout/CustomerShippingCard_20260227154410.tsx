import React from "react";
import type { CustomerDraft, ShippingType } from "../../services/checkout.storage";

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
}: {
  customer: CustomerDraft;
  onChange: (next: CustomerDraft) => void;
  shipping: ShippingType;
  onShippingChange: (t: ShippingType) => void;
}) {
  const set = (k: keyof CustomerDraft) => (v: string) => onChange({ ...customer, [k]: v });

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xs font-extrabold muted">Bước 1</div>
          <div className="text-2xl font-extrabold">Thông tin giao hàng</div>
          <div className="mt-1 text-sm text-slate-700">
            Prototype: bạn sẽ nối API để tạo order + payment sau.
          </div>
        </div>
        <span className="badge">
          <i className="fa-solid fa-lock" /> SSL
        </span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-extrabold text-slate-700">Họ và tên *</label>
          <input className="field mt-2" value={customer.name} onChange={(e) => set("name")(e.target.value)} placeholder="Ví dụ: Lê Hiếu" />
        </div>
        <div>
          <label className="text-sm font-extrabold text-slate-700">Số điện thoại *</label>
          <input className="field mt-2" value={customer.phone} onChange={(e) => set("phone")(e.target.value)} placeholder="Ví dụ: 090xxxxxxx" />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-extrabold text-slate-700">Email</label>
          <input className="field mt-2" value={customer.email} onChange={(e) => set("email")(e.target.value)} placeholder="email@example.com" />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-extrabold text-slate-700">Địa chỉ *</label>
          <input className="field mt-2" value={customer.addr} onChange={(e) => set("addr")(e.target.value)} placeholder="Số nhà, đường, phường/xã..." />
        </div>

        <div>
          <label className="text-sm font-extrabold text-slate-700">Tỉnh/TP *</label>
          <select className="field mt-2" value={customer.city} onChange={(e) => set("city")(e.target.value)}>
            <option value="">Chọn Tỉnh/TP</option>
            <option>TP. Hồ Chí Minh</option>
            <option>Hà Nội</option>
            <option>Đà Nẵng</option>
            <option>Cần Thơ</option>
            <option>Hải Phòng</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-extrabold text-slate-700">Quận/Huyện *</label>
          <input className="field mt-2" value={customer.district} onChange={(e) => set("district")(e.target.value)} placeholder="Ví dụ: Quận 1" />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-extrabold text-slate-700">Ghi chú (tuỳ chọn)</label>
          <textarea className="field mt-2" rows={3} value={customer.note} onChange={(e) => set("note")(e.target.value)} placeholder="Khung giờ nhận hàng, lưu ý cho shipper..." />
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
        <div className="font-extrabold">Tuỳ chọn giao hàng</div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <RadioCard
            name="ship"
            active={shipping === "standard"}
            onClick={() => onShippingChange("standard")}
          >
            <div className="font-extrabold">Giao tiêu chuẩn</div>
            <div className="text-sm muted">
              24–48h (demo) • <b>₫ 30.000</b> (miễn phí đơn ≥ ₫ 1.000.000)
            </div>
          </RadioCard>

          <RadioCard name="ship" active={shipping === "fast"} onClick={() => onShippingChange("fast")}>
            <div className="font-extrabold">Giao nhanh</div>
            <div className="text-sm muted">
              2–4h nội thành (demo) • <b>₫ 60.000</b>
            </div>
          </RadioCard>
        </div>
      </div>
    </div>
  );
}
