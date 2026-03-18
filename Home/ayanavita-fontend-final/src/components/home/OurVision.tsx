import React from "react";

export interface VisionSectionCmsData {
    badge: string;
    title: string;
    highlight: string;
    paragraphs: string[];
    statementLabel: string;
    statement: string;
    sideLabel: string;
    sideTitle: string;
    sideDescription: string;
    metrics: Array<{
        label: string;
        value: string;
    }>;
    deco: {
        mainIcon: string;
        sideIcon: string;
    };
}

export const cmsDataDefault: VisionSectionCmsData = {
    badge: "Our Vision",
    title: "A bold vision for the future of wellness",
    highlight: "future of wellness",
    paragraphs: [
        "Thế giới đang bước vào một thời đại mới, nơi con người quan tâm nhiều hơn đến sức khỏe, năng lượng và chất lượng cuộc sống.",
        "AYANAVITA được xây dựng với tầm nhìn trở thành một nền tảng wellness giúp hàng triệu người hiểu rõ cơ thể của mình và xây dựng một cuộc sống cân bằng hơn.",
        "Chúng tôi tin rằng wellness không chỉ là một dịch vụ, mà là một phần quan trọng của cuộc sống hiện đại.",
        "Thông qua các trải nghiệm cá nhân hóa, hệ sinh thái đối tác và cộng đồng wellness toàn cầu, AYANAVITA hướng tới việc tạo ra một nền tảng có thể mang lại giá trị cho hàng triệu người trên thế giới.",
    ],
    statementLabel: "Vision Statement",
    statement:
        "AYANAVITA hướng tới việc trở thành một trong những nền tảng wellness có ảnh hưởng lớn nhất trong kỷ nguyên mới của chăm sóc sức khỏe và phong cách sống.",
    sideLabel: "10 BILLION WELLNESS VISION",
    sideTitle: "Building a wellness platform with global impact",
    sideDescription:
        "Một hệ sinh thái wellness hiện đại, kết nối trải nghiệm cá nhân hóa, đối tác chất lượng và cộng đồng toàn cầu trong một hành trình phát triển bền vững.",
    metrics: [
        { label: "Personalized experiences", value: "01" },
        { label: "Partner ecosystem", value: "02" },
        { label: "Global community", value: "03" },
    ],
    deco: {
        mainIcon: "fa-solid fa-crown",
        sideIcon: "fa-solid fa-globe",
    },
};

export interface VisionSectionProps {
    cmsData?: Partial<VisionSectionCmsData>;
    className?: string;
}

const VisionSection: React.FC<VisionSectionProps> = ({
                                                         cmsData,
                                                         className = "",
                                                     }) => {
    const data: VisionSectionCmsData = {
        ...cmsDataDefault,
        ...cmsData,
        paragraphs: cmsData?.paragraphs ?? cmsDataDefault.paragraphs,
        metrics: cmsData?.metrics ?? cmsDataDefault.metrics,
        deco: {
            ...cmsDataDefault.deco,
            ...(cmsData?.deco ?? {}),
        },
    };

    const titleParts = data.title.includes(data.highlight)
        ? data.title.split(data.highlight)
        : [data.title, ""];

    return (
        <section
            className={[
                "relative isolate overflow-hidden bg-gradient-to-b from-[#fffdf8] via-amber-50/40 to-[#fff7eb] py-20 md:py-28",
                className,
            ].join(" ")}
        >
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute left-0 top-12 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl" />
                <div className="absolute right-0 top-16 h-80 w-80 rounded-full bg-yellow-300/18 blur-3xl" />
                <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-orange-200/18 blur-3xl" />
            </div>

            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="grid items-start gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
                    <div className="relative overflow-hidden rounded-[2rem] border border-amber-200/70 bg-white/80 p-6 shadow-[0_26px_80px_-38px_rgba(180,120,20,0.35)] backdrop-blur-sm md:p-8 lg:p-10">
                        <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-amber-100/40" />
                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-3 rounded-full border border-amber-300/60 bg-white/90 px-4 py-2 shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 via-yellow-400 to-orange-400 text-white shadow-lg shadow-amber-500/25">
                  <i className={data.deco.mainIcon} />
                </span>
                                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-800 sm:text-sm">
                  {data.badge}
                </span>
                            </div>

                            <h2 className="mt-6 text-3xl font-semibold leading-[1.08] tracking-tight text-slate-900 sm:text-4xl lg:text-[3.2rem]">
                                {titleParts[0]}
                                {data.title.includes(data.highlight) ? (
                                    <span className="bg-gradient-to-r from-amber-700 via-yellow-600 to-orange-500 bg-clip-text text-transparent">
                    {data.highlight}
                  </span>
                                ) : null}
                                {titleParts[1]}
                            </h2>

                            <div className="mt-6 space-y-4 text-base leading-8 text-slate-600 md:text-lg">
                                {data.paragraphs.map((paragraph, index) => (
                                    <p key={index}>{paragraph}</p>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="relative overflow-hidden rounded-[2rem] border border-amber-300/60 bg-gradient-to-br from-[#2b2111] via-[#3a2a12] to-[#5a4016] p-6 text-white shadow-[0_30px_90px_-35px_rgba(146,98,18,0.48)] md:p-8">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,220,140,0.24),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_30%)]" />
                            <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full border border-white/10 bg-white/5 blur-2xl" />
                            <div className="absolute bottom-0 right-0 text-amber-200/10">
                                <i className={`${data.deco.sideIcon} text-[8rem]`} />
                            </div>

                            <div className="relative z-10">
                                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-200/90">
                                    {data.sideLabel}
                                </p>
                                <h3 className="mt-4 max-w-sm text-2xl font-semibold leading-tight md:text-[1.9rem]">
                                    {data.sideTitle}
                                </h3>
                                <p className="mt-4 max-w-md text-sm leading-7 text-amber-50/85 md:text-[15px]">
                                    {data.sideDescription}
                                </p>

                                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                                    {data.metrics.map((metric, index) => (
                                        <div
                                            key={`${metric.label}-${index}`}
                                            className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm"
                                        >
                                            <div className="text-2xl font-semibold text-amber-200">
                                                {metric.value}
                                            </div>
                                            <div className="mt-2 text-sm leading-6 text-white/78">
                                                {metric.label}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[1.75rem] border border-amber-300/60 bg-white/85 p-6 shadow-[0_22px_70px_-38px_rgba(180,120,20,0.35)] backdrop-blur-sm">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-800 md:text-sm">
                                {data.statementLabel}
                            </p>
                            <p className="mt-3 text-lg font-medium leading-8 text-slate-800 md:text-[1.35rem] md:leading-9">
                                {data.statement}
                            </p>
                            <div className="mt-5 h-px w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-transparent" />
                            <p className="mt-4 text-sm leading-7 text-slate-500">
                                AYANAVITA theo đuổi một định hướng dài hạn: biến wellness trở thành một phần thiết yếu của cuộc sống hiện đại, thay vì chỉ là một lựa chọn ngắn hạn.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default VisionSection;
