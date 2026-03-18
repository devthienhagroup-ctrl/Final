import React, { useState } from "react";
import { http } from "../../api/http";

export type ContactLead = {
  name: string;
  phone: string;
  email: string;
  need: string;
  note: string;
};

export type ContactCmsData = {
  addressLine1?: string;
  addressLine2?: string;
  phone?: string;
  email?: string;
  businessHours?: string;
  mapTitle?: string;
  mapDescription?: string;
  mapEmbedUrl?: string;
  formTitle?: string;
  formDescription?: string;
  namePlaceholder?: string;
  phonePlaceholder?: string;
  emailPlaceholder?: string;
  needDefaultOption?: string;
  needOptions?: string[];
  notePlaceholder?: string;
  submitButtonText?: string;
};

export type ContactSectionProps = {
  onSubmit?: (lead: ContactLead) => void | Promise<void>;
  cmsData?: ContactCmsData;
};

const initialLead: ContactLead = { name: "", phone: "", email: "", need: "", note: "" };

export const ContactSection: React.FC<ContactSectionProps> = ({ onSubmit, cmsData = {} }) => {
  const [lead, setLead] = useState<ContactLead>(initialLead);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const {
    addressLine1 = "AYANAVITA Wellness Experience",
    addressLine2 = "Không gian trải nghiệm và tư vấn wellness cá nhân hóa",
    phone = "(028) 1234 5678",
    email = "hello@ayanavita.com",
    businessHours = "8:00 – 20:00 (T2 – CN)",
    mapTitle = "Không gian AYANAVITA",
    mapDescription = "Nơi bạn bắt đầu hành trình wellness cân bằng và cá nhân hóa.",
    mapEmbedUrl = "https://www.google.com/maps?q=So%20123%20Duong%20ABC%20Quan%201%20TPHCM&output=embed",
    formTitle = "Để lại thông tin để được tư vấn",
    formDescription = "Hãy để lại thông tin để đội ngũ AYANAVITA liên hệ sớm nhất.",
    namePlaceholder = "Họ và tên",
    phonePlaceholder = "Số điện thoại",
    emailPlaceholder = "Email",
    needDefaultOption = "Chọn nhu cầu của bạn",
    needOptions = ["Tư vấn wellness", "Đặt lịch trải nghiệm", "Chăm sóc cá nhân", "Hợp tác đối tác"],
    notePlaceholder = "Chia sẻ nhu cầu của bạn...",
    submitButtonText = "Nhận tư vấn",
  } = cmsData;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(lead);
        setMessage("Gửi liên hệ thành công. Nhân viên sẽ liên hệ sớm nhất cho quý khách.");
      } else {
        const { data } = await http.post("/public/contact-inquiries", lead);
        setMessage(data?.message || "Gửi liên hệ thành công. Nhân viên sẽ liên hệ sớm nhất cho quý khách.");
      }
      setLead(initialLead);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Không thể gửi liên hệ. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="w-full pb-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl bg-white p-8 ring-1 ring-slate-200 shadow-sm">
            <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
              <div className="text-xs font-semibold text-slate-500">Liên hệ</div>
              <div className="mt-1 font-extrabold text-slate-900">{addressLine1}</div>
              <div className="mt-1 text-sm text-slate-700">{addressLine2}</div>
              <div className="mt-4 grid gap-2 text-sm text-slate-700">
                <span>{phone}</span>
                <span>{email}</span>
                <span>{businessHours}</span>
              </div>
            </div>

            <div className="mt-6">
              <div className="text-sm font-semibold text-slate-900">{formTitle}</div>
              <p className="mt-1 text-sm leading-6 text-slate-600">{formDescription}</p>
              <form className="mt-4 grid gap-3" onSubmit={submit}>
                <input required className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3" placeholder={namePlaceholder} value={lead.name} onChange={(e) => setLead((s) => ({ ...s, name: e.target.value }))} />
                <input required className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3" placeholder={phonePlaceholder} value={lead.phone} onChange={(e) => setLead((s) => ({ ...s, phone: e.target.value }))} />
                <input type="email" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3" placeholder={emailPlaceholder} value={lead.email} onChange={(e) => setLead((s) => ({ ...s, email: e.target.value }))} />
                <select className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3" value={lead.need} onChange={(e) => setLead((s) => ({ ...s, need: e.target.value }))}>
                  <option value="">{needDefaultOption}</option>
                  {needOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <textarea className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3" style={{ minHeight: 120 }} placeholder={notePlaceholder} value={lead.note} onChange={(e) => setLead((s) => ({ ...s, note: e.target.value }))} />
                {message ? <div className="rounded-xl bg-emerald-50 p-2 text-sm text-emerald-700">{message}</div> : null}
                {error ? <div className="rounded-xl bg-rose-50 p-2 text-sm text-rose-700">{error}</div> : null}
                <button disabled={submitting} type="submit" className="rounded-2xl bg-gradient-to-r from-amber-300 to-yellow-300 px-6 py-3 font-extrabold text-slate-900 shadow hover:opacity-95 disabled:opacity-60">{submitting ? "Đang gửi..." : submitButtonText}</button>
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
                <iframe title="AYANAVITA Map" width="100%" height="420" style={{ border: 0 }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={mapEmbedUrl} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
