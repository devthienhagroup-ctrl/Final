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
    // Hero riêng của ContactPage
    eyebrow?: string;
    title?: string;
    description?: string;

    // Đồng bộ field với ContactSection.fixed.tsx để dùng chung API
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
    description:
        "Nếu bạn cần tư vấn về trải nghiệm wellness, đặt lịch, chăm sóc cá nhân hóa hoặc cơ hội hợp tác, hãy để lại thông tin. Đội ngũ AYANAVITA sẽ liên hệ để hỗ trợ bạn lựa chọn hướng đi phù hợp nhất.",

    addressLine1: "AYANAVITA Wellness Experience",
    addressLine2: "Quận 1, TP.HCM",
    phone: "(028) 1234 5678",
    email: "hello@ayanavita.com",
    businessHours: "8:00 – 20:00 (T2 – CN)",

    mapTitle: "Không gian AYANAVITA",
    mapDescription: "Nơi bạn bắt đầu hành trình wellness cân bằng và cá nhân hóa.",
    mapEmbedUrl:
        "https://www.google.com/maps?q=AYANAVITA%20Wellness%20Experience%20Quan%201%20TPHCM&output=embed",

    formTitle: "Để lại thông tin để được tư vấn",
    formDescription:
        "Nếu bạn vẫn đang phân vân gói trải nghiệm nào phù hợp, hãy để lại thông tin bên dưới để đội ngũ AYANAVITA tư vấn chi tiết cho bạn.",
    namePlaceholder: "Họ và tên",
    phonePlaceholder: "Số điện thoại",
    emailPlaceholder: "Email",
    needDefaultOption: "Chọn nhu cầu của bạn",
    needOptions: [
        "Tư vấn wellness",
        "Đặt lịch trải nghiệm",
        "Chăm sóc cá nhân",
        "Hợp tác đối tác",
    ],
    notePlaceholder: "Chia sẻ nhu cầu của bạn...",
    submitButtonText: "Nhận tư vấn",
};

export default function ContactPage() {
    const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
        return localStorage.getItem("preferred-language") || "vi";
    });

    const [cmsDataFromApi, setCmsDataFromApi] = useState<Partial<CmsData> | null>(null);
    const [lead, setLead] = useState<ContactLead>({
        name: "",
        phone: "",
        email: "",
        need: "",
        note: "",
    });

    useEffect(() => {
        const handleLanguageChange = (event: CustomEvent) => {
            setCurrentLanguage(event.detail.language);
        };

        window.addEventListener("languageChange", handleLanguageChange as EventListener);
        return () => {
            window.removeEventListener("languageChange", handleLanguageChange as EventListener);
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        const fetchCmsContact = async () => {
            try {
                const res = await http.get(`/public/pages/contact?lang=${currentLanguage}`);
                if (!cancelled) {
                    const sectionData = res?.data?.sections?.[0]?.data ?? null;
                    setCmsDataFromApi(sectionData);
                }
            } catch {
                if (!cancelled) setCmsDataFromApi(null);
            }
        };

        fetchCmsContact();

        return () => {
            cancelled = true;
        };
    }, [currentLanguage]);

    const cmsData: CmsData = useMemo(() => {
        return {
            ...cmsDataDefault,
            ...(cmsDataFromApi || {}),
            needOptions:
                cmsDataFromApi?.needOptions && Array.isArray(cmsDataFromApi.needOptions)
                    ? cmsDataFromApi.needOptions
                    : cmsDataDefault.needOptions,
        };
    }, [cmsDataFromApi]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Form submitted", lead);
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <section className="mx-auto max-w-7xl px-4 pt-8 pb-2">
                <div className="overflow-hidden rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm md:p-8">
                    <p className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">
                        {cmsData.eyebrow}
                    </p>
                    <h1 className="mt-4 text-2xl font-extrabold leading-tight md:text-4xl">
                        {cmsData.title}
                    </h1>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
                        {cmsData.description}
                    </p>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 pb-16">
                <div className="mt-8 grid gap-8 rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)] ring-1 ring-slate-200 backdrop-blur-sm md:grid-cols-2 md:p-10">
                    <div className="space-y-6">
                        <div className="rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-200">
                            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                Liên hệ
                            </div>
                            <h3 className="mt-1 text-lg font-bold text-slate-900">
                                {cmsData.addressLine1}
                            </h3>
                            <p className="mt-1 text-sm text-slate-700">{cmsData.addressLine2}</p>

                            <div className="mt-4 grid gap-3 text-sm text-slate-700">
                                <div className="flex items-center gap-2">
                                    <i className="fa-solid fa-phone text-slate-500" />
                                    <span>{cmsData.phone}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <i className="fa-solid fa-envelope text-slate-500" />
                                    <span>{cmsData.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <i className="fa-solid fa-business-time text-slate-500" />
                                    <span>{cmsData.businessHours}</span>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200">
                            <div className="border-b border-slate-200 p-6">
                                <h3 className="text-lg font-bold text-slate-900">{cmsData.mapTitle}</h3>
                                <p className="mt-1 text-sm text-slate-600">{cmsData.mapDescription}</p>
                            </div>

                            <div className="p-4">
                                <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200">
                                    <iframe
                                        title="AYANAVITA Map"
                                        width="100%"
                                        height="380"
                                        style={{ border: 0 }}
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                        src={cmsData.mapEmbedUrl}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl bg-white p-1">
                        <div className="rounded-3xl bg-gradient-to-br from-indigo-50 to-amber-50 p-6 ring-1 ring-slate-200 md:p-8">
                            <h3 className="text-xl font-bold text-slate-900">{cmsData.formTitle}</h3>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                {cmsData.formDescription}
                            </p>

                            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <input
                                        type="text"
                                        required
                                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-indigo-100 transition focus:ring-4"
                                        placeholder={cmsData.namePlaceholder}
                                        value={lead.name}
                                        onChange={(e) =>
                                            setLead((prev) => ({ ...prev, name: e.target.value }))
                                        }
                                    />

                                    <input
                                        type="tel"
                                        required
                                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-indigo-100 transition focus:ring-4"
                                        placeholder={cmsData.phonePlaceholder}
                                        value={lead.phone}
                                        onChange={(e) =>
                                            setLead((prev) => ({ ...prev, phone: e.target.value }))
                                        }
                                    />
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <input
                                        type="email"
                                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-indigo-100 transition focus:ring-4"
                                        placeholder={cmsData.emailPlaceholder}
                                        value={lead.email}
                                        onChange={(e) =>
                                            setLead((prev) => ({ ...prev, email: e.target.value }))
                                        }
                                    />

                                    <div className="relative w-full overflow-hidden rounded-2xl">
                                        <select
                                            className="block w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 outline-none ring-indigo-100 transition focus:ring-4"
                                            value={lead.need}
                                            onChange={(e) =>
                                                setLead((prev) => ({ ...prev, need: e.target.value }))
                                            }
                                        >
                                            <option value="">{cmsData.needDefaultOption}</option>
                                            {(cmsData.needOptions || []).map((opt) => (
                                                <option key={opt} value={opt}>
                                                    {opt}
                                                </option>
                                            ))}
                                        </select>
                                        <i className="fa-solid fa-chevron-down pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                                    </div>
                                </div>

                                <textarea
                                    rows={5}
                                    required
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-indigo-100 transition focus:ring-4"
                                    placeholder={cmsData.notePlaceholder}
                                    value={lead.note}
                                    onChange={(e) =>
                                        setLead((prev) => ({ ...prev, note: e.target.value }))
                                    }
                                />

                                <button
                                    type="submit"
                                    className="w-full rounded-2xl bg-gradient-to-r from-amber-300 to-yellow-300 py-3 font-extrabold text-slate-900 shadow hover:opacity-95"
                                >
                                    {cmsData.submitButtonText}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}