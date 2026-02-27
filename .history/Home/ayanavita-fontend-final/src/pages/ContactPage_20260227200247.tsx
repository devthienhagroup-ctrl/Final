import React, { useEffect, useMemo, useState } from "react";
import { http } from "../api/http";

type CmsData = {
    hero: {
        eyebrow: string;
        title: string;
        description: string;
    };
    form: {
        fullNameLabel: string;
        fullNamePlaceholder: string;
        phoneLabel: string;
        phonePlaceholder: string;
        emailLabel: string;
        emailPlaceholder: string;
        messageLabel: string;
        messagePlaceholder: string;
        submitLabel: string;
    };
    info: {
        title: string;
        hotlineLabel: string;
        hotlineValue: string;
        emailLabel: string;
        emailValue: string;
        addressLabel: string;
        addressValue: string;
        note: string;
        mapLinkLabel: string;
        mapLinkHref: string;
    };
};

const cmsDataDefault: CmsData = {
    hero: {
        eyebrow: "Liên hệ AYANAVITA",
        title: "Kết nối với đội ngũ tư vấn trong 24 giờ",
        description:
            "Nếu bạn cần tư vấn dịch vụ spa, khoá học hoặc hợp tác nhượng quyền, hãy để lại thông tin. Đội ngũ AYANAVITA sẽ liên hệ để hỗ trợ lộ trình phù hợp nhất cho bạn.",
    },
    form: {
        fullNameLabel: "Họ và tên",
        fullNamePlaceholder: "Nhập họ và tên của bạn",
        phoneLabel: "Số điện thoại",
        phonePlaceholder: "Nhập số điện thoại",
        emailLabel: "Email",
        emailPlaceholder: "Nhập email (không bắt buộc)",
        messageLabel: "Nội dung cần tư vấn",
        messagePlaceholder: "Mô tả nhu cầu của bạn...",
        submitLabel: "Gửi thông tin",
    },
    info: {
        title: "Thông tin liên hệ",
        hotlineLabel: "Hotline",
        hotlineValue: "0900 000 000",
        emailLabel: "Email",
        emailValue: "contact@ayanavita.vn",
        addressLabel: "Địa chỉ",
        addressValue: "123 Nguyễn Huệ, Quận 1, TP.HCM",
        note: "Đội ngũ tư vấn sẽ phản hồi trong vòng 24 giờ làm việc. Vui lòng đảm bảo thông tin chính xác để được hỗ trợ nhanh nhất.",
        mapLinkLabel: "Xem bản đồ",
        mapLinkHref: "https://maps.google.com",
    },
};

export default function ContactPage() {
    const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
        return localStorage.getItem("preferred-language") || "vi";
    });
    const [cmsDataFromApi, setCmsDataFromApi] = useState<Partial<CmsData> | null>(null);

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
            ...cmsDataFromApi,
            hero: {
                ...cmsDataDefault.hero,
                ...(cmsDataFromApi?.hero || {}),
            },
            form: {
                ...cmsDataDefault.form,
                ...(cmsDataFromApi?.form || {}),
            },
            info: {
                ...cmsDataDefault.info,
                ...(cmsDataFromApi?.info || {}),
            },
        };
    }, [cmsDataFromApi]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <section className="mx-auto max-w-7xl px-4 pt-8 pb-2">
                <div className="rounded-3xl bg-white p-6 ring-1 ring-slate-200 shadow-sm md:p-8">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
                        {cmsData.hero.eyebrow}
                    </p>
                    <h1 className="mt-2 text-2xl font-extrabold md:text-4xl">{cmsData.hero.title}</h1>
                    <p className="mt-3 max-w-3xl text-sm text-slate-600 md:text-base">
                        {cmsData.hero.description}
                    </p>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 pb-16">
                <div className="mt-8 grid gap-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:grid-cols-2 md:p-10">
                    <form
                        className="space-y-5"
                        onSubmit={(e) => {
                            e.preventDefault();
                            console.log("Form submitted");
                        }}
                    >
                        <div>
                            <label className="mb-1 block text-sm font-medium">{cmsData.form.fullNameLabel}</label>
                            <input
                                type="text"
                                required
                                className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                placeholder={cmsData.form.fullNamePlaceholder}
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium">{cmsData.form.phoneLabel}</label>
                            <input
                                type="tel"
                                required
                                className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                placeholder={cmsData.form.phonePlaceholder}
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium">{cmsData.form.emailLabel}</label>
                            <input
                                type="email"
                                className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                placeholder={cmsData.form.emailPlaceholder}
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium">{cmsData.form.messageLabel}</label>
                            <textarea
                                rows={4}
                                required
                                className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                placeholder={cmsData.form.messagePlaceholder}
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700"
                        >
                            {cmsData.form.submitLabel}
                        </button>
                    </form>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-bold">{cmsData.info.title}</h3>
                            <p className="mt-2 text-sm text-slate-600">
                                {cmsData.info.hotlineLabel}: {cmsData.info.hotlineValue}
                            </p>
                            <p className="text-sm text-slate-600">
                                {cmsData.info.emailLabel}: {cmsData.info.emailValue}
                            </p>
                            <p className="text-sm text-slate-600">
                                {cmsData.info.addressLabel}: {cmsData.info.addressValue}
                            </p>
                            <a
                                href={cmsData.info.mapLinkHref}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-flex text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                            >
                                {cmsData.info.mapLinkLabel}
                            </a>
                        </div>

                        <div className="rounded-2xl bg-indigo-50 p-5 text-sm text-slate-700">{cmsData.info.note}</div>
                    </div>
                </div>
            </section>
        </div>
    );
}
