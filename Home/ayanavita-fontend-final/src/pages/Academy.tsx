// src/pages/academy/AyanavitaAcademyPage.tsx
import React from "react";
import { motion } from "framer-motion";

type IconTextItem = {
    key?: string;
    label?: string;
    title?: string;
    description?: string;
    iconClass?: string;
};

type ActionItem = {
    label?: string;
    href?: string;
    variant?: "primary" | "secondary" | "btn-primary";
};

type HeroPreviewItem = {
    key?: string;
    title?: string;
    subtitle?: string;
    iconClass?: string;
};

type HeroData = {
    badge?: string;
    title?: string;
    highlight?: string;
    description?: string;
    pills?: string[];
    actions?: ActionItem[];
    previewBadge?: string;
    previewTitle?: string;
    previewItems?: HeroPreviewItem[];
    previewNote?: string;
};

type AudienceData = {
    badge?: string;
    title?: string;
    description?: string;
    items?: IconTextItem[];
};

type CourseShelfCard = {
    key?: string;
    label?: string;
    title?: string;
    description?: string;
    iconClass?: string;
    meta?: string;
    bullets?: string[];
};

type ShelvesData = {
    badge?: string;
    title?: string;
    description?: string;
    featuredCourse?: CourseShelfCard;
    sideCourses?: CourseShelfCard[];
};

type FlowStep = {
    key?: string;
    number?: string;
    title?: string;
    description?: string;
    iconClass?: string;
};

type FlowData = {
    badge?: string;
    title?: string;
    description?: string;
    steps?: FlowStep[];
};

type EcosystemData = {
    badge?: string;
    title?: string;
    description?: string;
    quoteLabel?: string;
    quote?: string;
    features?: IconTextItem[];
};

type CertificationData = {
    badge?: string;
    title?: string;
    description?: string;
    points?: string[];
    primaryActionLabel?: string;
    primaryActionHref?: string;
};

type ClosingData = {
    title?: string;
    description?: string;
    primaryButtonLabel?: string;
    primaryButtonHref?: string;
    secondaryButtonLabel?: string;
    secondaryButtonHref?: string;
};

export type AyanavitaAcademyPageCmsData = {
    hero?: HeroData;
    audience?: AudienceData;
    shelves?: ShelvesData;
    flow?: FlowData;
    ecosystem?: EcosystemData;
    certification?: CertificationData;
    closing?: ClosingData;
};

type AyanavitaAcademyPageProps = {
    cmsData?: Partial<AyanavitaAcademyPageCmsData>;
    className?: string;
};

export const cmsDataDefault: AyanavitaAcademyPageCmsData = {
    hero: {
        badge: "AYANAVITA Academy",
        title: "A modern wellness academy built for learning, practice and long-term growth",
        highlight: "learning, practice and long-term growth",
        description:
            "AYANAVITA Academy là không gian học tập trực tuyến dành cho những ai muốn tiếp cận wellness theo cách rõ ràng hơn, bài bản hơn và dễ ứng dụng hơn. Tại đây, người học có thể khám phá khóa học, mua chương trình phù hợp, học trực tuyến ngay trên website và từng bước xây dựng kiến thức cùng kỹ năng theo một lộ trình tinh gọn hơn.",
        pills: [
            "Professional Training",
            "Wellness Education",
            "Certification Programs",
        ],
        actions: [
            {
                label: "Browse Courses",
                href: "/courses",
                variant: "btn-primary",
            },
            {
                label: "How It Works",
                href: "#academy-flow",
                variant: "secondary",
            },
        ],
        previewBadge: "Online Academy Experience",
        previewTitle: "A simpler way to explore and study on the platform",
        previewItems: [
            {
                key: "discover",
                title: "Discover a course",
                subtitle: "Tìm chương trình phù hợp với nhu cầu học tập hoặc định hướng phát triển.",
                iconClass: "fa-solid fa-magnifying-glass",
            },
            {
                key: "purchase",
                title: "Purchase & unlock access",
                subtitle: "Mua khóa học trực tuyến và truy cập nội dung học tập ngay trên website.",
                iconClass: "fa-solid fa-cart-shopping",
            },
            {
                key: "learn",
                title: "Learn at your own pace",
                subtitle: "Theo dõi tiến độ, quay lại bài học và học theo nhịp độ phù hợp với bản thân.",
                iconClass: "fa-solid fa-laptop-file",
            },
        ],
        previewNote:
            "AYANAVITA Academy không chỉ là nơi đặt bài giảng, mà là một trải nghiệm học tập được thiết kế để rõ ràng, tinh tế và dễ tiếp tục hơn.",
    },

    audience: {
        badge: "WHO ACADEMY IS FOR",
        title: "Một nền tảng dành cho nhiều giai đoạn học tập khác nhau",
        description:
            "AYANAVITA Academy được xây dựng cho những người muốn tiếp cận wellness một cách nghiêm túc hơn — dù là để hiểu bản thân tốt hơn, nâng cao kỹ năng chuyên môn hay hoàn thiện một lộ trình đào tạo có chiều sâu.",
        items: [
            {
                key: "self-learners",
                label: "01 · Self Learners",
                title: "Người muốn hiểu wellness cho chính mình",
                description:
                    "Phù hợp với người muốn học để chăm sóc bản thân tốt hơn, hiểu hơn về cơ thể, lối sống và sự cân bằng dài hạn.",
                iconClass: "fa-solid fa-heart-pulse",
            },
            {
                key: "professionals",
                label: "02 · Professionals",
                title: "Người muốn nâng cao chuyên môn",
                description:
                    "Dành cho cá nhân muốn tiếp cận các chương trình đào tạo thực tế hơn để ứng dụng vào công việc, dịch vụ hoặc hoạt động tư vấn.",
                iconClass: "fa-solid fa-user-graduate",
            },
            {
                key: "future-builders",
                label: "03 · Future Builders",
                title: "Người muốn xây dựng định hướng lâu dài",
                description:
                    "Phù hợp với người học muốn đi xa hơn từ kiến thức nền tảng đến những cột mốc chứng nhận và phát triển chuyên môn bền vững.",
                iconClass: "fa-solid fa-seedling",
            },
        ],
    },

    shelves: {
        badge: "FEATURED LEARNING SHELVES",
        title: "Các nhóm khóa học được tổ chức như một learning library",
        description:
            "Thay vì trình bày mọi thứ như một timeline giống trang trước, Academy được chia thành những cụm nội dung rõ ràng hơn để người học dễ khám phá khóa học phù hợp với mình.",
        featuredCourse: {
            key: "professional-training",
            label: "Professional Training",
            title: "Professional Training",
            description:
                "Những chương trình đào tạo chuyên sâu dành cho người muốn xây dựng nền tảng làm việc bài bản hơn trong lĩnh vực wellness, trải nghiệm dịch vụ hoặc vận hành chương trình.",
            iconClass: "fa-solid fa-briefcase",
            meta: "Structured • Applied • Career-Oriented",
            bullets: [
                "Đào tạo theo hướng thực tế và có tính ứng dụng cao",
                "Hỗ trợ xây dựng tư duy chuyên môn và quy trình làm việc rõ ràng",
                "Phù hợp cho người muốn đi sâu hơn vào lĩnh vực wellness",
            ],
        },
        sideCourses: [
            {
                key: "wellness-education",
                label: "Wellness Education",
                title: "Wellness Education",
                description:
                    "Những khóa học giúp người học tiếp cận kiến thức wellness theo cách dễ hiểu, gần gũi và có thể áp dụng vào đời sống hằng ngày.",
                iconClass: "fa-solid fa-spa",
                meta: "Accessible • Insightful • Practical",
                bullets: [
                    "Phù hợp cho người mới bắt đầu",
                    "Tập trung vào hiểu biết nền tảng và ứng dụng thực tế",
                ],
            },
            {
                key: "certification-programs",
                label: "Certification Programs",
                title: "Certification Programs",
                description:
                    "Các chương trình chứng nhận giúp người học hoàn thiện hành trình học tập rõ ràng hơn và đánh dấu những cột mốc phát triển chuyên môn.",
                iconClass: "fa-solid fa-certificate",
                meta: "Milestones • Credibility • Progress",
                bullets: [
                    "Hoàn thiện lộ trình học tập có mục tiêu",
                    "Tạo dấu mốc phát triển chuyên môn dài hạn",
                ],
            },
        ],
    },

    flow: {
        badge: "THE LEARNING FLOW",
        title: "Một flow học tập ngang, đơn giản và liền mạch",
        description:
            "Thay vì dựng center timeline như trang trước, phần này chuyển sang dạng flow ngang để nhấn mạnh trải nghiệm liền mạch của nền tảng học trực tuyến.",
        steps: [
            {
                key: "discover",
                number: "01",
                title: "Explore",
                description:
                    "Khám phá các nhóm khóa học và chương trình phù hợp với nhu cầu hoặc mục tiêu học tập.",
                iconClass: "fa-solid fa-compass",
            },
            {
                key: "enroll",
                number: "02",
                title: "Enroll",
                description:
                    "Mua khóa học trực tuyến và mở quyền truy cập nội dung học tập ngay trên website.",
                iconClass: "fa-solid fa-credit-card",
            },
            {
                key: "study",
                number: "03",
                title: "Study",
                description:
                    "Học theo từng bài, theo dõi tiến độ và quay lại nội dung bất cứ khi nào cần.",
                iconClass: "fa-solid fa-book-open-reader",
            },
            {
                key: "grow",
                number: "04",
                title: "Grow",
                description:
                    "Tiếp tục phát triển sang các cấp độ học tập hoặc chương trình chứng nhận tiếp theo.",
                iconClass: "fa-solid fa-arrow-trend-up",
            },
        ],
    },

    ecosystem: {
        badge: "THE ACADEMY ECOSYSTEM",
        title: "Một hệ học tập được thiết kế để người học cảm thấy dễ tiếp cận hơn",
        description:
            "AYANAVITA Academy được xây dựng như một learning ecosystem, nơi nội dung, trải nghiệm nền tảng và định hướng phát triển lâu dài được kết nối với nhau thay vì hoạt động rời rạc.",
        quoteLabel: "Academy Philosophy",
        quote:
            "Learn with clarity • Practice with purpose • Keep growing with long-term value",
        features: [
            {
                key: "structured-content",
                label: "Structured Content",
                title: "Nội dung được tổ chức rõ ràng",
                description:
                    "Bài học, cụm khóa học và lộ trình được sắp xếp để người học dễ theo dõi và ít bị choáng ngợp hơn.",
                iconClass: "fa-solid fa-layer-group",
            },
            {
                key: "online-flexibility",
                label: "Flexible Access",
                title: "Học trực tuyến theo nhịp độ riêng",
                description:
                    "Người học có thể truy cập nội dung trên website và học vào thời gian phù hợp hơn với mình.",
                iconClass: "fa-solid fa-globe",
            },
            {
                key: "ongoing-growth",
                label: "Long-term Growth",
                title: "Tiếp tục phát triển sau mỗi khóa học",
                description:
                    "Mỗi khóa học không chỉ là một điểm kết thúc, mà là bước mở sang những cấp độ học tập sâu hơn.",
                iconClass: "fa-solid fa-seedling",
            },
            {
                key: "guided-experience",
                label: "Guided Experience",
                title: "Trải nghiệm học tập có định hướng",
                description:
                    "Mọi phần trong Academy đều hướng tới việc giúp người học cảm thấy rõ ràng hơn về bước tiếp theo của mình.",
                iconClass: "fa-solid fa-route",
            },
        ],
    },

    certification: {
        badge: "CERTIFICATION SPOTLIGHT",
        title: "Chứng nhận như một cột mốc phát triển thay vì chỉ là phần thưởng cuối khóa",
        description:
            "Các chương trình Certification của AYANAVITA Academy hướng tới việc ghi nhận quá trình học tập nghiêm túc, đồng thời tạo thêm động lực để người học tiếp tục phát triển kiến thức và kỹ năng theo định hướng dài hạn hơn.",
        points: [
            "Đánh dấu những cột mốc học tập rõ ràng hơn",
            "Tăng sự tự tin và tính chuyên nghiệp cho hành trình phát triển",
            "Mở ra bước tiếp theo cho việc học sâu hơn hoặc mở rộng định hướng nghề nghiệp",
        ],
        primaryActionLabel: "View Certification Paths",
        primaryActionHref: "#",
    },

    closing: {
        title: "Begin your learning journey with AYANAVITA Academy",
        description:
            "Dù bạn đang tìm kiếm một khóa học để hiểu rõ hơn về wellness, một chương trình đào tạo để nâng cao chuyên môn hay một hành trình chứng nhận để phát triển dài hạn, AYANAVITA Academy luôn hướng tới một trải nghiệm học tập trực tuyến rõ ràng, hiện đại và có giá trị thực tế hơn.",
        primaryButtonLabel: "Browse All Courses",
        primaryButtonHref: "#",
        secondaryButtonLabel: "Contact Academy",
        secondaryButtonHref: "#",
    },
};

const cardStyles = [
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
        softBg: "from-amber-50 via-white to-orange-50/70",
        dot: "bg-amber-500",
    },
    {
        iconWrap:
            "from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-emerald-500/30",
        border:
            "border-emerald-100 hover:border-emerald-200 hover:shadow-[0_20px_50px_-24px_rgba(16,185,129,0.20)]",
        label: "text-emerald-600",
        softBg: "from-emerald-50 via-white to-cyan-50/70",
        dot: "bg-emerald-500",
    },
    {
        iconWrap:
            "from-rose-500 via-pink-500 to-fuchsia-500 text-white shadow-rose-400/30",
        border:
            "border-rose-100 hover:border-rose-200 hover:shadow-[0_20px_50px_-24px_rgba(244,63,94,0.18)]",
        label: "text-rose-600",
        softBg: "from-rose-50 via-white to-fuchsia-50/60",
        dot: "bg-rose-500",
    },
] as const;

function mergeCmsData(
    cmsData?: Partial<AyanavitaAcademyPageCmsData>,
): AyanavitaAcademyPageCmsData {
    return {
        hero: {
            ...cmsDataDefault.hero,
            ...(cmsData?.hero ?? {}),
            pills: cmsData?.hero?.pills ?? cmsDataDefault.hero?.pills ?? [],
            actions: cmsData?.hero?.actions ?? cmsDataDefault.hero?.actions ?? [],
            previewItems:
                cmsData?.hero?.previewItems ?? cmsDataDefault.hero?.previewItems ?? [],
        },
        audience: {
            ...cmsDataDefault.audience,
            ...(cmsData?.audience ?? {}),
            items: cmsData?.audience?.items ?? cmsDataDefault.audience?.items ?? [],
        },
        shelves: {
            ...cmsDataDefault.shelves,
            ...(cmsData?.shelves ?? {}),
            featuredCourse:
                cmsData?.shelves?.featuredCourse ??
                cmsDataDefault.shelves?.featuredCourse,
            sideCourses:
                cmsData?.shelves?.sideCourses ?? cmsDataDefault.shelves?.sideCourses ?? [],
        },
        flow: {
            ...cmsDataDefault.flow,
            ...(cmsData?.flow ?? {}),
            steps: cmsData?.flow?.steps ?? cmsDataDefault.flow?.steps ?? [],
        },
        ecosystem: {
            ...cmsDataDefault.ecosystem,
            ...(cmsData?.ecosystem ?? {}),
            features:
                cmsData?.ecosystem?.features ?? cmsDataDefault.ecosystem?.features ?? [],
        },
        certification: {
            ...cmsDataDefault.certification,
            ...(cmsData?.certification ?? {}),
            points:
                cmsData?.certification?.points ??
                cmsDataDefault.certification?.points ??
                [],
        },
        closing: {
            ...cmsDataDefault.closing,
            ...(cmsData?.closing ?? {}),
        },
    };
}

function renderTitleWithHighlight(title?: string, highlight?: string) {
    if (!title || !highlight || !title.includes(highlight)) return title;

    const [before, after] = title.split(highlight);

    return (
        <>
            {before}
            <span className="bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 bg-clip-text text-transparent">
        {highlight}
      </span>
            {after}
        </>
    );
}

function getActionClass(variant?: "primary" | "secondary" | "btn-primary") {
    if (variant === "secondary") {
        return "border border-amber-200/80 bg-white/90 text-slate-700 hover:bg-white";
    }
    if (variant === "btn-primary") {
        return "btn-primary"
    }

    return "bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 text-slate-900 hover:opacity-95";
}

export default function AyanavitaAcademyPage({
                                                 cmsData,
                                                 className = "",
                                             }: AyanavitaAcademyPageProps) {
    const data = mergeCmsData(cmsData);

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
                <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.12fr_0.88fr] lg:gap-14">
                    <motion.div
                        initial={{ opacity: 0, y: 26 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.25 }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                    >
                        <div className="inline-flex items-center gap-3 rounded-full border border-amber-200/70 bg-white/85 px-4 py-2 shadow-sm backdrop-blur">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-400 text-slate-900 shadow-lg shadow-amber-400/30">
                <i className="fa-solid fa-graduation-cap" />
              </span>
                            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 sm:text-sm">
                {data.hero?.badge}
              </span>
                        </div>

                        <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                            {renderTitleWithHighlight(data.hero?.title, data.hero?.highlight)}
                        </h1>

                        <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600 md:text-lg">
                            {data.hero?.description}
                        </p>

                        <div className="mt-7 flex flex-wrap gap-3">
                            {data.hero?.pills?.map((pill) => (
                                <div
                                    key={pill}
                                    className="rounded-full border border-amber-200/70 bg-white/85 px-4 py-2 text-sm text-slate-700 shadow-sm backdrop-blur"
                                >
                                    {pill}
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 flex flex-wrap gap-3">
                            {data.hero?.actions?.map((action) => (
                                <a
                                    key={action.label}
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

                        <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white p-6 shadow-[0_30px_90px_-35px_rgba(15,23,42,0.2)] md:p-7">
                            <div className="absolute inset-0 bg-gradient-to-tr from-amber-300/10 via-transparent to-orange-300/10" />

                            <div className="relative">
                                <div className="flex items-center justify-between">
                                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
                                        {data.hero?.previewBadge}
                                    </div>
                                    <div className="rounded-full border border-amber-200/70 bg-amber-50/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                                        Academy
                                    </div>
                                </div>

                                <h2 className="mt-6 text-xl font-semibold text-slate-900 md:text-2xl">
                                    {data.hero?.previewTitle}
                                </h2>

                                <div className="mt-6 space-y-4">
                                    {data.hero?.previewItems?.map((item, index) => {
                                        const style = cardStyles[index % cardStyles.length];

                                        return (
                                            <div
                                                key={item.key ?? item.title}
                                                className="rounded-[1.4rem] border border-white/70 bg-white/85 p-4 shadow-sm"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div
                                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${style.iconWrap} text-sm shadow-lg`}
                                                    >
                                                        <i className={item.iconClass} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-800">
                                                            {item.title}
                                                        </p>
                                                        <p className="mt-1 text-sm leading-6 text-slate-600">
                                                            {item.subtitle}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="mt-6 rounded-[1.5rem] border border-amber-200/70 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-5">
                                    <p className="text-sm leading-7 text-slate-700">
                                        {data.hero?.previewNote}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            <section className="px-4 py-12 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-6xl">
                    <div className="mx-auto max-w-3xl text-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700 md:text-sm">
                            {data.audience?.badge}
                        </p>
                        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                            {data.audience?.title}
                        </h2>
                        <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
                            {data.audience?.description}
                        </p>
                    </div>

                    <div className="mt-10 grid gap-5 md:grid-cols-3">
                        {data.audience?.items?.map((item, index) => {
                            const style = cardStyles[index % cardStyles.length];

                            return (
                                <motion.article
                                    key={item.key ?? item.title}
                                    initial={{ opacity: 0, y: 24 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.2 }}
                                    transition={{ duration: 0.6, delay: index * 0.06, ease: "easeOut" }}
                                    className={[
                                        "group relative overflow-hidden rounded-[24px] border bg-white p-6 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.14)] transition-all duration-300 hover:-translate-y-1",
                                        style.border,
                                    ].join(" ")}
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-br ${style.softBg} opacity-80`} />
                                    <div className="relative">
                                        <div
                                            className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${style.iconWrap} text-base shadow-lg transition duration-500 group-hover:scale-110 group-hover:rotate-3`}
                                        >
                                            <i className={item.iconClass} />
                                        </div>

                                        <p className={`mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] ${style.label}`}>
                                            {item.label}
                                        </p>
                                        <h3 className="mt-2 text-lg font-semibold text-slate-900 md:text-xl">
                                            {item.title}
                                        </h3>
                                        <p className="mt-3 text-sm leading-7 text-slate-600 md:text-[15px]">
                                            {item.description}
                                        </p>
                                    </div>
                                </motion.article>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section id="academy-shelves" className="px-4 py-16 sm:px-6 md:py-20 lg:px-8">
                <div className="mx-auto max-w-6xl">
                    <div className="max-w-3xl">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700 md:text-sm">
                            {data.shelves?.badge}
                        </p>
                        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                            {data.shelves?.title}
                        </h2>
                        <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
                            {data.shelves?.description}
                        </p>
                    </div>

                    <div className="mt-10 grid gap-5 lg:grid-cols-[1.18fr_0.82fr]">
                        <motion.article
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.2 }}
                            transition={{ duration: 0.65, ease: "easeOut" }}
                            className={[
                                "group relative overflow-hidden rounded-[28px] border bg-white p-7 shadow-[0_18px_45px_-24px_rgba(15,23,42,0.16)]",
                                cardStyles[1].border,
                            ].join(" ")}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${cardStyles[1].softBg} opacity-90`} />
                            <div className="relative">
                                <div
                                    className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${cardStyles[1].iconWrap} text-lg shadow-lg`}
                                >
                                    <i className={data.shelves?.featuredCourse?.iconClass} />
                                </div>

                                <p className={`mt-6 text-[11px] font-semibold uppercase tracking-[0.2em] ${cardStyles[1].label}`}>
                                    {data.shelves?.featuredCourse?.label}
                                </p>
                                <h3 className="mt-2 text-2xl font-semibold text-slate-900 md:text-3xl">
                                    {data.shelves?.featuredCourse?.title}
                                </h3>
                                <p className="mt-4 text-sm leading-8 text-slate-600 md:text-base">
                                    {data.shelves?.featuredCourse?.description}
                                </p>

                                <div className="mt-5 inline-flex rounded-full border border-amber-200/70 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                                    {data.shelves?.featuredCourse?.meta}
                                </div>

                                <div className="mt-6 space-y-3">
                                    {data.shelves?.featuredCourse?.bullets?.map((bullet) => (
                                        <div
                                            key={bullet}
                                            className="flex items-start gap-3 rounded-2xl border border-white/80 bg-white/80 px-4 py-3"
                                        >
                                            <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${cardStyles[1].dot}`} />
                                            <p className="text-sm leading-6 text-slate-700">{bullet}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.article>

                        <div className="grid gap-5">
                            {data.shelves?.sideCourses?.map((item, index) => {
                                const style = cardStyles[(index + 2) % cardStyles.length];

                                return (
                                    <motion.article
                                        key={item.key ?? item.title}
                                        initial={{ opacity: 0, y: 24 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, amount: 0.2 }}
                                        transition={{ duration: 0.6, delay: index * 0.06, ease: "easeOut" }}
                                        className={[
                                            "group relative overflow-hidden rounded-[24px] border bg-white p-6 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.14)]",
                                            style.border,
                                        ].join(" ")}
                                    >
                                        <div className={`absolute inset-0 bg-gradient-to-br ${style.softBg} opacity-80`} />
                                        <div className="relative">
                                            <div
                                                className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${style.iconWrap} text-base shadow-lg`}
                                            >
                                                <i className={item.iconClass} />
                                            </div>

                                            <p className={`mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] ${style.label}`}>
                                                {item.label}
                                            </p>
                                            <h3 className="mt-2 text-lg font-semibold text-slate-900 md:text-xl">
                                                {item.title}
                                            </h3>
                                            <p className="mt-3 text-sm leading-7 text-slate-600">
                                                {item.description}
                                            </p>

                                            <div className="mt-4 inline-flex rounded-full border border-white/80 bg-white/85 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                                                {item.meta}
                                            </div>

                                            <div className="mt-4 space-y-2">
                                                {item.bullets?.map((bullet) => (
                                                    <div key={bullet} className="flex items-start gap-3">
                                                        <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${style.dot}`} />
                                                        <p className="text-sm leading-6 text-slate-700">{bullet}</p>
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

            <section id="academy-flow" className="px-4 py-16 sm:px-6 md:py-20 lg:px-8">
                <div className="mx-auto max-w-6xl">
                    <div className="mx-auto max-w-3xl text-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700 md:text-sm">
                            {data.flow?.badge}
                        </p>
                        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                            {data.flow?.title}
                        </h2>
                        <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
                            {data.flow?.description}
                        </p>
                    </div>

                    <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {data.flow?.steps?.map((step, index) => {
                            const style = cardStyles[index % cardStyles.length];
                            const isLast = index === (data.flow?.steps?.length ?? 0) - 1;

                            return (
                                <motion.article
                                    key={step.key ?? step.title}
                                    initial={{ opacity: 0, y: 24 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.18 }}
                                    transition={{ duration: 0.6, delay: index * 0.05, ease: "easeOut" }}
                                    className={[
                                        "group relative overflow-hidden rounded-[24px] border bg-white p-5 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.14)]",
                                        style.border,
                                    ].join(" ")}
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-br ${style.softBg} opacity-80`} />
                                    {!isLast ? (
                                        <div className="pointer-events-none absolute right-[-10px] top-1/2 hidden h-px w-10 -translate-y-1/2 bg-gradient-to-r from-amber-300 to-transparent xl:block" />
                                    ) : null}

                                    <div className="relative">
                                        <div
                                            className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${style.iconWrap} text-sm shadow-lg`}
                                        >
                                            <i className={step.iconClass} />
                                        </div>

                                        <p className={`mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] ${style.label}`}>
                                            {step.number}
                                        </p>
                                        <h3 className="mt-1 text-lg font-semibold text-slate-900">
                                            {step.title}
                                        </h3>
                                        <p className="mt-3 text-sm leading-7 text-slate-600">
                                            {step.description}
                                        </p>
                                    </div>
                                </motion.article>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className="px-4 py-16 sm:px-6 md:py-20 lg:px-8">
                <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.22 }}
                        transition={{ duration: 0.65, ease: "easeOut" }}
                        className="rounded-[28px] border border-amber-200/70 bg-white/85 p-7 shadow-[0_24px_70px_-35px_rgba(245,158,11,0.32)] backdrop-blur-sm"
                    >
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700 md:text-sm">
                            {data.ecosystem?.badge}
                        </p>
                        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                            {data.ecosystem?.title}
                        </h2>
                        <p className="mt-5 text-sm leading-8 text-slate-600 md:text-base">
                            {data.ecosystem?.description}
                        </p>

                        <div className="mt-8 rounded-[24px] border border-amber-200/70 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700 md:text-sm">
                                {data.ecosystem?.quoteLabel}
                            </p>
                            <p className="mt-3 text-lg font-medium leading-8 text-slate-800 md:text-[1.25rem] md:leading-9">
                                {data.ecosystem?.quote}
                            </p>
                        </div>
                    </motion.div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {data.ecosystem?.features?.map((item, index) => {
                            const style = cardStyles[index % cardStyles.length];

                            return (
                                <motion.article
                                    key={item.key ?? item.title}
                                    initial={{ opacity: 0, y: 24 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.18 }}
                                    transition={{ duration: 0.6, delay: index * 0.05, ease: "easeOut" }}
                                    className={[
                                        "group relative overflow-hidden rounded-[24px] border bg-white p-5 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.14)]",
                                        style.border,
                                    ].join(" ")}
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-br ${style.softBg} opacity-75`} />
                                    <div className="relative">
                                        <div
                                            className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${style.iconWrap} text-sm shadow-lg transition duration-500 group-hover:scale-110 group-hover:rotate-3`}
                                        >
                                            <i className={item.iconClass} />
                                        </div>

                                        <p className={`mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] ${style.label}`}>
                                            {item.label}
                                        </p>
                                        <h3 className="mt-2 text-base font-semibold text-slate-900 md:text-lg">
                                            {item.title}
                                        </h3>
                                        <p className="mt-2 text-sm leading-7 text-slate-600 md:text-[15px]">
                                            {item.description}
                                        </p>
                                    </div>
                                </motion.article>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className="px-4 py-10 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-6xl">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.18 }}
                        transition={{ duration: 0.65, ease: "easeOut" }}
                        className="overflow-hidden rounded-[32px] border border-amber-200/70 bg-white/85 p-8 shadow-[0_30px_90px_-35px_rgba(245,158,11,0.28)] backdrop-blur md:p-10"
                    >
                        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700 md:text-sm">
                                    {data.certification?.badge}
                                </p>
                                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                                    {data.certification?.title}
                                </h2>
                                <p className="mt-5 text-sm leading-8 text-slate-600 md:text-base">
                                    {data.certification?.description}
                                </p>
                            </div>

                            <div>
                                <div className="space-y-3">
                                    {data.certification?.points?.map((point) => (
                                        <div
                                            key={point}
                                            className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50/50 px-4 py-3"
                                        >
                                            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                                            <p className="text-sm leading-6 text-slate-700">{point}</p>
                                        </div>
                                    ))}
                                </div>

                                <a
                                    href={data.certification?.primaryActionHref}
                                    className="mt-6 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:opacity-95"
                                >
                                    {data.certification?.primaryActionLabel}
                                </a>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            <section className="px-4 pb-24 pt-10 sm:px-6 md:pb-28 lg:px-8">
                <div className="mx-auto max-w-6xl">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.18 }}
                        transition={{ duration: 0.65, ease: "easeOut" }}
                        className="rounded-[2rem] border border-amber-200/70 bg-white/85 p-8 text-center shadow-[0_30px_90px_-35px_rgba(245,158,11,0.28)] backdrop-blur md:p-12"
                    >
                        <h2 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                            {data.closing?.title}
                        </h2>
                        <p className="mx-auto mt-5 max-w-3xl text-sm leading-8 text-slate-600 md:text-base">
                            {data.closing?.description}
                        </p>

                        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                            <a
                                href={data.closing?.primaryButtonHref}
                                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:opacity-95"
                            >
                                {data.closing?.primaryButtonLabel}
                            </a>
                            <a
                                href={data.closing?.secondaryButtonHref}
                                className="inline-flex items-center justify-center rounded-full border border-amber-200/80 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-amber-50/40"
                            >
                                {data.closing?.secondaryButtonLabel}
                            </a>
                        </div>
                    </motion.div>
                </div>
            </section>
        </main>
    );
}