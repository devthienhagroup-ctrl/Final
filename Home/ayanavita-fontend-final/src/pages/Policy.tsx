import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { http } from "../api/http";

type PolicySection = {
    title: string;
    paragraph: string;
    list: string[];
};

type PolicyMap = Record<string, PolicySection[]>;

const FALLBACK_POLICY_DATA: PolicyMap = {
    "Privacy Policy": [
        {
            title: "Information We Collect",
            paragraph:
                "We may collect personal information such as your name, email address, account details, payment-related details, and information about how you use our website.",
            list: [],
        },
        {
            title: "How We Use Your Information",
            paragraph:
                "We use your information to operate our services, process payments, improve website functionality, communicate with you, and maintain the security of our platform.",
            list: [
                "To provide access to content and user accounts",
                "To process transactions and subscriptions",
                "To send important service-related notifications",
                "To improve performance and user experience",
            ],
        },
        {
            title: "Cookies",
            paragraph:
                "We may use cookies and similar technologies to ensure essential functionality, remember preferences, and better understand how users interact with our website.",
            list: [],
        },
        {
            title: "Third-Party Services",
            paragraph:
                "Some parts of our services may rely on trusted third-party providers, including payment processors and hosting platforms. These providers may process certain data as needed to perform their services.",
            list: [],
        },
        {
            title: "Contact",
            paragraph:
                "If you have questions regarding this page or our policies, please contact us at support@ayanavita.com.",
            list: [],
        },
    ],
    Impressum: [
        {
            title: "Website Operator",
            paragraph:
                "AYANAVITA is the operator of this website and is responsible for the general administration and presentation of the platform.",
            list: [
                "Business name: AYANAVITA",
                "Email: support@ayanavita.com",
                "Website: https://ayanavita.com",
            ],
        },
    ],
    "Datenschutzerklärung": [
        {
            title: "Information We Collect",
            paragraph:
                "We may collect personal and technical information when you interact with our website and services.",
            list: [
                "Name and email address",
                "Account information",
                "Payment-related information",
                "Device, browser, and usage data",
            ],
        },
    ],
    AGB: [
        {
            title: "Acceptance of Terms",
            paragraph:
                "By accessing or using AYANAVITA, you agree to be bound by these terms and conditions.",
            list: [],
        },
    ],
    "Non-Medical Disclaimer": [
        {
            title: "No Medical Advice",
            paragraph:
                "Nothing on this website should be interpreted as medical advice, diagnosis, treatment, or a substitute for consultation with qualified healthcare professionals.",
            list: [],
        },
    ],
    "Payment & Refund Policy": [
        {
            title: "Payments",
            paragraph:
                "Payments for AYANAVITA services may be processed through approved third-party payment providers.",
            list: [
                "Secure checkout methods",
                "Third-party payment processors",
                "Valid payment details required",
            ],
        },
    ],
    "Cookie Policy": [
        {
            title: "What Are Cookies",
            paragraph:
                "Cookies are small text files stored on your device to help websites function properly and improve user experience.",
            list: [],
        },
    ],
};

const POLICY_SLUG_TO_KEY: Record<string, string> = {
    impressum: "Impressum",
    "privacy-policy": "Privacy Policy",
    datenschutzerklarung: "Datenschutzerklärung",
    agb: "AGB",
    "non-medical-disclaimer": "Non-Medical Disclaimer",
    "payment-refund-policy": "Payment & Refund Policy",
    "cookie-policy": "Cookie Policy",
};

const NAV_ITEMS = [
    { slug: "impressum", label: "Impressum" },
    { slug: "datenschutzerklarung", label: "Datenschutzerklärung" },
    { slug: "agb", label: "AGB" },
    { slug: "non-medical-disclaimer", label: "Non-Medical Disclaimer" },
    { slug: "payment-refund-policy", label: "Payment & Refund Policy" },
    { slug: "cookie-policy", label: "Cookie Policy" },
];

const DEFAULT_POLICY_KEY = "Privacy Policy";

export default function Policy() {
    const { policy } = useParams<{ policy: string }>();

    const [policyData, setPolicyData] = useState<PolicyMap | null>(null);
    const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
        return localStorage.getItem("preferred-language") || "vi";
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
        const fetchGlobal = async () => {
            try {
                const res = await http.get(`/public/pages/policies?lang=${currentLanguage}`);
                setPolicyData(res.data?.sections?.[0]?.data || null);
                console.log(res.data?.sections?.[0]?.data || null);
            } catch (error) {
                console.error("Lỗi gọi API global:", error);
                setPolicyData(null);
            }
        };

        fetchGlobal();
    }, [currentLanguage]);

    const mergedPolicyData = useMemo<PolicyMap>(() => {
        return policyData && typeof policyData === "object"
            ? { ...FALLBACK_POLICY_DATA, ...policyData }
            : FALLBACK_POLICY_DATA;
    }, [policyData]);

    const currentPolicyKey = useMemo(() => {
        const mappedKey = policy ? POLICY_SLUG_TO_KEY[policy] : undefined;
        if (mappedKey && mergedPolicyData[mappedKey]) return mappedKey;
        if (mergedPolicyData[DEFAULT_POLICY_KEY]) return DEFAULT_POLICY_KEY;
        return Object.keys(mergedPolicyData)[0] || DEFAULT_POLICY_KEY;
    }, [policy, mergedPolicyData]);

    const sections = mergedPolicyData[currentPolicyKey] || [];

    const pageSubtitle =
        currentLanguage === "de"
            ? "Diese Seite enthält wichtige rechtliche Informationen und Richtlinien von AYANAVITA."
            : currentLanguage === "vi"
                ? "Trang này trình bày các thông tin pháp lý và chính sách quan trọng của AYANAVITA."
                : "This page contains important legal information and policies of AYANAVITA.";

    const legalBadgeLabel =
        currentLanguage === "de"
            ? "Rechtliche Informationen"
            : currentLanguage === "vi"
                ? "Thông tin pháp lý"
                : "Legal Information";

    const lastUpdatedLabel =
        currentLanguage === "de"
            ? "Zuletzt aktualisiert"
            : currentLanguage === "vi"
                ? "Cập nhật lần cuối"
                : "Last updated";

    const renderParagraphWithEmail = (paragraph: string) => {
        const email = "support@ayanavita.com";
        if (!paragraph.includes(email)) return paragraph;

        const parts = paragraph.split(email);
        return parts.map((part, index) => (
            <React.Fragment key={`${part}-${index}`}>
                {part}
                {index < parts.length - 1 ? (
                    <a
                        href={`mailto:${email}`}
                        className="font-medium text-indigo-600 transition hover:text-violet-600"
                    >
                        {email}
                    </a>
                ) : null}
            </React.Fragment>
        ));
    };

    return (
        <div className="min-h-screen overflow-x-hidden bg-white text-slate-900">
            <div className="relative z-10">
                <header className="border-b border-slate-200/70 bg-white/75 backdrop-blur-xl">
                    <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
                        <Link
                            to="/"
                            className="text-sm font-extrabold uppercase tracking-[0.24em] text-slate-950"
                        >

                        </Link>

                        <nav className="hidden flex-wrap items-center gap-5 text-sm text-slate-600 md:flex">
                            {NAV_ITEMS.map((item) => {
                                const isActive = policy === item.slug;
                                return (
                                    <Link
                                        key={item.slug}
                                        to={`/policies/${item.slug}`}
                                        className={`transition hover:text-indigo-600 ${
                                            isActive ? "font-semibold text-indigo-600" : ""
                                        }`}
                                    >
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </header>

                <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
                    <section className="mb-8 sm:mb-10">
                        <div className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 shadow-sm">
                            {legalBadgeLabel}
                        </div>

                        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                            {currentPolicyKey}
                        </h1>

                        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
                            {pageSubtitle}
                        </p>
                    </section>

                    <section className="relative overflow-hidden rounded-[28px] border border-slate-200/70 bg-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-600 via-violet-600 to-amber-400" />

                        <div className="px-5 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10">
                            <div className="mb-6 text-sm text-slate-500">
                                {lastUpdatedLabel}: March 12, 2026
                            </div>

                            <article className="max-w-none text-[15px] leading-8 text-slate-700 sm:text-base">
                                {sections.map((section, index) => (
                                    <section
                                        key={`${section.title}-${index}`}
                                        className={
                                            index === 0
                                                ? "border-t border-transparent"
                                                : "mt-8 border-t border-slate-200 pt-8"
                                        }
                                    >
                                        <h2 className="mb-4 text-2xl font-semibold tracking-tight text-slate-950">
                                            {index + 1}. {section.title}
                                        </h2>

                                        {section.paragraph ? (
                                            <p className="mb-4">{renderParagraphWithEmail(section.paragraph)}</p>
                                        ) : null}

                                        {Array.isArray(section.list) && section.list.length > 0 ? (
                                            <ul className="mb-4 list-disc space-y-2 pl-6 marker:text-indigo-500">
                                                {section.list.map((item, itemIndex) => (
                                                    <li key={`${item}-${itemIndex}`}>{item}</li>
                                                ))}
                                            </ul>
                                        ) : null}
                                    </section>
                                ))}
                            </article>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
}