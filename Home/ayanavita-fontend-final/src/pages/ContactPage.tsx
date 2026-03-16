import React, { useEffect, useMemo, useState } from "react";
import { http } from "../api/http";

type ContactLead = {
  name: string;
  phone: string;
  email: string;
  need: string;
  note: string;
};

type CmsData = {
  eyebrow?: string;
  title?: string;
  description?: string;
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

const cmsDataDefault: CmsData = {
  eyebrow: "Liên hệ AYANAVITA",
  title: "Kết nối với đội ngũ tư vấn AYANAVITA",
  description: "Đội ngũ AYANAVITA sẽ liên hệ sớm nhất để hỗ trợ bạn.",
  addressLine1: "AYANAVITA Wellness Experience",
  addressLine2: "Quận 1, TP.HCM",
  phone: "(028) 1234 5678",
  email: "hello@ayanavita.com",
  businessHours: "8:00 – 20:00 (T2 – CN)",
  mapTitle: "Không gian AYANAVITA",
  mapDescription: "Nơi bạn bắt đầu hành trình wellness cân bằng và cá nhân hóa.",
  mapEmbedUrl: "https://www.google.com/maps?q=AYANAVITA%20Wellness%20Experience%20Quan%201%20TPHCM&output=embed",
  formTitle: "Để lại thông tin để được tư vấn",
  formDescription: "Hãy để lại thông tin, nhân viên sẽ liên hệ sớm nhất.",
  namePlaceholder: "Họ và tên",
  phonePlaceholder: "Số điện thoại",
  emailPlaceholder: "Email",
  needDefaultOption: "Chọn nhu cầu của bạn",
  needOptions: ["Tư vấn wellness", "Đặt lịch trải nghiệm", "Chăm sóc cá nhân", "Hợp tác đối tác"],
  notePlaceholder: "Chia sẻ nhu cầu của bạn...",
  submitButtonText: "Nhận tư vấn",
};

const initialLead: ContactLead = { name: "", phone: "", email: "", need: "", note: "" };

export default function ContactPage() {
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => localStorage.getItem("preferred-language") || "vi");
  const [cmsDataFromApi, setCmsDataFromApi] = useState<Partial<CmsData> | null>(null);
  const [lead, setLead] = useState<ContactLead>(initialLead);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string>("");
  const [submitError, setSubmitError] = useState<string>("");

  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => setCurrentLanguage(event.detail.language);
    window.addEventListener("languageChange", handleLanguageChange as EventListener);
    return () => window.removeEventListener("languageChange", handleLanguageChange as EventListener);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchCmsContact = async () => {
      try {
        const res = await http.get(`/public/pages/contact?lang=${currentLanguage}`);
        if (!cancelled) setCmsDataFromApi(res?.data?.sections?.[0]?.data ?? null);
      } catch {
        if (!cancelled) setCmsDataFromApi(null);
      }
    };
    fetchCmsContact();
    return () => {
      cancelled = true;
    };
  }, [currentLanguage]);

  const cmsData: CmsData = useMemo(
    () => ({
      ...cmsDataDefault,
      ...(cmsDataFromApi || {}),
      needOptions: Array.isArray(cmsDataFromApi?.needOptions) ? cmsDataFromApi?.needOptions : cmsDataDefault.needOptions,
    }),
    [cmsDataFromApi],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    setSubmitMessage("");
    try {
      const { data } = await http.post("/public/contact-inquiries", lead);
      setSubmitMessage(data?.message || "Gửi liên hệ thành công. Nhân viên sẽ liên hệ sớm nhất.");
      setLead(initialLead);
    } catch (error: any) {
      setSubmitError(error?.response?.data?.message || "Không thể gửi liên hệ. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto max-w-7xl px-4 pt-8 pb-2">
        <div className="overflow-hidden rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm md:p-8">
          <p className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">{cmsData.eyebrow}</p>
          <h1 className="mt-4 text-2xl font-extrabold leading-tight md:text-4xl">{cmsData.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">{cmsData.description}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="mt-8 grid gap-8 rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)] ring-1 ring-slate-200 backdrop-blur-sm md:grid-cols-2 md:p-10">
          <div className="space-y-6">
            <div className="rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-200">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Liên hệ</div>
              <div className="mt-1 text-lg font-extrabold text-slate-900">{cmsData.addressLine1}</div>
              <div className="mt-1 text-sm text-slate-700">{cmsData.addressLine2}</div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-1">
            <div className="rounded-3xl bg-gradient-to-br from-indigo-50 to-amber-50 p-6 ring-1 ring-slate-200 md:p-8">
              <h3 className="text-xl font-bold text-slate-900">{cmsData.formTitle}</h3>
              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <input required className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3" placeholder={cmsData.namePlaceholder} value={lead.name} onChange={(e) => setLead((p) => ({ ...p, name: e.target.value }))} />
                <input required className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3" placeholder={cmsData.phonePlaceholder} value={lead.phone} onChange={(e) => setLead((p) => ({ ...p, phone: e.target.value }))} />
                <input type="email" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3" placeholder={cmsData.emailPlaceholder} value={lead.email} onChange={(e) => setLead((p) => ({ ...p, email: e.target.value }))} />
                <select className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3" value={lead.need} onChange={(e) => setLead((p) => ({ ...p, need: e.target.value }))}>
                  <option value="">{cmsData.needDefaultOption}</option>
                  {(cmsData.needOptions || []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <textarea rows={4} required className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3" placeholder={cmsData.notePlaceholder} value={lead.note} onChange={(e) => setLead((p) => ({ ...p, note: e.target.value }))} />

                {submitMessage ? <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{submitMessage}</div> : null}
                {submitError ? <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{submitError}</div> : null}

                <button disabled={submitting} type="submit" className="w-full rounded-2xl bg-gradient-to-r from-amber-300 to-yellow-300 py-3 font-extrabold text-slate-900 shadow hover:opacity-95 disabled:opacity-60">
                  {submitting ? "Đang gửi..." : cmsData.submitButtonText}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
