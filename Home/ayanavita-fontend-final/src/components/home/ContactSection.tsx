// src/components/home/ContactSection.tsx
import React, { useState } from "react";

export type ContactLead = {
  name: string;
  phone: string;
  email: string;
  need: string;
  note: string;
};

/**
 * Dữ liệu nội dung từ CMS – chỉ chứa text, mảng, không chứa style hay kích thước.
 * Tất cả các trường đều là optional, nếu không có sẽ dùng fallback mặc định.
 */
export type ContactCmsData = {
  /** Dòng địa chỉ 1 (ví dụ: tên trung tâm) */
  addressLine1?: string;
  /** Dòng địa chỉ 2 (số nhà, đường, quận) */
  addressLine2?: string;
  /** Số điện thoại hiển thị */
  phone?: string;
  /** Email hiển thị */
  email?: string;
  /** Giờ làm việc */
  businessHours?: string;
  /** Tiêu đề của khung bản đồ (ví dụ: "Bản đồ") */
  mapTitle?: string;
  /** Mô tả ngắn dưới tiêu đề bản đồ */
  mapDescription?: string;
  /** URL nhúng Google Maps (thay đổi địa điểm) */
  mapEmbedUrl?: string;
  /** Tiêu đề của phần form */
  formTitle?: string;
  /** Mô tả phụ dưới tiêu đề form */
  formDescription?: string;
  /** Placeholder cho ô Họ tên */
  namePlaceholder?: string;
  /** Placeholder cho ô Số điện thoại */
  phonePlaceholder?: string;
  /** Placeholder cho ô Email */
  emailPlaceholder?: string;
  /** Tuỳ chọn mặc định trong dropdown Nhu cầu (giá trị rỗng) */
  needDefaultOption?: string;
  /** Danh sách các lựa chọn cho dropdown "Nhu cầu" */
  needOptions?: string[];
  /** Placeholder cho ô Mô tả nhu cầu (textarea) */
  notePlaceholder?: string;
  /** Chữ trên nút gửi */
  submitButtonText?: string;
};

export type ContactSectionProps = {
  /** Bạn truyền onSubmit từ HomePage -> component sẽ gọi khi submit */
  onSubmit?: (lead: ContactLead) => void | Promise<void>;
  /** Dữ liệu nội dung từ CMS (nếu có) */
  cmsData?: ContactCmsData;
};

export const ContactSection: React.FC<ContactSectionProps> = ({
                                                                onSubmit,
                                                                cmsData = {},
                                                              }) => {
  const [lead, setLead] = useState<ContactLead>({
    name: "",
    phone: "",
    email: "",
    need: "",
    note: "",
  });

  // Fallback content
  const {
    addressLine1 = "AYANAVITA – Trung tâm đào tạo",
    addressLine2 = "Số 123, Đường ABC, Quận 1, TP.HCM",
    phone = "(028) 1234 5678",
    email = "support@ayanavita.vn",
    businessHours = "8:00 – 18:00 (T2 – T7)",
    mapTitle = "Bản đồ",
    mapDescription = "Vị trí AYANAVITA",
    mapEmbedUrl = "https://www.google.com/maps?q=So%20123%20Duong%20ABC%20Quan%201%20TPHCM&output=embed",
    formTitle = "Gửi yêu cầu tư vấn",
    formDescription = "Prototype UI: sau này nối API lưu lead vào DB/CRM.",
    namePlaceholder = "Họ tên",
    phonePlaceholder = "Số điện thoại",
    emailPlaceholder = "Email",
    needDefaultOption = "Nhu cầu",
    needOptions = [
      "Triển khai LMS bán khóa học",
      "Thiết kế Landing + Catalog + Checkout",
      "Làm App Flutter",
      "Tư vấn Business / Doanh nghiệp",
    ],
    notePlaceholder = "Mô tả nhu cầu...",
    submitButtonText = "Gửi yêu cầu",
  } = cmsData;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (onSubmit) await onSubmit(lead);
      if (!onSubmit) window.alert("Đã nhận yêu cầu tư vấn (prototype). Sau này nối API lưu lead.");
    } catch (err: any) {
      window.alert(err?.message ?? "Gửi yêu cầu thất bại");
    }
  };

  return (
      <section id="contact" className="w-full pb-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl bg-white p-8 ring-1 ring-slate-200 shadow-sm">
              <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
                <div className="text-xs font-semibold text-slate-500">Địa chỉ</div>
                <div className="mt-1 font-extrabold text-slate-900">{addressLine1}</div>
                <div className="mt-1 text-sm text-slate-700">{addressLine2}</div>

                <div className="mt-4 grid gap-2 text-sm text-slate-700">
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-phone"></i>
                    <span>{phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-envelope"></i>
                    <span>{email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-business-time"></i>
                    <span>{businessHours}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="text-sm font-semibold text-slate-900">{formTitle}</div>
                <p className="mt-1 text-sm text-slate-600">{formDescription}</p>

                <form className="mt-4 grid gap-3" onSubmit={submit}>
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-indigo-100 focus:ring-4"
                        placeholder={namePlaceholder}
                        value={lead.name}
                        onChange={(e) => setLead((s) => ({ ...s, name: e.target.value }))}
                    />
                    <input
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-indigo-100 focus:ring-4"
                        placeholder={phonePlaceholder}
                        value={lead.phone}
                        onChange={(e) => setLead((s) => ({ ...s, phone: e.target.value }))}
                    />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-indigo-100 focus:ring-4"
                        placeholder={emailPlaceholder}
                        value={lead.email}
                        onChange={(e) => setLead((s) => ({ ...s, email: e.target.value }))}
                    />
                    <select
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-indigo-100 focus:ring-4"
                        value={lead.need}
                        onChange={(e) => setLead((s) => ({ ...s, need: e.target.value }))}
                    >
                      <option value="">{needDefaultOption}</option>
                      {needOptions.map((opt) => (
                          <option key={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <textarea
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-indigo-100 focus:ring-4"
                      style={{ minHeight: 120 }}
                      placeholder={notePlaceholder}
                      value={lead.note}
                      onChange={(e) => setLead((s) => ({ ...s, note: e.target.value }))}
                  />

                  <button
                      type="submit"
                      className="rounded-2xl bg-gradient-to-r from-amber-300 to-yellow-300 px-6 py-3 font-extrabold text-slate-900 shadow hover:opacity-95"
                  >
                    {submitButtonText}
                  </button>
                </form>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm">
              <div className="border-b border-slate-200 p-6">
                <div className="text-sm font-semibold text-slate-900">{mapTitle}</div>
                <div className="text-sm text-slate-600">{mapDescription}</div>
              </div>

              <div className="p-4">
                <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200">
                  <iframe
                      title="AYANAVITA Map"
                      width="100%"
                      height="420"
                      style={{ border: 0 }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      src={mapEmbedUrl}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
  );
};