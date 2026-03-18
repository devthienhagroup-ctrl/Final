import React from "react";

export interface PhilosophySectionCmsData {
    badge: string;
    title: string;
    highlight: string;
    paragraphs: string[];
    quoteLabel: string;
    quote: string;
    bottomNote: string;
    imageUrl: string;
    imageAlt: string;
    deco: {
        mainIcon: string;
    };
}

export const cmsDataDefault: PhilosophySectionCmsData = {
    badge: "The AYANAVITA Philosophy",
    title: "Hiểu chính mình để chăm sóc đúng cách",
    highlight: "chính mình",
    paragraphs: [
        "Tại AYANAVITA, chúng tôi tin rằng sức khỏe thật sự bắt đầu từ việc hiểu chính mình.",
        "Mỗi người có cơ thể, lối sống và nguồn năng lượng khác nhau, nên chăm sóc sức khỏe không thể là một công thức chung cho tất cả.",
        "Chúng tôi hướng đến những trải nghiệm wellness được cá nhân hóa, giúp bạn lắng nghe cơ thể, khôi phục sự cân bằng và nuôi dưỡng sức khỏe theo cách bền vững hơn.",
    ],
    quoteLabel: "Philosophy",
    quote:
        "Lắng nghe cơ thể • Khôi phục cân bằng • Nuôi dưỡng sức khỏe lâu dài",
    bottomNote:
        "Một hành trình wellness tinh tế bắt đầu từ sự thấu hiểu, thay vì áp dụng cùng một cách chăm sóc cho mọi người.",
    imageUrl:
        "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1400&q=80",
    imageAlt: "Không gian wellness nhẹ nhàng và thư giãn",
    deco: {
        mainIcon: "fa-solid fa-spa",
    },
};

export interface PhilosophySectionProps {
    cmsData?: Partial<PhilosophySectionCmsData>;
    className?: string;
}

const PhilosophySection: React.FC<PhilosophySectionProps> = ({
                                                                 cmsData,
                                                                 className = "",
                                                             }) => {
    const data: PhilosophySectionCmsData = {
        ...cmsDataDefault,
        ...cmsData,
        paragraphs: cmsData?.paragraphs ?? cmsDataDefault.paragraphs,
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
                "relative isolate overflow-hidden bg-gradient-to-b from-white via-amber-50/30 to-orange-50/40 py-20 md:py-28",
                className,
            ].join(" ")}
        >
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute left-0 top-10 h-64 w-64 rounded-full bg-amber-200/30 blur-3xl" />
                <div className="absolute right-0 top-24 h-72 w-72 rounded-full bg-orange-200/25 blur-3xl" />
                <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-yellow-200/20 blur-3xl" />
            </div>

            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.95fr] lg:gap-14">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-3 rounded-full border border-amber-200/70 bg-white/85 px-4 py-2 shadow-sm backdrop-blur">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-400 text-slate-900 shadow-lg shadow-amber-400/30">
                <i className={data.deco.mainIcon} />
              </span>
                            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 sm:text-sm">
                {data.badge}
              </span>
                        </div>

                        <h2 className="mt-6 text-3xl font-semibold leading-[1.15] tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                            {titleParts[0]}
                            {data.title.includes(data.highlight) ? (
                                <span className="bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 bg-clip-text text-transparent">
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

                    <div className="relative">
                        <div className="absolute -left-4 top-10 hidden h-24 w-24 rounded-full bg-amber-300/20 blur-2xl lg:block" />
                        <div className="absolute -right-4 bottom-10 hidden h-28 w-28 rounded-full bg-orange-300/20 blur-2xl lg:block" />

                        <div className="group relative overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_30px_90px_-35px_rgba(15,23,42,0.2)]">
                            <div className="absolute inset-0 bg-gradient-to-tr from-amber-300/10 via-transparent to-orange-300/10" />
                            <img
                                src={data.imageUrl}
                                alt={data.imageAlt}
                                className="h-[360px] w-full object-cover transition duration-700 group-hover:scale-[1.03] md:h-[460px]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-slate-900/5 to-transparent" />
                        </div>
                    </div>

                </div>
                <div className="mt-8 rounded-[1.75rem] border border-amber-200/70 bg-white/80 p-6 shadow-[0_24px_70px_-35px_rgba(245,158,11,0.45)] backdrop-blur-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700 md:text-sm">
                        {data.quoteLabel}
                    </p>
                    <p className="mt-3 text-lg font-medium leading-8 text-slate-800 md:text-[1.35rem] md:leading-9">
                        {data.quote}
                    </p>
                    <div className="mt-4 h-px w-full bg-gradient-to-r from-amber-300 via-yellow-300 to-transparent" />
                    <p className="mt-4 text-sm leading-7 text-slate-500">
                        {data.bottomNote}
                    </p>
                </div>
            </div>
        </section>
    );
};

export default PhilosophySection;
