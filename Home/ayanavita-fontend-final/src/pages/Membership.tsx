// src/pages/membership/AyanavitaMembershipPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { http } from "../api/http";

type HeroChip = {
    text: string;
};

type HeroAction = {
    label: string;
    href: string;
    variant: "primary" | "secondary";
};

type HeroPreviewItem = {
    key: string;
    title: string;
    description: string;
    icon: string;
};

type HeroData = {
    badge: string;
    title: string;
    highlight: string;
    description: string;
    chips: HeroChip[];
    actions: HeroAction[];
    previewBadge: string;
    previewTitle: string;
    previewNote: string;
    previewItems: HeroPreviewItem[];
};

type BenefitItem = {
    key: string;
    label: string;
    title: string;
    description: string;
    icon: string;
    points: string[];
};

type BenefitsData = {
    badge: string;
    title: string;
    description: string;
    items: BenefitItem[];
};

type JourneyStep = {
    key: string;
    number: string;
    title: string;
    description: string;
    icon: string;
};

type JourneyData = {
    badge: string;
    title: string;
    description: string;
    steps: JourneyStep[];
    endingNote: string;
};

type CommunitySpotlight = {
    badge: string;
    title: string;
    paragraphs: string[];
    quoteLabel: string;
    quote: string;
    note: string;
};

type CommunityItem = {
    key: string;
    title: string;
    description: string;
    icon: string;
};

type CommunityData = {
    badge: string;
    title: string;
    description: string;
    spotlight: CommunitySpotlight;
    items: CommunityItem[];
};

type ClosingData = {
    title: string;
    description: string;
    primaryButtonLabel: string;
    primaryButtonHref: string;
    secondaryButtonLabel: string;
    secondaryButtonHref: string;
};

export interface MembershipPageCmsData {
    hero: HeroData;
    benefits: BenefitsData;
    journey: JourneyData;
    community: CommunityData;
    closing: ClosingData;
}

export interface MembershipPageProps {
    cmsData?: Partial<MembershipPageCmsData>;
    className?: string;
}

const PAGE_SLUG = "membership";
const PAGE_SLUG_FALLBACK = "Membership";

export const cmsDataDefault: MembershipPageCmsData = {
    hero: {
        badge: "AYANAVITA Membership",
        title: "A membership experience that stays with you longer",
        highlight: "stays with you longer",
        description:
            "Membership tại AYANAVITA được thiết kế như một lớp trải nghiệm sâu hơn dành cho những ai muốn duy trì wellness theo cách đều đặn, tinh tế và có định hướng hơn. Đây không chỉ là quyền lợi thành viên, mà là một cách để bạn được chăm sóc gắn kết hơn với cơ thể, lối sống và cộng đồng wellness xung quanh mình.",
        chips: [
            { text: "Benefits" },
            { text: "Personal Wellness Journey" },
            { text: "Member Community" },
        ],
        actions: [
            {
                label: "Explore Membership",
                href: "#membership-benefits",
                variant: "primary",
            },
            {
                label: "See Community",
                href: "#membership-community",
                variant: "secondary",
            },
        ],
        previewBadge: "Membership Overview",
        previewTitle: "Designed for continuity, connection and care",
        previewNote:
            "Một membership tốt không chỉ mang lại quyền lợi, mà còn tạo ra cảm giác được đồng hành đều đặn hơn trong hành trình wellness.",
        previewItems: [
            {
                key: "preview-benefits",
                title: "Thoughtful Benefits",
                description:
                    "Những quyền lợi được thiết kế để hỗ trợ trải nghiệm wellness lâu dài hơn.",
                icon: "fa-solid fa-gem",
            },
            {
                key: "preview-journey",
                title: "Personal Journey",
                description:
                    "Một hành trình được nuôi dưỡng theo nhịp sống và nhu cầu riêng của từng người.",
                icon: "fa-solid fa-seedling",
            },
            {
                key: "preview-community",
                title: "Member Community",
                description:
                    "Sự kết nối giúp wellness trở nên có cảm hứng và bền vững hơn mỗi ngày.",
                icon: "fa-solid fa-people-group",
            },
        ],
    },

    benefits: {
        badge: "Membership Benefits",
        title: "Quyền lợi được thiết kế để nâng trải nghiệm wellness mỗi ngày",
        description:
            "Thay vì chỉ là ưu đãi đơn lẻ, quyền lợi thành viên tại AYANAVITA được xây dựng như những lớp giá trị bổ sung giúp trải nghiệm trở nên thuận tiện hơn, cá nhân hơn và đáng duy trì hơn.",
        items: [
            {
                key: "priority-access",
                label: "01 · Priority Access",
                title: "Tiếp cận thuận tiện hơn với các trải nghiệm nổi bật",
                description:
                    "Membership mang lại sự chủ động hơn trong việc tiếp cận các trải nghiệm, chương trình mới và những dịch vụ phù hợp với nhịp chăm sóc của riêng bạn.",
                icon: "fa-solid fa-crown",
                points: [
                    "Tiếp cận sớm hơn với chương trình nổi bật",
                    "Đặt lịch chủ động và thuận tiện hơn",
                    "Dễ duy trì nhịp chăm sóc đều đặn hơn",
                ],
            },
            {
                key: "exclusive-value",
                label: "02 · Exclusive Value",
                title: "Giá trị dành riêng cho thành viên",
                description:
                    "Những quyền lợi riêng giúp hành trình wellness không chỉ dễ tiếp cận hơn, mà còn tạo cảm giác xứng đáng để duy trì lâu dài.",
                icon: "fa-solid fa-star",
                points: [
                    "Ưu đãi theo từng nhóm thành viên",
                    "Giá trị cộng thêm theo từng giai đoạn",
                    "Khuyến khích duy trì chăm sóc bền vững",
                ],
            },
            {
                key: "personal-guidance",
                label: "03 · Personal Guidance",
                title: "Sự đồng hành mang tính cá nhân hóa hơn",
                description:
                    "Membership gắn quyền lợi với định hướng phù hợp hơn cho từng cá nhân, để mỗi trải nghiệm không chỉ đẹp mà còn đúng hơn với nhu cầu thực tế.",
                icon: "fa-solid fa-heart-circle-check",
                points: [
                    "Gắn quyền lợi với hành trình thực tế",
                    "Tạo cảm giác được chăm sóc có định hướng",
                    "Hỗ trợ wellness theo cách gần gũi hơn",
                ],
            },
        ],
    },

    journey: {
        badge: "Personal Wellness Journey",
        title: "Membership được xây dựng như một hành trình tiến triển theo thời gian",
        description:
            "AYANAVITA Membership không dừng ở việc nhận quyền lợi. Nó được thiết kế như một hành trình dài hơn, nơi mỗi giai đoạn đều giúp bạn hiểu bản thân rõ hơn, chăm sóc đều hơn và kết nối sâu hơn với một lối sống wellness phù hợp.",
        steps: [
            {
                key: "join",
                number: "01",
                title: "Join",
                description:
                    "Bắt đầu với một lựa chọn rõ ràng hơn cho hành trình chăm sóc bản thân lâu dài.",
                icon: "fa-solid fa-user-plus",
            },
            {
                key: "discover",
                number: "02",
                title: "Discover",
                description:
                    "Từng trải nghiệm giúp bạn hiểu rõ hơn cơ thể, lối sống và nhu cầu hiện tại của mình.",
                icon: "fa-solid fa-compass",
            },
            {
                key: "grow",
                number: "03",
                title: "Grow",
                description:
                    "Từ quyền lợi và định hướng phù hợp, wellness dần trở thành một thói quen có chiều sâu hơn.",
                icon: "fa-solid fa-arrow-trend-up",
            },
            {
                key: "belong",
                number: "04",
                title: "Belong",
                description:
                    "Bạn trở thành một phần của cộng đồng cùng hướng đến sự cân bằng và chất lượng sống bền vững.",
                icon: "fa-solid fa-hand-holding-heart",
            },
        ],
        endingNote:
            "Một membership có ý nghĩa không chỉ hỗ trợ bạn hôm nay, mà còn giúp bạn duy trì wellness theo cách tự nhiên hơn về lâu dài.",
    },

    community: {
        badge: "Member Community",
        title: "Một cộng đồng giúp hành trình wellness có cảm hứng hơn",
        description:
            "Membership tại AYANAVITA cũng là cánh cửa dẫn tới một không gian kết nối — nơi những người cùng quan tâm đến sức khỏe, sự cân bằng và chất lượng sống có thể tìm thấy cảm hứng, sự đồng hành và nhịp điệu tích cực hơn cho hành trình của mình.",
        spotlight: {
            badge: "Community Philosophy",
            title: "Belonging makes wellness more sustainable",
            paragraphs: [
                "Wellness thường trở nên dễ duy trì hơn khi bạn không phải đi một mình.",
                "Một cộng đồng đúng không làm thay hành trình của bạn, nhưng giúp hành trình đó trở nên có động lực, có cảm hứng và giàu kết nối hơn.",
            ],
            quote:
                "Membership is not only about benefits. It is about belonging, continuity and growing within a more mindful wellness journey.",
            quoteLabel: "AYANAVITA Membership",
            note:
                "Khi cảm giác được kết nối xuất hiện, việc chăm sóc bản thân thường trở nên tự nhiên và bền vững hơn.",
        },
        items: [
            {
                key: "connection",
                title: "Meaningful Connection",
                description:
                    "Kết nối với những người cùng chia sẻ sự quan tâm đến wellness và lối sống cân bằng hơn.",
                icon: "fa-solid fa-link",
            },
            {
                key: "shared-inspiration",
                title: "Shared Inspiration",
                description:
                    "Cộng đồng giúp tạo ra cảm hứng để bạn tiếp tục hành trình chăm sóc bản thân với nhiều động lực hơn.",
                icon: "fa-solid fa-sparkles",
            },
            {
                key: "wellness-culture",
                title: "Wellness Culture",
                description:
                    "Membership góp phần tạo nên một văn hóa wellness tích cực, tinh tế và gần gũi hơn mỗi ngày.",
                icon: "fa-solid fa-spa",
            },
        ],
    },

    closing: {
        title: "Become part of the AYANAVITA Membership",
        description:
            "Nếu bạn đang tìm kiếm nhiều hơn một gói quyền lợi thông thường — một hành trình wellness đều đặn hơn, mang tính cá nhân hơn và có cảm giác kết nối lâu dài hơn — AYANAVITA Membership được tạo ra để đồng hành cùng bạn theo cách đó.",
        primaryButtonLabel: "Start Membership",
        primaryButtonHref: "#",
        secondaryButtonLabel: "Contact AYANAVITA",
        secondaryButtonHref: "#",
    },
};

const toneStyles = [
    {
        iconWrap:
            "from-indigo-600 via-violet-600 to-cyan-500 text-white shadow-indigo-500/30",
        border:
            "border-indigo-100 hover:border-indigo-200 hover:shadow-[0_20px_50px_-24px_rgba(79,70,229,0.18)]",
        label: "text-indigo-600",
        softBg: "from-indigo-50 via-white to-cyan-50/70",
        dot: "bg-indigo-500",
    },
    {
        iconWrap:
            "from-amber-400 via-yellow-400 to-orange-400 text-slate-900 shadow-amber-400/30",
        border:
            "border-amber-100 hover:border-amber-200 hover:shadow-[0_20px_50px_-24px_rgba(245,158,11,0.22)]",
        label: "text-amber-600",
        softBg: "from-amber-50 via-white to-orange-50/80",
        dot: "bg-amber-500",
    },
    {
        iconWrap:
            "from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-emerald-500/30",
        border:
            "border-emerald-100 hover:border-emerald-200 hover:shadow-[0_20px_50px_-24px_rgba(16,185,129,0.20)]",
        label: "text-emerald-600",
        softBg: "from-emerald-50 via-white to-cyan-50/80",
        dot: "bg-emerald-500",
    },
] as const;

function mergeCmsData(
    cmsData?: Partial<MembershipPageCmsData>,
): MembershipPageCmsData {
    return {
        hero: {
            ...cmsDataDefault.hero,
            ...(cmsData?.hero ?? {}),
            chips: cmsData?.hero?.chips ?? cmsDataDefault.hero.chips,
            actions: cmsData?.hero?.actions ?? cmsDataDefault.hero.actions,
            previewItems:
                cmsData?.hero?.previewItems ?? cmsDataDefault.hero.previewItems,
        },
        benefits: {
            ...cmsDataDefault.benefits,
            ...(cmsData?.benefits ?? {}),
            items: cmsData?.benefits?.items ?? cmsDataDefault.benefits.items,
        },
        journey: {
            ...cmsDataDefault.journey,
            ...(cmsData?.journey ?? {}),
            steps: cmsData?.journey?.steps ?? cmsDataDefault.journey.steps,
        },
        community: {
            ...cmsDataDefault.community,
            ...(cmsData?.community ?? {}),
            spotlight: {
                ...cmsDataDefault.community.spotlight,
                ...(cmsData?.community?.spotlight ?? {}),
                paragraphs:
                    cmsData?.community?.spotlight?.paragraphs ??
                    cmsDataDefault.community.spotlight.paragraphs,
            },
            items: cmsData?.community?.items ?? cmsDataDefault.community.items,
        },
        closing: {
            ...cmsDataDefault.closing,
            ...(cmsData?.closing ?? {}),
        },
    };
}

function renderHighlightTitle(title: string, highlight: string) {
    if (!title.includes(highlight)) return title;

    const parts = title.split(highlight);

    return (
        <>
            {parts[0]}
            <span className="bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 bg-clip-text text-transparent">
        {highlight}
      </span>
            {parts[1]}
        </>
    );
}

function getActionClass(variant: "primary" | "secondary") {
    if (variant === "secondary") {
        return "border border-amber-200/80 bg-white/90 text-slate-700 hover:bg-white";
    }

    return "bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 text-slate-900 hover:opacity-95";
}

const MembershipPage: React.FC<MembershipPageProps> = ({
                                                           cmsData,
                                                           className = "",
                                                       }) => {
    const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
        return localStorage.getItem("preferred-language") || "vi";
    });
    const [cmsDataFromApi, setCmsDataFromApi] = useState<Partial<MembershipPageCmsData> | null>(null);

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

    const mergedCmsInput = useMemo(
        () => ({ ...(cmsDataFromApi || {}), ...(cmsData || {}) }),
        [cmsDataFromApi, cmsData],
    );
    const data = useMemo(() => mergeCmsData(mergedCmsInput), [mergedCmsInput]);
    const [featuredBenefit, ...secondaryBenefits] = data.benefits.items;

    return (
        <main
            className={[
                "relative isolate overflow-hidden bg-gradient-to-b from-white via-amber-50/30 to-orange-50/40 text-slate-800",
                className,
            ].join(" ")}
        >
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute left-0 top-10 h-64 w-64 rounded-full bg-amber-200/30 blur-3xl" />
                <div className="absolute right-0 top-24 h-72 w-72 rounded-full bg-orange-200/25 blur-3xl" />
                <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-yellow-200/20 blur-3xl" />
            </div>

            <section className="px-4 pb-16 pt-24 sm:px-6 md:pb-24 md:pt-28 lg:px-8">
                <div className="mx-auto max-w-6xl">
                    <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.25 }}
                            transition={{ duration: 0.7, ease: "easeOut" }}
                        >
                            <div className="inline-flex items-center gap-3 rounded-full border border-amber-200/70 bg-white/85 px-4 py-2 shadow-sm backdrop-blur">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-400 text-slate-900 shadow-lg shadow-amber-400/30">
                  <i className="fa-solid fa-id-card" />
                </span>
                                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 sm:text-sm">
                  {data.hero.badge}
                </span>
                            </div>

                            <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                                {renderHighlightTitle(data.hero.title, data.hero.highlight)}
                            </h1>

                            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600 md:text-lg">
                                {data.hero.description}
                            </p>

                            <div className="mt-7 flex flex-wrap gap-3">
                                {data.hero.chips.map((chip, index) => (
                                    <span
                                        key={`${chip.text}-${index}`}
                                        className="rounded-full border border-amber-200/70 bg-white/85 px-4 py-2 text-sm text-slate-700 shadow-sm backdrop-blur"
                                    >
                    {chip.text}
                  </span>
                                ))}
                            </div>

                            <div className="mt-8 flex flex-wrap gap-3">
                                {data.hero.actions.map((action, index) => (
                                    <a
                                        key={`${action.label}-${index}`}
                                        href={action.href}
                                        className={[
                                            "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold shadow-sm transition duration-300",
                                            getActionClass(action.variant),
                                        ].join(" ")}
                                    >
                                        {action.label}
                                    </a>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 28 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.25 }}
                            transition={{ duration: 0.75, delay: 0.06, ease: "easeOut" }}
                            className="relative"
                        >
                            <div className="absolute -left-4 top-10 hidden h-24 w-24 rounded-full bg-amber-300/20 blur-2xl lg:block" />
                            <div className="absolute -right-4 bottom-10 hidden h-28 w-28 rounded-full bg-orange-300/20 blur-2xl lg:block" />

                            <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_30px_90px_-35px_rgba(15,23,42,0.2)]">
                                <div className="absolute inset-0 bg-gradient-to-tr from-amber-300/10 via-transparent to-orange-300/10" />
                                <div className="relative p-6 md:p-7">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
                                            {data.hero.previewBadge}
                                        </div>
                                        <div className="h-px flex-1 bg-gradient-to-r from-amber-200 to-transparent" />
                                    </div>

                                    <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900">
                                        {data.hero.previewTitle}
                                    </h2>

                                    <div className="mt-6 space-y-4">
                                        {data.hero.previewItems.map((item, index) => {
                                            const style = toneStyles[index % toneStyles.length];

                                            return (
                                                <div
                                                    key={item.key}
                                                    className="rounded-[1.4rem] border border-white/70 bg-white/85 p-4 shadow-sm"
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div
                                                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${style.iconWrap} shadow-lg`}
                                                        >
                                                            <i className={item.icon} />
                                                        </div>

                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold text-slate-900">
                                                                {item.title}
                                                            </p>
                                                            <p className="mt-1 text-sm leading-6 text-slate-600">
                                                                {item.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="mt-6 rounded-[1.5rem] border border-amber-200/70 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-5">
                                        <p className="text-sm leading-7 text-slate-700">
                                            {data.hero.previewNote}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            <section
                id="membership-benefits"
                className="px-4 py-16 sm:px-6 md:py-20 lg:px-8"
            >
                <div className="mx-auto max-w-6xl">
                    <div className="max-w-2xl">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700 md:text-sm">
                            {data.benefits.badge}
                        </p>
                        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                            {data.benefits.title}
                        </h2>
                        <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
                            {data.benefits.description}
                        </p>
                    </div>

                    <div className="mt-10 grid gap-5 lg:grid-cols-12">
                        <motion.article
                            initial={{ opacity: 0, y: 26 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.22 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className={[
                                "group relative overflow-hidden rounded-[28px] border bg-white p-6 shadow-[0_18px_50px_-24px_rgba(15,23,42,0.14)] lg:col-span-7 lg:p-8",
                                toneStyles[1].border,
                            ].join(" ")}
                        >
                            <div
                                className={`absolute inset-0 bg-gradient-to-br ${toneStyles[1].softBg} opacity-90`}
                            />
                            <div className="relative">
                                <div
                                    className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${toneStyles[1].iconWrap} text-lg shadow-lg transition duration-500 group-hover:scale-110 group-hover:rotate-3`}
                                >
                                    <i className={featuredBenefit.icon} />
                                </div>

                                <p
                                    className={`mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] ${toneStyles[1].label}`}
                                >
                                    {featuredBenefit.label}
                                </p>
                                <h3 className="mt-2 max-w-xl text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                                    {featuredBenefit.title}
                                </h3>
                                <p className="mt-4 max-w-2xl text-sm leading-8 text-slate-600 md:text-base">
                                    {featuredBenefit.description}
                                </p>

                                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                                    {featuredBenefit.points.map((point, index) => (
                                        <div
                                            key={`${featuredBenefit.key}-point-${index}`}
                                            className="rounded-2xl border border-white/80 bg-white/80 px-4 py-4"
                                        >
                      <span
                          className={`mb-3 block h-2 w-2 rounded-full ${toneStyles[1].dot}`}
                      />
                                            <p className="text-sm leading-6 text-slate-700">{point}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.article>

                        <div className="grid gap-5 lg:col-span-5">
                            {secondaryBenefits.map((item, index) => {
                                const style = toneStyles[index % toneStyles.length];

                                return (
                                    <motion.article
                                        key={item.key}
                                        initial={{ opacity: 0, y: 26 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, amount: 0.22 }}
                                        transition={{
                                            duration: 0.6,
                                            delay: index * 0.06,
                                            ease: "easeOut",
                                        }}
                                        className={[
                                            "group relative overflow-hidden rounded-[24px] border bg-white p-5 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.14)] transition-all duration-300 hover:-translate-y-1",
                                            style.border,
                                        ].join(" ")}
                                    >
                                        <div
                                            className={`absolute inset-0 bg-gradient-to-br ${style.softBg} opacity-80`}
                                        />
                                        <div className="relative">
                                            <div
                                                className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${style.iconWrap} text-sm shadow-lg transition duration-500 group-hover:scale-110 group-hover:rotate-3`}
                                            >
                                                <i className={item.icon} />
                                            </div>

                                            <p
                                                className={`mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] ${style.label}`}
                                            >
                                                {item.label}
                                            </p>
                                            <h3 className="mt-2 text-lg font-semibold text-slate-900">
                                                {item.title}
                                            </h3>
                                            <p className="mt-3 text-sm leading-7 text-slate-600">
                                                {item.description}
                                            </p>

                                            <div className="mt-5 space-y-3">
                                                {item.points.map((point, pointIndex) => (
                                                    <div
                                                        key={`${item.key}-point-${pointIndex}`}
                                                        className="flex items-start gap-3 rounded-2xl border border-white/80 bg-white/80 px-4 py-3"
                                                    >
                            <span
                                className={`mt-2 h-2 w-2 shrink-0 rounded-full ${style.dot}`}
                            />
                                                        <p className="text-sm leading-6 text-slate-700">
                                                            {point}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.article>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            <section className="px-4 py-16 sm:px-6 md:py-20 lg:px-8">
                <div className="mx-auto max-w-6xl">
                    <div className="mx-auto max-w-3xl text-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700 md:text-sm">
                            {data.journey.badge}
                        </p>
                        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                            {data.journey.title}
                        </h2>
                        <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
                            {data.journey.description}
                        </p>
                    </div>

                    <div className="relative mt-10">
                        <div className="absolute left-6 right-6 top-6 hidden h-px bg-gradient-to-r from-amber-200 via-amber-300 to-orange-200 lg:block" />

                        <div className="grid gap-5 lg:grid-cols-4">
                            {data.journey.steps.map((step, index) => {
                                const style = toneStyles[index % toneStyles.length];

                                return (
                                    <motion.article
                                        key={step.key}
                                        initial={{ opacity: 0, y: 24 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, amount: 0.2 }}
                                        transition={{
                                            duration: 0.6,
                                            delay: index * 0.06,
                                            ease: "easeOut",
                                        }}
                                        className="relative"
                                    >
                                        <div className="absolute left-5 top-5 z-10 hidden h-3 w-3 rounded-full bg-amber-400 shadow-[0_0_0_8px_rgba(251,191,36,0.12)] lg:block" />

                                        <div
                                            className={[
                                                "group relative overflow-hidden rounded-[24px] border bg-white p-5 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.14)] lg:pt-12",
                                                style.border,
                                            ].join(" ")}
                                        >
                                            <div
                                                className={`absolute inset-0 bg-gradient-to-br ${style.softBg} opacity-80`}
                                            />
                                            <div className="relative">
                                                <div
                                                    className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${style.iconWrap} text-sm shadow-lg transition duration-500 group-hover:scale-110 group-hover:rotate-3`}
                                                >
                                                    <i className={step.icon} />
                                                </div>

                                                <p
                                                    className={`mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] ${style.label}`}
                                                >
                                                    {step.number}
                                                </p>
                                                <h3 className="mt-2 text-lg font-semibold text-slate-900">
                                                    {step.title}
                                                </h3>
                                                <p className="mt-3 text-sm leading-7 text-slate-600">
                                                    {step.description}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.article>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-8 rounded-[24px] border border-amber-200/70 bg-white/80 px-6 py-5 text-center shadow-[0_24px_70px_-35px_rgba(245,158,11,0.45)] backdrop-blur-sm">
                        <p className="text-sm leading-7 text-slate-600">
                            {data.journey.endingNote}
                        </p>
                    </div>
                </div>
            </section>

            <section
                id="membership-community"
                className="px-4 py-16 sm:px-6 md:py-20 lg:px-8"
            >
                <div className="mx-auto max-w-6xl">
                    <div className="mb-10 max-w-2xl">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700 md:text-sm">
                            {data.community.badge}
                        </p>
                        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                            {data.community.title}
                        </h2>
                        <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
                            {data.community.description}
                        </p>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
                        <motion.div
                            initial={{ opacity: 0, y: 26 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.22 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="relative overflow-hidden rounded-[28px] border border-amber-200/70 bg-white p-6 shadow-[0_24px_70px_-35px_rgba(245,158,11,0.45)] lg:p-8"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white via-amber-50/40 to-orange-50/60" />

                            <div className="relative">
                                <div className="inline-flex items-center gap-3 rounded-full border border-amber-200/70 bg-white/85 px-4 py-2 shadow-sm">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-400 text-slate-900 shadow-lg shadow-amber-400/30">
                    <i className="fa-solid fa-spa" />
                  </span>
                                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                    {data.community.spotlight.badge}
                  </span>
                                </div>

                                <h3 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                                    {data.community.spotlight.title}
                                </h3>

                                <div className="mt-5 space-y-4 text-sm leading-8 text-slate-600 md:text-base">
                                    {data.community.spotlight.paragraphs.map((paragraph, index) => (
                                        <p key={`${data.community.spotlight.badge}-${index}`}>
                                            {paragraph}
                                        </p>
                                    ))}
                                </div>

                                <div className="mt-7 rounded-[1.5rem] border border-amber-200/70 bg-white/80 p-5">
                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
                                        {data.community.spotlight.quoteLabel}
                                    </p>
                                    <p className="mt-3 text-lg font-medium leading-8 text-slate-800">
                                        {data.community.spotlight.quote}
                                    </p>
                                    <div className="mt-4 h-px w-full bg-gradient-to-r from-amber-300 via-yellow-300 to-transparent" />
                                    <p className="mt-4 text-sm leading-7 text-slate-500">
                                        {data.community.spotlight.note}
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        <div className="grid gap-4">
                            {data.community.items.map((item, index) => {
                                const style = toneStyles[index % toneStyles.length];

                                return (
                                    <motion.article
                                        key={item.key}
                                        initial={{ opacity: 0, y: 26 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, amount: 0.22 }}
                                        transition={{
                                            duration: 0.6,
                                            delay: index * 0.05,
                                            ease: "easeOut",
                                        }}
                                        className={[
                                            "group relative overflow-hidden rounded-[24px] border bg-white p-5 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.14)] transition-all duration-300 hover:-translate-y-1",
                                            style.border,
                                        ].join(" ")}
                                    >
                                        <div
                                            className={`absolute inset-0 bg-gradient-to-br ${style.softBg} opacity-80`}
                                        />
                                        <div className="relative flex items-start gap-4">
                                            <div
                                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${style.iconWrap} text-sm shadow-lg transition duration-500 group-hover:scale-110 group-hover:rotate-3`}
                                            >
                                                <i className={item.icon} />
                                            </div>

                                            <div className="min-w-0">
                                                <h3 className="text-lg font-semibold text-slate-900">
                                                    {item.title}
                                                </h3>
                                                <p className="mt-2 text-sm leading-7 text-slate-600">
                                                    {item.description}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.article>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            <section className="px-4 pb-24 pt-8 sm:px-6 md:pb-28 lg:px-8">
                <div className="mx-auto max-w-6xl">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.22 }}
                        transition={{ duration: 0.65, ease: "easeOut" }}
                        className="rounded-[2rem] border border-amber-200/70 bg-white/85 p-8 text-center shadow-[0_30px_90px_-35px_rgba(245,158,11,0.28)] backdrop-blur md:p-12"
                    >
                        <h2 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                            {data.closing.title}
                        </h2>
                        <p className="mx-auto mt-5 max-w-3xl text-sm leading-8 text-slate-600 md:text-base">
                            {data.closing.description}
                        </p>

                        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                            <a
                                href={data.closing.primaryButtonHref}
                                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:opacity-95"
                            >
                                {data.closing.primaryButtonLabel}
                            </a>
                            <a
                                href={data.closing.secondaryButtonHref}
                                className="inline-flex items-center justify-center rounded-full border border-amber-200/80 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-amber-50/40"
                            >
                                {data.closing.secondaryButtonLabel}
                            </a>
                        </div>
                    </motion.div>
                </div>
            </section>
        </main>
    );
};

export default MembershipPage;
export { cmsDataDefault as cmsData };
