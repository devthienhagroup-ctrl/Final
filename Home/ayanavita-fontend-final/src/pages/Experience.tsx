// src/pages/experience/AyanavitaExperiencePage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { http } from "../api/http";

type HeroChip = {
    text?: string;
};

type HeroAction = {
    label?: string;
    href?: string;
    variant?: "primary" | "secondary";
};

type HeroData = {
    badge?: string;
    title?: string;
    highlight?: string;
    paragraphs?: string[];
    chips?: HeroChip[];
    actions?: HeroAction[];
    previewBadge?: string;
    previewTitle?: string;
    previewItems?: string[];
    previewQuote?: string;
};

type IntroData = {
    badge?: string;
    title?: string;
    description?: string;
    sideCardTitle?: string;
    sideCardDescription?: string;
    sidePoints?: string[];
};

type ExperienceCard = {
    key?: string;
    label?: string;
    title?: string;
    description?: string;
    iconClass?: string;
    points?: string[];
};

type ExperiencePillarsData = {
    badge?: string;
    title?: string;
    description?: string;
    items?: ExperienceCard[];
};

type JourneyStep = {
    number?: string;
    title?: string;
    description?: string;
    iconClass?: string;
};

type JourneyData = {
    badge?: string;
    title?: string;
    description?: string;
    steps?: JourneyStep[];
};

type PhilosophyCard = {
    title?: string;
    description?: string;
    iconClass?: string;
};

type PhilosophyData = {
    badge?: string;
    title?: string;
    description?: string;
    quoteLabel?: string;
    quote?: string;
    bottomNote?: string;
    cards?: PhilosophyCard[];
};

type ClosingData = {
    title?: string;
    description?: string;
    primaryButtonLabel?: string;
    primaryButtonHref?: string;
    secondaryButtonLabel?: string;
    secondaryButtonHref?: string;
};

export type AyanavitaExperiencePageCMS = {
    hero?: HeroData;
    intro?: IntroData;
    pillars?: ExperiencePillarsData;
    journey?: JourneyData;
    philosophy?: PhilosophyData;
    closing?: ClosingData;
};

type AyanavitaExperiencePageProps = {
    cmsData?: AyanavitaExperiencePageCMS;
    className?: string;
};

const PAGE_SLUG = "experience";
const PAGE_SLUG_FALLBACK = "experience";

const cmsDataDefault: Required<AyanavitaExperiencePageCMS> = {
    hero: {
        badge: "The AYANAVITA Experience",
        title: "A wellness experience designed around you",
        highlight: "designed around you",
        paragraphs: [
            "Mỗi trải nghiệm tại AYANAVITA bắt đầu từ một ý định rất đơn giản: giúp bạn kết nối lại với cơ thể và tìm lại sự cân bằng trong cuộc sống.",
            "Ngay từ khi bạn bước vào, không gian được thiết kế để mang lại cảm giác bình yên, rõ ràng và tái tạo năng lượng.",
            "Thông qua những trải nghiệm wellness cá nhân hóa, sự hướng dẫn nhẹ nhàng và các chương trình được thiết kế cẩn thận, AYANAVITA giúp bạn khám phá một nhịp sống khỏe mạnh hơn cho cơ thể và cuộc sống hàng ngày.",
            "Bởi vì wellness thật sự không chỉ là vẻ ngoài — mà là cảm giác bên trong, cách bạn sống và cách bạn chăm sóc bản thân theo thời gian.",
        ],
        chips: [
            { text: "Wellness Check-in" },
            { text: "Personalized Wellness Programs" },
            { text: "Lifestyle Guidance" },
        ],
        actions: [
            {
                label: "Explore The Journey",
                href: "#experience-journey",
                variant: "primary",
            },
            {
                label: "Discover Programs",
                href: "#experience-pillars",
                variant: "secondary",
            },
        ],
        previewBadge: "AYANAVITA",
        previewTitle: "The AYANAVITA Experience",
        previewItems: [
            "Wellness Check-in",
            "Personalized Wellness Programs",
            "Lifestyle Guidance",
        ],
        previewQuote:
            "Wellness không chỉ là vẻ ngoài. Đó là cảm giác bên trong, cách bạn sống và cách bạn quay về trạng thái cân bằng của riêng mình.",
    },

    intro: {
        badge: "A CALM BEGINNING",
        title: "Một hành trình wellness được bắt đầu bằng sự thấu hiểu",
        description:
            "AYANAVITA không bắt đầu từ việc áp dụng một công thức chung cho tất cả mọi người. Chúng tôi bắt đầu từ việc lắng nghe cơ thể, quan sát lối sống và hiểu rõ hơn trạng thái hiện tại của từng cá nhân. Chính từ sự thấu hiểu đó, trải nghiệm wellness mới có thể trở nên tinh tế hơn, phù hợp hơn và có giá trị lâu dài hơn theo thời gian.",
        sideCardTitle: "What shapes the experience",
        sideCardDescription:
            "Trải nghiệm tại AYANAVITA được xây dựng như một hành trình nhẹ nhàng nhưng có chiều sâu, nơi sự thấu hiểu, cá nhân hóa và cân bằng cùng kết nối với nhau.",
        sidePoints: [
            "Bắt đầu từ việc hiểu cơ thể và lối sống hiện tại",
            "Định hướng chăm sóc theo nhu cầu riêng thay vì công thức chung",
            "Từng bước đưa wellness vào đời sống theo cách tự nhiên hơn",
        ],
    },

    pillars: {
        badge: "EXPERIENCE PILLARS",
        title: "Ba phần cốt lõi tạo nên The AYANAVITA Experience",
        description:
            "Mỗi phần đều giữ một vai trò riêng trong hành trình wellness, nhưng khi kết hợp lại, chúng tạo nên một trải nghiệm hài hòa hơn, sâu hơn và phù hợp hơn với từng cá nhân.",
        items: [
            {
                key: "check-in",
                label: "01 · Wellness Check-in",
                title: "Wellness Check-in",
                description:
                    "Đây là bước khởi đầu để bạn nhìn lại cơ thể, làn da, mức năng lượng và nhịp sống hiện tại của mình. Thay vì chăm sóc theo cảm tính, AYANAVITA giúp bạn có một điểm bắt đầu rõ ràng hơn — nơi bạn hiểu mình đang ở đâu và điều gì nên được ưu tiên trước.",
                iconClass: "fa-solid fa-heart-pulse",
                points: [
                    "Hiểu rõ hơn về thể trạng và nhu cầu hiện tại",
                    "Nhìn lại các yếu tố đang ảnh hưởng đến sức khỏe và năng lượng",
                    "Tạo nền tảng cho một hành trình wellness có định hướng rõ ràng",
                ],
            },
            {
                key: "programs",
                label: "02 · Personalized Programs",
                title: "Personalized Wellness Programs",
                description:
                    "Từ những thông tin đã được quan sát và tổng hợp, AYANAVITA định hướng những chương trình phù hợp hơn với cơ thể, mục tiêu và nhịp sống riêng của từng người. Mỗi lựa chọn đều hướng tới tính thực tế, khả năng duy trì và sự cân bằng lâu dài.",
                iconClass: "fa-solid fa-spa",
                points: [
                    "Định hướng chương trình theo nhu cầu thực tế của từng cá nhân",
                    "Kết nối trải nghiệm chăm sóc thành một hành trình có chiều sâu",
                    "Giúp wellness trở nên rõ ràng, gần gũi và dễ duy trì hơn",
                ],
            },
            {
                key: "guidance",
                label: "03 · Lifestyle Guidance",
                title: "Lifestyle Guidance",
                description:
                    "Wellness thật sự không dừng lại ở một trải nghiệm đẹp trong không gian đẹp. Nó tiếp tục trong cách bạn nghỉ ngơi, ăn uống, phục hồi và chăm sóc bản thân mỗi ngày. AYANAVITA đưa ra những định hướng nhẹ nhàng để bạn xây dựng một phong cách sống cân bằng hơn theo cách tự nhiên và bền vững.",
                iconClass: "fa-solid fa-leaf",
                points: [
                    "Gợi ý thói quen sống lành mạnh theo cách thực tế hơn",
                    "Nuôi dưỡng sự cân bằng lâu dài thay vì thay đổi cực đoan",
                    "Hỗ trợ bạn đưa wellness vào đời sống hằng ngày",
                ],
            },
        ],
    },

    journey: {
        badge: "THE JOURNEY",
        title: "Một timeline rõ ràng, nhẹ nhàng và đi theo từng bước",
        description:
            "Mỗi người đến với AYANAVITA ở một trạng thái khác nhau, vì vậy trải nghiệm được dẫn dắt theo một hành trình rõ ràng để bạn không bị choáng ngợp. Từng bước đều được xây dựng để giúp bạn dễ hiểu hơn, dễ kết nối hơn và dễ tiếp tục hơn.",
        steps: [
            {
                number: "01",
                title: "Discover",
                description:
                    "Bắt đầu bằng việc quan sát cơ thể, làn da, năng lượng và nhịp sống hiện tại của bạn.",
                iconClass: "fa-solid fa-compass",
            },
            {
                number: "02",
                title: "Understand",
                description:
                    "Làm rõ những yếu tố đang ảnh hưởng đến trạng thái cân bằng, sức khỏe và chất lượng sống mỗi ngày.",
                iconClass: "fa-solid fa-brain",
            },
            {
                number: "03",
                title: "Personalize",
                description:
                    "Định hướng chương trình và trải nghiệm phù hợp hơn với nhu cầu, mục tiêu và thói quen cá nhân.",
                iconClass: "fa-solid fa-sparkles",
            },
            {
                number: "04",
                title: "Support",
                description:
                    "Đồng hành để wellness không chỉ là một khoảnh khắc đẹp mà trở thành một phần tự nhiên của cuộc sống lâu dài.",
                iconClass: "fa-solid fa-hand-holding-heart",
            },
        ],
    },

    philosophy: {
        badge: "THE FEELING OF AYANAVITA",
        title: "Không chỉ là dịch vụ, mà là cảm giác bạn mang theo sau đó",
        description:
            "Điều tạo nên trải nghiệm AYANAVITA không chỉ nằm ở các dịch vụ riêng lẻ, mà còn nằm ở cảm giác được lắng nghe, được dẫn dắt một cách tinh tế và được chăm sóc theo cách phù hợp hơn với chính mình. Wellness thật sự không chỉ là vẻ ngoài — mà là cảm giác bên trong, cách bạn sống và cách bạn quay về trạng thái cân bằng theo thời gian.",
        quoteLabel: "Experience Philosophy",
        quote:
            "Wellness is not only about how you look. It is about how you feel, how you live, and how gently you return to balance over time.",
        bottomNote:
            "Một hành trình wellness tinh tế bắt đầu từ sự thấu hiểu, thay vì áp dụng cùng một cách chăm sóc cho mọi người.",
        cards: [
            {
                title: "Clarity",
                description:
                    "Giúp bạn hiểu cơ thể và nhu cầu của mình theo cách rõ ràng hơn.",
                iconClass: "fa-solid fa-sun",
            },
            {
                title: "Personal Care",
                description:
                    "Trải nghiệm được thiết kế để phù hợp với từng người, không đại trà.",
                iconClass: "fa-solid fa-seedling",
            },
            {
                title: "Long-term Balance",
                description:
                    "Hướng đến sự cân bằng bền vững thay vì những thay đổi ngắn hạn.",
                iconClass: "fa-solid fa-infinity",
            },
        ],
    },

    closing: {
        title: "Begin your AYANAVITA experience",
        description:
            "Dù bạn đang tìm kiếm một điểm bắt đầu để hiểu cơ thể hơn, một chương trình phù hợp hơn với bản thân hay một nhịp sống cân bằng hơn mỗi ngày, AYANAVITA luôn mong muốn trở thành nơi đồng hành nhẹ nhàng nhưng có ý nghĩa trên hành trình đó.",
        primaryButtonLabel: "Book Your Experience",
        primaryButtonHref: "#",
        secondaryButtonLabel: "Contact AYANAVITA",
        secondaryButtonHref: "#",
    },
};

const pillarCardStyles = [
    {
        iconWrap:
            "from-indigo-600 via-violet-600 to-cyan-500 text-white shadow-indigo-500/30",
        border:
            "border-indigo-100 hover:border-indigo-200 hover:shadow-[0_24px_60px_-28px_rgba(79,70,229,0.22)]",
        softBg: "from-indigo-50 via-white to-cyan-50/60",
        label: "text-indigo-600",
        dot: "bg-indigo-500",
    },
    {
        iconWrap:
            "from-amber-400 via-yellow-400 to-orange-400 text-slate-900 shadow-amber-400/30",
        border:
            "border-amber-100 hover:border-amber-200 hover:shadow-[0_24px_60px_-28px_rgba(245,158,11,0.24)]",
        softBg: "from-amber-50 via-white to-orange-50/70",
        label: "text-amber-600",
        dot: "bg-amber-500",
    },
    {
        iconWrap:
            "from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-emerald-500/30",
        border:
            "border-emerald-100 hover:border-emerald-200 hover:shadow-[0_24px_60px_-28px_rgba(16,185,129,0.22)]",
        softBg: "from-emerald-50 via-white to-cyan-50/70",
        label: "text-emerald-600",
        dot: "bg-emerald-500",
    },
] as const;

const philosophyCardStyles = [
    {
        iconWrap:
            "from-amber-400 via-yellow-400 to-orange-400 text-slate-900 shadow-amber-400/30",
    },
    {
        iconWrap:
            "from-indigo-600 via-violet-600 to-cyan-500 text-white shadow-indigo-500/30",
    },
    {
        iconWrap:
            "from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-emerald-500/30",
    },
] as const;

function mergeCmsData(
    cmsData?: AyanavitaExperiencePageCMS,
): Required<AyanavitaExperiencePageCMS> {
    const fallbackPillarItems = cmsDataDefault.pillars.items;
    const fallbackJourneySteps = cmsDataDefault.journey.steps;
    const fallbackPhilosophyCards = cmsDataDefault.philosophy.cards;

    return {
        hero: {
            ...cmsDataDefault.hero,
            ...(cmsData?.hero ?? {}),
            paragraphs: cmsData?.hero?.paragraphs?.length
                ? cmsData.hero.paragraphs
                : cmsDataDefault.hero.paragraphs,
            chips: cmsData?.hero?.chips?.length
                ? cmsData.hero.chips
                : cmsDataDefault.hero.chips,
            actions: cmsData?.hero?.actions?.length
                ? cmsData.hero.actions
                : cmsDataDefault.hero.actions,
            previewItems: cmsData?.hero?.previewItems?.length
                ? cmsData.hero.previewItems
                : cmsDataDefault.hero.previewItems,
        },
        intro: {
            ...cmsDataDefault.intro,
            ...(cmsData?.intro ?? {}),
            sidePoints: cmsData?.intro?.sidePoints?.length
                ? cmsData.intro.sidePoints
                : cmsDataDefault.intro.sidePoints,
        },
        pillars: {
            ...cmsDataDefault.pillars,
            ...(cmsData?.pillars ?? {}),
            items: cmsData?.pillars?.items?.length
                ? cmsData.pillars.items.map((item, index) => ({
                    ...(fallbackPillarItems[index] ?? fallbackPillarItems[0]),
                    ...item,
                    points:
                        item.points ??
                        fallbackPillarItems[index]?.points ??
                        fallbackPillarItems[0].points,
                }))
                : cmsDataDefault.pillars.items,
        },
        journey: {
            ...cmsDataDefault.journey,
            ...(cmsData?.journey ?? {}),
            steps: cmsData?.journey?.steps?.length
                ? cmsData.journey.steps.map((step, index) => ({
                    ...(fallbackJourneySteps[index] ?? fallbackJourneySteps[0]),
                    ...step,
                }))
                : cmsDataDefault.journey.steps,
        },
        philosophy: {
            ...cmsDataDefault.philosophy,
            ...(cmsData?.philosophy ?? {}),
            cards: cmsData?.philosophy?.cards?.length
                ? cmsData.philosophy.cards.map((card, index) => ({
                    ...(fallbackPhilosophyCards[index] ?? fallbackPhilosophyCards[0]),
                    ...card,
                }))
                : cmsDataDefault.philosophy.cards,
        },
        closing: {
            ...cmsDataDefault.closing,
            ...(cmsData?.closing ?? {}),
        },
    };
}

function renderHeroTitle(title?: string, highlight?: string) {
    if (!title || !highlight || !title.includes(highlight)) return title;

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

function getActionClass(variant?: "primary" | "secondary") {
    if (variant === "secondary") {
        return "border border-amber-200/80 bg-white/90 text-slate-700 hover:bg-white";
    }

    return "bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 text-slate-900 hover:opacity-95";
}

export default function AyanavitaExperiencePage({
                                                    cmsData,
                                                    className = "",
                                                }: AyanavitaExperiencePageProps) {
    const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
        return localStorage.getItem("preferred-language") || "vi";
    });
    const [cmsDataFromApi, setCmsDataFromApi] = useState<Partial<AyanavitaExperiencePageCMS> | null>(null);

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
                    <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.9fr] lg:gap-14">
                        <motion.div
                            initial={{ opacity: 0, y: 26 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.25 }}
                            transition={{ duration: 0.7, ease: "easeOut" }}
                        >
                            <div className="inline-flex items-center gap-3 rounded-full border border-amber-200/70 bg-white/85 px-4 py-2 shadow-sm backdrop-blur">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-400 text-slate-900 shadow-lg shadow-amber-400/30">
                  <i className="fa-solid fa-spa" />
                </span>
                                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 sm:text-sm">
                  {data.hero.badge}
                </span>
                            </div>

                            <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                                {renderHeroTitle(data.hero.title, data.hero.highlight)}
                            </h1>

                            <div className="mt-6 space-y-4 text-base leading-8 text-slate-600 md:text-lg">
                                {data.hero.paragraphs.map((paragraph, index) => (
                                    <p key={`${paragraph}-${index}`}>{paragraph}</p>
                                ))}
                            </div>

                            <div className="mt-7 flex flex-wrap gap-3">
                                {data.hero.chips.map((chip, index) => (
                                    <div
                                        key={`${chip.text}-${index}`}
                                        className="rounded-full border border-amber-200/70 bg-white/85 px-4 py-2 text-sm text-slate-700 shadow-sm backdrop-blur"
                                    >
                                        {chip.text}
                                    </div>
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
                            transition={{ duration: 0.75, delay: 0.08, ease: "easeOut" }}
                            className="relative"
                        >
                            <div className="absolute -left-4 top-10 hidden h-24 w-24 rounded-full bg-amber-300/20 blur-2xl lg:block" />
                            <div className="absolute -right-4 bottom-10 hidden h-28 w-28 rounded-full bg-orange-300/20 blur-2xl lg:block" />

                            <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_30px_90px_-35px_rgba(15,23,42,0.2)]">
                                <div className="absolute inset-0 bg-gradient-to-tr from-amber-300/10 via-transparent to-orange-300/10" />
                                <div className="relative p-6 md:p-7">
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
                                            {data.hero.previewBadge}
                                        </div>
                                        <div className="rounded-full border border-amber-200/70 bg-amber-50/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                                            {data.hero.previewTitle}
                                        </div>
                                    </div>

                                    <div className="mt-8 space-y-4">
                                        {data.hero.previewItems.map((item, index) => {
                                            const style =
                                                pillarCardStyles[index % pillarCardStyles.length];

                                            return (
                                                <div
                                                    key={`${item}-${index}`}
                                                    className="rounded-[1.4rem] border border-white/70 bg-white/85 p-4 shadow-sm"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${style.iconWrap} shadow-lg`}
                                                        >
                                                            <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
                                                        </div>
                                                        <p className="text-sm font-medium text-slate-700">
                                                            {item}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="mt-6 rounded-[1.5rem] border border-amber-200/70 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-5">
                                        <p className="text-sm leading-7 text-slate-700">
                                            {data.hero.previewQuote}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            <section className="px-4 py-12 sm:px-6 lg:px-8">
                <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.25 }}
                        transition={{ duration: 0.65, ease: "easeOut" }}
                    >
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700 md:text-sm">
                            {data.intro.badge}
                        </p>
                        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                            {data.intro.title}
                        </h2>
                        <p className="mt-5 text-[15px] leading-8 text-slate-600 md:text-base">
                            {data.intro.description}
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.25 }}
                        transition={{ duration: 0.65, delay: 0.06, ease: "easeOut" }}
                        className="rounded-[1.75rem] border border-amber-200/70 bg-white/80 p-6 shadow-[0_24px_70px_-35px_rgba(245,158,11,0.45)] backdrop-blur-sm"
                    >
                        <h3 className="text-lg font-semibold text-slate-900">
                            {data.intro.sideCardTitle}
                        </h3>
                        <p className="mt-3 text-sm leading-7 text-slate-600">
                            {data.intro.sideCardDescription}
                        </p>

                        <div className="mt-5 space-y-3">
                            {data.intro.sidePoints.map((point, index) => (
                                <div
                                    key={`${point}-${index}`}
                                    className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50/40 px-4 py-3"
                                >
                                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                                    <p className="text-sm leading-6 text-slate-700">{point}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            <section
                id="experience-pillars"
                className="px-4 py-16 sm:px-6 md:py-20 lg:px-8"
            >
                <div className="mx-auto max-w-6xl">
                    <div className="mx-auto max-w-2xl text-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700 md:text-sm">
                            {data.pillars.badge}
                        </p>
                        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                            {data.pillars.title}
                        </h2>
                        <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
                            {data.pillars.description}
                        </p>
                    </div>

                    <div className="mt-10 grid gap-5 lg:grid-cols-3">
                        {data.pillars.items.map((item, index) => {
                            const style = pillarCardStyles[index % pillarCardStyles.length];

                            return (
                                <motion.article
                                    key={item.key ?? item.title ?? index}
                                    initial={{ opacity: 0, y: 26 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.22 }}
                                    transition={{
                                        duration: 0.6,
                                        delay: index * 0.06,
                                        ease: "easeOut",
                                    }}
                                    className={[
                                        "group relative overflow-hidden rounded-[24px] border bg-white p-6 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.14)] transition-all duration-300 hover:-translate-y-1",
                                        style.border,
                                    ].join(" ")}
                                >
                                    <div
                                        className={`absolute inset-0 bg-gradient-to-br ${style.softBg} opacity-80`}
                                    />
                                    <div className="relative">
                                        <div
                                            className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${style.iconWrap} text-base shadow-lg transition duration-500 group-hover:scale-110 group-hover:rotate-3`}
                                        >
                                            <i className={item.iconClass} />
                                        </div>

                                        <p
                                            className={`mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] ${style.label}`}
                                        >
                                            {item.label}
                                        </p>

                                        <h3 className="mt-1 text-lg font-semibold text-slate-900">
                                            {item.title}
                                        </h3>

                                        <p className="mt-2 text-sm leading-7 text-slate-600 md:text-[15px]">
                                            {item.description}
                                        </p>

                                        <div className="mt-5 space-y-3">
                                            {item.points?.map((point, pointIndex) => (
                                                <div
                                                    key={`${item.title}-point-${pointIndex}`}
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
            </section>

            <section
                id="experience-journey"
                className="px-4 py-16 sm:px-6 md:py-20 lg:px-8"
            >
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

                    <div className="relative mt-12">
                        <div className="absolute left-[22px] top-0 h-full w-px bg-gradient-to-b from-amber-200 via-amber-300 to-orange-200 md:hidden" />
                        <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-amber-200 via-amber-300 to-orange-200 md:block" />

                        <div className="space-y-6 md:space-y-8">
                            {data.journey.steps.map((step, index) => {
                                const isLeft = index % 2 === 0;
                                const style = pillarCardStyles[index % pillarCardStyles.length];

                                return (
                                    <motion.div
                                        key={`${step.title}-${index}`}
                                        initial={{ opacity: 0, y: 24 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, amount: 0.18 }}
                                        transition={{
                                            duration: 0.6,
                                            delay: index * 0.05,
                                            ease: "easeOut",
                                        }}
                                        className="relative"
                                    >
                                        <div className="md:grid md:grid-cols-2 md:gap-10 lg:gap-14">
                                            <div className={isLeft ? "md:pr-4" : "md:invisible"}>
                                                <article
                                                    className={[
                                                        "relative ml-12 rounded-[24px] border bg-white p-5 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.14)] md:ml-0",
                                                        style.border,
                                                    ].join(" ")}
                                                >
                                                    <div
                                                        className={`absolute inset-0 rounded-[24px] bg-gradient-to-br ${style.softBg} opacity-70`}
                                                    />
                                                    <div className="relative">
                                                        <div
                                                            className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${style.iconWrap} text-sm shadow-lg`}
                                                        >
                                                            <i className={step.iconClass} />
                                                        </div>

                                                        <p
                                                            className={`mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] ${style.label}`}
                                                        >
                                                            {step.number}
                                                        </p>
                                                        <h3 className="mt-1 text-lg font-semibold text-slate-900 md:text-xl">
                                                            {step.title}
                                                        </h3>
                                                        <p className="mt-3 text-sm leading-7 text-slate-600">
                                                            {step.description}
                                                        </p>
                                                    </div>
                                                </article>
                                            </div>

                                            <div className={!isLeft ? "md:pl-4" : "md:invisible"}>
                                                <article
                                                    className={[
                                                        "relative ml-12 rounded-[24px] border bg-white p-5 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.14)] md:ml-0",
                                                        style.border,
                                                    ].join(" ")}
                                                >
                                                    <div
                                                        className={`absolute inset-0 rounded-[24px] bg-gradient-to-br ${style.softBg} opacity-70`}
                                                    />
                                                    <div className="relative">
                                                        <div
                                                            className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${style.iconWrap} text-sm shadow-lg`}
                                                        >
                                                            <i className={step.iconClass} />
                                                        </div>

                                                        <p
                                                            className={`mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] ${style.label}`}
                                                        >
                                                            {step.number}
                                                        </p>
                                                        <h3 className="mt-1 text-lg font-semibold text-slate-900 md:text-xl">
                                                            {step.title}
                                                        </h3>
                                                        <p className="mt-3 text-sm leading-7 text-slate-600">
                                                            {step.description}
                                                        </p>
                                                    </div>
                                                </article>
                                            </div>
                                        </div>

                                        <div className="absolute left-[22px] top-10 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full border-4 border-white bg-amber-400 shadow-[0_0_0_6px_rgba(251,191,36,0.14)] md:left-1/2">
                                            <span className="block h-1.5 w-1.5 rounded-full bg-white" />
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            <section className="px-4 py-16 sm:px-6 md:py-20 lg:px-8">
                <div className="mx-auto max-w-6xl">
                    <div className="grid items-start gap-8 lg:grid-cols-[1fr_0.95fr] lg:gap-12">
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.22 }}
                            transition={{ duration: 0.65, ease: "easeOut" }}
                        >
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700 md:text-sm">
                                {data.philosophy.badge}
                            </p>
                            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                                {data.philosophy.title}
                            </h2>
                            <p className="mt-5 text-sm leading-8 text-slate-600 md:text-base">
                                {data.philosophy.description}
                            </p>

                            <div className="mt-8 rounded-[1.75rem] border border-amber-200/70 bg-white/80 p-6 shadow-[0_24px_70px_-35px_rgba(245,158,11,0.45)] backdrop-blur-sm">
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700 md:text-sm">
                                    {data.philosophy.quoteLabel}
                                </p>
                                <p className="mt-3 text-lg font-medium leading-8 text-slate-800 md:text-[1.35rem] md:leading-9">
                                    {data.philosophy.quote}
                                </p>
                                <div className="mt-4 h-px w-full bg-gradient-to-r from-amber-300 via-yellow-300 to-transparent" />
                                <p className="mt-4 text-sm leading-7 text-slate-500">
                                    {data.philosophy.bottomNote}
                                </p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.22 }}
                            transition={{ duration: 0.65, delay: 0.06, ease: "easeOut" }}
                            className="grid gap-4"
                        >
                            {data.philosophy.cards.map((card, index) => {
                                const style =
                                    philosophyCardStyles[index % philosophyCardStyles.length];

                                return (
                                    <div
                                        key={`${card.title}-${index}`}
                                        className="group relative overflow-hidden rounded-[24px] border border-white/70 bg-white p-5 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.14)]"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-white via-amber-50/30 to-orange-50/40 opacity-90" />
                                        <div className="relative flex items-start gap-4">
                                            <div
                                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${style.iconWrap} text-sm shadow-lg transition duration-500 group-hover:scale-110 group-hover:rotate-3`}
                                            >
                                                <i className={card.iconClass} />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-semibold text-slate-900 md:text-lg">
                                                    {card.title}
                                                </h3>
                                                <p className="mt-2 text-sm leading-7 text-slate-600 md:text-[15px]">
                                                    {card.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </motion.div>
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
}

export { cmsDataDefault as cmsData };
