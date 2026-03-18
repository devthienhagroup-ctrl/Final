import React, { useEffect, useMemo, useState } from "react";
import { http } from "../api/http";

const cmsDataDefault = {
    brand: {
        short: "AYA",
        name: "AYANAVITA",
        tagline: "Partner Landing Demo",
    },
    hero: {
        badge: "Partnership Opportunities",
        title: "Partner with AYANAVITA",
        description:
            "Bring a new level of wellness experience to your spa, salon, or studio. AYANAVITA helps wellness professionals create personalized experiences that combine beauty, wellbeing, and lifestyle guidance in a way that feels modern, holistic, and meaningful.",
        primaryCta: "Apply to Become a Partner",
        secondaryCta: "Explore Partnership Models",
        tags: ["Licensed Partner", "Professional Training", "Distribution Partner"],
        mainImage:
            "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1400&q=80",
        sideImage:
            "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1000&q=80",
    },
    whyPartner: {
        badge: "Why Partner",
        title: "Why Partner with AYANAVITA?",
        description:
            "Today’s clients are looking for more than traditional beauty or spa services. They want experiences that feel thoughtful, personalized, calming, and connected to their overall wellbeing.",
        items: [
            {
                icon: "✦",
                iconClass: "bg-indigo-100 text-indigo-600",
                title: "Personalized Wellness Experience",
                description:
                    "Offer services that feel more tailored, intentional, and meaningful for each client.",
            },
            {
                icon: "❋",
                iconClass: "bg-emerald-100 text-emerald-600",
                title: "Modern Wellness Positioning",
                description:
                    "Elevate your brand with a concept that connects beauty, wellbeing, and lifestyle.",
            },
            {
                icon: "✧",
                iconClass: "bg-amber-100 text-amber-500",
                title: "Simple to Integrate",
                description:
                    "Bring the AYANAVITA concept into your service environment with guided support.",
            },
        ],
    },
    partnerValue: {
        badge: "Partner Value",
        title: "What You Receive as a Partner",
        description:
            "As an AYANAVITA partner, you receive a structured foundation to introduce a more elevated wellness experience to your clients.",
        items: [
            {
                icon: "◎",
                iconClass: "bg-indigo-100 text-indigo-600",
                title: "Brand Use",
                description:
                    "The right to use the AYANAVITA brand within the scope of the partnership model.",
            },
            {
                icon: "◌",
                iconClass: "bg-cyan-100 text-cyan-600",
                title: "Standardized Programs",
                description:
                    "Access to curated wellness concepts and structured service frameworks.",
            },
            {
                icon: "△",
                iconClass: "bg-emerald-100 text-emerald-600",
                title: "Operational Guidance",
                description:
                    "Support for onboarding, implementation, and service delivery.",
            },
            {
                icon: "✷",
                iconClass: "bg-amber-100 text-amber-500",
                title: "Service Development Support",
                description:
                    "Guidance to help you shape and expand your wellness offering with confidence.",
            },
        ],
    },
    audience: {
        badge: "Who It Is For",
        title: "Who Can Become an AYANAVITA Partner?",
        description:
            "AYANAVITA welcomes partners who want to offer more meaningful and personalized wellness experiences to their clients.",
        items: ["Spa", "Beauty Salon", "Wellness Studio", "Hotel Spa", "Health Club"],
    },
    models: {
        items: [
            {
                badge: "Licensed Partner",
                title: "Become an AYANAVITA Licensed Partner",
                description: [
                    "AYANAVITA partners with spas, salons, and wellness studios that want to bring more personalized care experiences to their clients.",
                    "Through the Licensed Partner model, partners can work with the AYANAVITA brand, concept, and wellness programs to strengthen and expand their service offering.",
                ],
                bullets: [
                    "The right to use the AYANAVITA brand",
                    "Standardized wellness programs",
                    "Service implementation guidance",
                    "Training and operational support",
                ],
                cta: "Apply to Become a Partner",
                image:
                    "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1400&q=80",
                imageLabel: "Personalized care • Premium wellness",
            },
            {
                badge: "Professional Training",
                title: "Professional Training",
                description: [
                    "AYANAVITA also offers training programs for wellness professionals and partners who want to better understand and correctly apply the methods behind the system.",
                ],
                bullets: [
                    "Understand the AYANAVITA wellness philosophy",
                    "Apply standardized care protocols",
                    "Elevate the overall client experience",
                ],
                image:
                    "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=1400&q=80",
                imageLabel: "For professionals & teams",
                reverse: true,
            },
            {
                badge: "Distribution Partner",
                title: "Distribution Partner",
                description: [
                    "AYANAVITA welcomes distribution partners who want to bring wellness products from the ecosystem to a wider audience.",
                    "Distribution partners may collaborate in the development and distribution of products such as:",
                ],
                bullets: ["Collagen", "Herbal Products", "Wellness Products"],
                image:
                    "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1400&q=80",
                imageLabel: "Herbal • Collagen • Wellness products",
            },
        ],
    },
    process: {
        badge: "Process",
        title: "How the Partnership Works",
        description:
            "Our partnership process is designed to be clear, supportive, and easy to follow.",
        items: [
            {
                step: "01",
                title: "Apply",
                description:
                    "Submit your partnership interest and tell us about your business.",
            },
            {
                step: "02",
                title: "Consultation",
                description:
                    "Receive an introduction to the AYANAVITA concept and partnership model.",
            },
            {
                step: "03",
                title: "Training & Onboarding",
                description:
                    "Get guidance, training, and a structured setup process for launch.",
            },
            {
                step: "04",
                title: "Start Offering",
                description:
                    "Bring AYANAVITA experiences to your clients with confidence and clarity.",
            },
        ],
    },
    cta: {
        badge: "Apply Now",
        title: "Start Your AYANAVITA Partnership Journey",
        description:
            "Join a growing wellness ecosystem and bring personalized wellness experiences to your clients.",
        primaryCta: "Become an AYANAVITA Partner",
        secondaryCta: "Contact Our Team",
    },
    inquiry: {
        addressLabel: "Address",
        centerName: "AYANAVITA Partner Center",
        address: "123 Wellness Avenue, District 1, Ho Chi Minh City",
        contactItems: [
            "☎ +84 28 1234 5678",
            "✉ partner@ayanavita.com",
            "🕘 8:00 – 18:00 (Mon – Sat)",
        ],
        title: "Send a Partnership Inquiry",
        description:
            "Prototype UI — later this section can connect to API and save leads into DB/CRM.",
        fields: {
            fullName: "Full name",
            phone: "Phone number",
            email: "Email",
            partnershipInterest: "Partnership interest",
            message: "Tell us more about your business or partnership goals...",
            submit: "Send Inquiry",
            options: [
                "Partnership interest",
                "Licensed Partner",
                "Professional Training",
                "Distribution Partner",
            ],
        },
    },
};

const PAGE_SLUG = "partner";
const PAGE_SLUG_FALLBACK = "Partner";

function isPlainObject(value: unknown): value is Record<string, any> {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

function deepMerge<T>(base: T, override: any): T {
    if (Array.isArray(base)) {
        return (Array.isArray(override) ? override : base) as T;
    }

    if (!isPlainObject(base) || !isPlainObject(override)) {
        return (override ?? base) as T;
    }

    const output: Record<string, any> = { ...(base as Record<string, any>) };

    Object.keys(override).forEach((key) => {
        const baseValue = (base as Record<string, any>)[key];
        const overrideValue = override[key];

        if (Array.isArray(baseValue)) {
            output[key] = Array.isArray(overrideValue) ? overrideValue : baseValue;
            return;
        }

        if (isPlainObject(baseValue) && isPlainObject(overrideValue)) {
            output[key] = deepMerge(baseValue, overrideValue);
            return;
        }

        output[key] = overrideValue ?? baseValue;
    });

    return output as T;
}

function SectionHeader({ badge, title, description }: { badge: string; title: string; description: string }) {
    return (
        <div className="max-w-3xl">
      <span className="inline-flex rounded-full bg-indigo-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
        {badge}
      </span>
            <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.03em] text-slate-950 sm:text-5xl">
                {title}
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">{description}</p>
        </div>
    );
}

function ModelCard({ item }: { item: (typeof cmsDataDefault.models.items)[number] }) {
    const content = (
        <div className="relative overflow-hidden rounded-[2rem] border border-black/5 bg-white/90 p-8 shadow-[0_12px_30px_rgba(11,18,32,0.07)] sm:p-10">
      <span className="inline-flex rounded-full bg-indigo-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
        {item.badge}
      </span>
            <h3 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.03em] text-slate-950 sm:text-5xl">
                {item.title}
            </h3>

            <div className="mt-5 space-y-4">
                {item.description.map((text) => (
                    <p key={text} className="leading-8 text-slate-600">
                        {text}
                    </p>
                ))}
            </div>

            <ul className="mt-8 space-y-4">
                {item.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3">
                        <span className="mt-1 text-emerald-500">•</span>
                        <span className="font-medium text-slate-800">{bullet}</span>
                    </li>
                ))}
            </ul>

            {item.cta ? (
                <a
                    href="#apply"
                    className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 px-6 text-sm font-semibold text-slate-900 shadow-[0_14px_34px_rgba(251,191,36,0.28)] transition hover:-translate-y-0.5"
                >
                    {item.cta}
                </a>
            ) : null}
        </div>
    );

    const image = (
        <div className="relative min-h-[460px] overflow-hidden rounded-[2rem] shadow-[0_20px_60px_rgba(11,18,32,0.08)]">
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                    backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02)), url('${item.image}')`,
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/10" />
            <div className="absolute bottom-6 left-6 rounded-full border border-white/30 bg-white/15 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md">
                {item.imageLabel}
            </div>
        </div>
    );

    return (
        <div className="grid gap-8 lg:grid-cols-2 lg:items-stretch">
            {item.reverse ? (
                <>
                    <div className="order-2 lg:order-1">{content}</div>
                    <div className="order-1 lg:order-2">{image}</div>
                </>
            ) : (
                <>
                    {image}
                    {content}
                </>
            )}
        </div>
    );
}

export default function PartnerLandingPage() {
    const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
        return localStorage.getItem("preferred-language") || "vi";
    });
    const [cmsDataFromApi, setCmsDataFromApi] = useState<Partial<typeof cmsDataDefault> | null>(null);

    useEffect(() => {
        const handleLanguageChange = (event: Event) => {
            const e = event as CustomEvent<{ language?: string }>;
            if (e?.detail?.language) {
                setCurrentLanguage(e.detail.language);
            }
        };

        window.addEventListener("languageChange", handleLanguageChange as EventListener);
        return () => window.removeEventListener("languageChange", handleLanguageChange as EventListener);
    }, []);

    useEffect(() => {
        let cancelled = false;

        const fetchCms = async () => {
            const slugCandidates = [PAGE_SLUG, PAGE_SLUG_FALLBACK];
            for (const slug of slugCandidates) {
                try {
                    const res = await http.get(`/public/pages/${slug}?lang=${currentLanguage}`);
                    if (!cancelled) {
                        setCmsDataFromApi(res?.data?.sections?.[0]?.data ?? null);
                    }
                    return;
                } catch {
                    // Try next slug candidate.
                }
            }

            if (!cancelled) {
                setCmsDataFromApi(null);
            }
        };

        void fetchCms();
        return () => {
            cancelled = true;
        };
    }, [currentLanguage]);

    const cmsData = useMemo(() => deepMerge(cmsDataDefault, cmsDataFromApi || {}), [cmsDataFromApi]);

    return (
        <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.08),transparent_25%),radial-gradient(circle_at_top_left,rgba(34,197,94,0.08),transparent_22%),linear-gradient(180deg,#fbfdfc_0%,#f7faf8_100%)] text-slate-900">
            <section className="relative overflow-hidden px-4 pb-10 pt-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="relative overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(6,182,212,0.12),transparent_24%),linear-gradient(135deg,rgba(79,70,229,0.96),rgba(124,58,237,0.92)_55%,rgba(6,182,212,0.72)_100%)] shadow-[0_20px_60px_rgba(11,18,32,0.08)] lg:rounded-[2.5rem]">
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,197,94,0.12),transparent_24%),radial-gradient(circle_at_80%_30%,rgba(245,158,11,0.10),transparent_18%),radial-gradient(circle_at_70%_80%,rgba(79,70,229,0.08),transparent_22%)]" />
                        <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                        <div className="absolute right-10 top-20 h-52 w-52 rounded-full bg-emerald-400/20 blur-3xl" />
                        <div className="absolute bottom-6 left-8 h-24 w-24 rounded-full bg-amber-400/20 blur-2xl" />

                        <div className="relative z-10 grid min-h-[720px] items-center gap-10 px-6 py-8 sm:px-8 md:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-14 lg:py-14">
                            <div className="max-w-2xl text-white">
                <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white/95">
                  {cmsData.hero.badge}
                </span>

                                <h1 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
                                    {cmsData.hero.title}
                                </h1>

                                <p className="mt-6 max-w-xl text-base leading-8 text-white/85 sm:text-lg">
                                    {cmsData.hero.description}
                                </p>

                                <div className="mt-8 flex flex-wrap gap-4">
                                    <a
                                        href="#apply"
                                        className="inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 px-6 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5"
                                    >
                                        {cmsData.hero.primaryCta}
                                    </a>
                                    <a
                                        href="#models"
                                        className="inline-flex h-12 items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/15"
                                    >
                                        {cmsData.hero.secondaryCta}
                                    </a>
                                </div>

                                <div className="mt-10 flex flex-wrap gap-3">
                                    {cmsData.hero.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white/90"
                                        >
                      {tag}
                    </span>
                                    ))}
                                </div>
                            </div>

                            <div className="relative h-[520px] sm:h-[560px] lg:h-[600px]">
                                <div className="absolute right-0 top-16 h-[74%] w-[78%] overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 p-4 shadow-[0_20px_60px_rgba(11,18,32,0.08)] backdrop-blur-md">
                                    <div
                                        className="h-full w-full rounded-[1.4rem] bg-cover bg-center"
                                        style={{
                                            backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.02)), url('${cmsData.hero.mainImage}')`,
                                        }}
                                    />
                                </div>

                                <div className="absolute left-0 top-6 h-[34%] w-[44%] overflow-hidden rounded-[1.7rem] border border-white/20 bg-white/10 p-3 shadow-[0_20px_60px_rgba(11,18,32,0.08)] backdrop-blur-md">
                                    <div
                                        className="h-full w-full rounded-[1.2rem] bg-cover bg-center"
                                        style={{
                                            backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02)), url('${cmsData.hero.sideImage}')`,
                                        }}
                                    />
                                </div>

                                <div className="absolute right-12 top-4 grid h-28 w-28 place-items-center rounded-full border border-white/20 bg-white/10 text-3xl text-white shadow-[0_20px_60px_rgba(11,18,32,0.08)] backdrop-blur-lg">
                                    ✦
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="px-4 py-16 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <SectionHeader {...cmsData.whyPartner} />

                    <div className="mt-10 grid gap-6 lg:grid-cols-3">
                        {cmsData.whyPartner.items.map((item) => (
                            <article
                                key={item.title}
                                className="rounded-[1.6rem] border border-black/5 bg-white/85 p-7 shadow-[0_12px_30px_rgba(11,18,32,0.07)] transition hover:-translate-y-1"
                            >
                                <div className={`mb-5 grid h-14 w-14 place-items-center rounded-2xl text-xl ${item.iconClass}`}>
                                    {item.icon}
                                </div>
                                <h3 className="text-2xl font-semibold text-slate-950">{item.title}</h3>
                                <p className="mt-3 leading-7 text-slate-600">{item.description}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="relative overflow-hidden bg-[linear-gradient(180deg,rgba(221,235,221,0.45),rgba(241,237,255,0.45))] px-4 py-16 sm:px-6 lg:px-8">
                <div className="absolute left-0 top-0 h-full w-full bg-[radial-gradient(circle_at_20%_20%,rgba(34,197,94,0.12),transparent_24%),radial-gradient(circle_at_80%_30%,rgba(245,158,11,0.10),transparent_18%),radial-gradient(circle_at_70%_80%,rgba(79,70,229,0.08),transparent_22%)] opacity-70" />
                <div className="relative mx-auto max-w-7xl">
                    <SectionHeader {...cmsData.partnerValue} />

                    <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                        {cmsData.partnerValue.items.map((item) => (
                            <article
                                key={item.title}
                                className="rounded-[1.5rem] border border-black/5 bg-white/90 p-6 shadow-[0_12px_30px_rgba(11,18,32,0.07)]"
                            >
                                <div className={`mb-5 grid h-12 w-12 place-items-center rounded-2xl ${item.iconClass}`}>
                                    {item.icon}
                                </div>
                                <h3 className="text-xl font-semibold text-slate-950">{item.title}</h3>
                                <p className="mt-3 leading-7 text-slate-600">{item.description}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="px-4 py-16 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <SectionHeader {...cmsData.audience} />

                    <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                        {cmsData.audience.items.map((item) => (
                            <div
                                key={item}
                                className="rounded-[1.3rem] border border-black/5 bg-white/85 px-6 py-7 text-center text-lg font-semibold text-slate-900 shadow-[0_12px_30px_rgba(11,18,32,0.07)]"
                            >
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="models" className="px-4 py-16 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl space-y-10">
                    {cmsData.models.items.map((item) => (
                        <ModelCard key={item.title} item={item} />
                    ))}
                </div>
            </section>

            <section className="relative overflow-hidden bg-[linear-gradient(180deg,rgba(221,235,221,0.45),rgba(241,237,255,0.45))] px-4 py-16 sm:px-6 lg:px-8">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,197,94,0.12),transparent_24%),radial-gradient(circle_at_80%_30%,rgba(245,158,11,0.10),transparent_18%),radial-gradient(circle_at_70%_80%,rgba(79,70,229,0.08),transparent_22%)] opacity-70" />
                <div className="relative mx-auto max-w-7xl">
                    <SectionHeader {...cmsData.process} />

                    <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                        {cmsData.process.items.map((item) => (
                            <article
                                key={item.step}
                                className="rounded-[1.5rem] border border-black/5 bg-white/90 p-6 shadow-[0_12px_30px_rgba(11,18,32,0.07)]"
                            >
                                <div className="mb-5 grid h-12 w-12 place-items-center rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-sm font-bold text-white">
                                    {item.step}
                                </div>
                                <h3 className="text-xl font-semibold text-slate-950">{item.title}</h3>
                                <p className="mt-3 leading-7 text-slate-600">{item.description}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section id="apply" className="px-4 py-16 pb-24 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="relative overflow-hidden rounded-[2.2rem] bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.16),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.16),transparent_24%),linear-gradient(135deg,rgba(11,18,32,0.98),rgba(31,41,55,0.96))] px-6 py-14 text-center shadow-[0_20px_60px_rgba(11,18,32,0.08)] sm:px-10">
                        <div className="absolute left-10 top-10 h-24 w-24 rounded-full bg-white/5 blur-2xl" />
                        <div className="absolute right-10 bottom-10 h-28 w-28 rounded-full bg-emerald-400/10 blur-3xl" />

                        <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white">
              {cmsData.cta.badge}
            </span>

                        <h2 className="mx-auto mt-6 max-w-4xl text-4xl font-semibold leading-tight tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl">
                            {cmsData.cta.title}
                        </h2>

                        <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-white/75">
                            {cmsData.cta.description}
                        </p>

                        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
                            <a
                                href="#"
                                className="inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 px-6 text-sm font-semibold text-slate-900 shadow-[0_14px_34px_rgba(251,191,36,0.28)] transition hover:-translate-y-0.5"
                            >
                                {cmsData.cta.primaryCta}
                            </a>

                            <a
                                href="#"
                                className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 bg-white/10 px-6 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/15"
                            >
                                {cmsData.cta.secondaryCta}
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            <section className="px-4 pb-24 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-5xl">
                    <div className="overflow-hidden rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-[0_12px_30px_rgba(11,18,32,0.07)] sm:p-10">
                        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
                            <div className="rounded-[1.75rem] border border-amber-300/30 bg-gradient-to-br from-amber-50 to-white p-6 shadow-[0_0_0_1px_rgba(251,191,36,0.22),0_10px_24px_rgba(251,191,36,0.16)]">
                                <div className="text-sm font-semibold text-slate-500">{cmsData.inquiry.addressLabel}</div>
                                <h3 className="mt-2 text-3xl font-semibold tracking-[-0.02em] text-slate-950">
                                    {cmsData.inquiry.centerName}
                                </h3>
                                <p className="mt-3 leading-8 text-slate-600">{cmsData.inquiry.address}</p>

                                <div className="mt-6 space-y-3 text-slate-700">
                                    {cmsData.inquiry.contactItems.map((item) => (
                                        <div key={item}>{item}</div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div className="text-3xl font-semibold tracking-[-0.02em] text-slate-950">
                                    {cmsData.inquiry.title}
                                </div>
                                <p className="mt-3 leading-7 text-slate-600">{cmsData.inquiry.description}</p>

                                <form className="mt-8 grid gap-4 sm:grid-cols-2">
                                    <input
                                        type="text"
                                        placeholder={cmsData.inquiry.fields.fullName}
                                        className="h-14 rounded-2xl border border-black/10 bg-white px-5 text-base outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-200/60"
                                    />
                                    <input
                                        type="text"
                                        placeholder={cmsData.inquiry.fields.phone}
                                        className="h-14 rounded-2xl border border-black/10 bg-white px-5 text-base outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-200/60"
                                    />
                                    <input
                                        type="email"
                                        placeholder={cmsData.inquiry.fields.email}
                                        className="h-14 rounded-2xl border border-black/10 bg-white px-5 text-base outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-200/60"
                                    />
                                    <select className="h-14 rounded-2xl border border-black/10 bg-white px-5 text-base outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-200/60">
                                        {cmsData.inquiry.fields.options.map((option) => (
                                            <option key={option}>{option}</option>
                                        ))}
                                    </select>
                                    <textarea
                                        placeholder={cmsData.inquiry.fields.message}
                                        rows={5}
                                        className="sm:col-span-2 rounded-2xl border border-black/10 bg-white px-5 py-4 text-base outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-200/60"
                                    />

                                    <button
                                        type="button"
                                        className="sm:col-span-2 inline-flex h-14 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 px-6 text-lg font-semibold text-slate-900 shadow-[0_14px_34px_rgba(251,191,36,0.28)] transition hover:-translate-y-0.5"
                                    >
                                        {cmsData.inquiry.fields.submit}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}

export { cmsDataDefault as cmsData };
