import React from "react";
import { motion } from "framer-motion";

type JourneyItem = {
    step: string;
    title: string;
    description: string;
    icon: string;
    accent: string;
    soft: string;
    iconBg: string;
    pattern: string;
    cardClass: string;
};

const items: JourneyItem[] = [
    {
        step: "01",
        title: "Wellness Check-in",
        description:
            "Hành trình bắt đầu bằng một trải nghiệm check-in giúp bạn hiểu rõ hơn về cơ thể, làn da và lối sống của mình.",
        icon: "fa-solid fa-heart-pulse",
        accent: "from-indigo-400 via-violet-400 to-purple-500",
        soft: "from-white via-white to-indigo-50/50",
        iconBg:
            "bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-500 text-white shadow-[0_14px_34px_rgba(99,102,241,0.28)]",
        pattern: "text-indigo-200/20",
        cardClass: "xl:col-span-7 xl:row-span-2 min-h-[300px]",
    },
    {
        step: "02",
        title: "Personal Insight",
        description:
            "Từ những thông tin đó, bạn hiểu rõ hơn những yếu tố đang ảnh hưởng đến sức khỏe, năng lượng và sự cân bằng của mình.",
        icon: "fa-solid fa-brain",
        accent: "from-amber-400 via-yellow-400 to-orange-400",
        soft: "from-white via-white to-amber-50/50",
        iconBg:
            "bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-400 text-white shadow-[0_14px_34px_rgba(245,158,11,0.24)]",
        pattern: "text-amber-200/20",
        cardClass: "xl:col-span-5 min-h-[210px] xl:translate-y-8",
    },
    {
        step: "03",
        title: "Personalized Experience",
        description:
            "AYANAVITA gợi ý những trải nghiệm wellness và chăm sóc cá nhân hóa phù hợp với nhu cầu riêng của từng người.",
        icon: "fa-solid fa-spa",
        accent: "from-cyan-400 via-sky-400 to-blue-500",
        soft: "from-white via-white to-cyan-50/50",
        iconBg:
            "bg-gradient-to-br from-cyan-400 via-sky-400 to-blue-500 text-white shadow-[0_14px_34px_rgba(34,211,238,0.22)]",
        pattern: "text-cyan-200/20",
        cardClass: "xl:col-span-3 min-h-[220px] xl:-translate-y-2",
    },
    {
        step: "04",
        title: "Long-term Support",
        description:
            "Theo thời gian, bạn có thể tiếp tục khám phá thêm chương trình, sản phẩm và trải nghiệm mới để duy trì một cuộc sống khỏe mạnh, cân bằng hơn.",
        icon: "fa-solid fa-leaf",
        accent: "from-emerald-400 via-teal-400 to-green-500",
        soft: "from-white via-white to-emerald-50/50",
        iconBg:
            "bg-gradient-to-br from-emerald-400 via-teal-400 to-green-500 text-white shadow-[0_14px_34px_rgba(16,185,129,0.22)]",
        pattern: "text-emerald-200/20",
        cardClass: "xl:col-span-6 min-h-[220px] xl:translate-y-10",
    },
];

function JourneyCard({ item, large = false }: { item: JourneyItem; large?: boolean }) {
    return (
        <motion.article
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55 }}
            className={`group relative overflow-hidden rounded-[30px] border border-white/75 bg-white/82 p-6 shadow-[0_14px_45px_rgba(15,23,42,0.08)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_65px_rgba(15,23,42,0.12)] ${item.cardClass}`}
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${item.soft} opacity-0 transition duration-300 group-hover:opacity-100`} />
            <div className="absolute -right-8 -top-6 h-28 w-28 rounded-full bg-white/55 blur-2xl transition duration-300 group-hover:scale-105" />
            <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-white/55 blur-2xl transition duration-300 group-hover:scale-105" />

            <div className={`absolute right-4 top-3 ${item.pattern}`}>
                <i className={`${item.icon} text-[5.6rem] transition duration-300 group-hover:scale-105 group-hover:-rotate-3`} />
            </div>

            <div className="relative z-10 flex h-full flex-col">
                <div className="flex items-start justify-between gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${item.iconBg}`}>
                        <i className={`${item.icon} text-lg`} />
                    </div>
                    <div className="rounded-full border border-slate-200/80 bg-white/90 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-slate-500 shadow-sm">
                        {item.step}
                    </div>
                </div>

                <div className={`mt-5 h-1.5 ${large ? "w-20 group-hover:w-28" : "w-14 group-hover:w-20"} rounded-full bg-gradient-to-r ${item.accent} transition-all duration-300`} />

                <h3 className={`${large ? "mt-6 text-2xl md:text-[1.75rem]" : "mt-5 text-lg"} font-semibold leading-tight text-slate-900`}>
                    {item.title}
                </h3>

                <p className={`${large ? "mt-4 max-w-xl text-[15px] leading-7 md:text-base" : "mt-2 text-sm leading-6 md:text-[15px]"} text-slate-600`}>
                    {item.description}
                </p>

                {large ? (
                    <div className="mt-auto pt-8">
                        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/70 px-3 py-1.5 text-sm font-medium text-indigo-700">
                            <span>Starting Point</span>
                            <i className="fa-solid fa-arrow-right text-xs" />
                        </div>
                    </div>
                ) : (
                    <div className="mt-auto pt-6 text-sm font-medium text-slate-500 opacity-0 transition duration-300 group-hover:opacity-100">

                    </div>
                )}
            </div>
        </motion.article>
    );
}

export default function AyanavitaJourneySection() {
    return (
        <section className="relative overflow-hidden py-16 md:py-20">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-indigo-200/20 blur-3xl" />
                <div className="absolute right-0 top-4 h-80 w-80 rounded-full bg-amber-200/20 blur-3xl" />
                <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-200/15 blur-3xl" />
            </div>

            <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="grid gap-10 xl:grid-cols-12 xl:items-start xl:gap-12">
                    <div className="xl:col-span-5 xl:sticky xl:top-24">
            <span className="inline-flex items-center rounded-full border border-indigo-200 bg-white/80 px-4 py-1.5 text-sm font-semibold text-indigo-700 shadow-sm backdrop-blur">
              The AYANAVITA Journey
            </span>

                        <h2 className="mt-4 text-3xl font-extrabold leading-tight text-slate-900 md:text-4xl">
                            Một hành trình được thiết kế để chăm sóc bạn tốt hơn, theo cách riêng của bạn
                        </h2>

                        <p className="mt-5 text-base leading-7 text-slate-600 md:text-lg">
                            Mỗi người đến với AYANAVITA đều bắt đầu từ một câu hỏi đơn giản: “Tôi có thể chăm sóc cơ thể và cuộc sống của mình tốt hơn như thế nào?”
                        </p>

                        <p className="mt-3 text-base leading-7 text-slate-500 md:text-lg">
                            Hành trình này không bắt đầu bằng một giải pháp có sẵn, mà bắt đầu từ việc hiểu rõ chính bạn để từng bước tìm ra hướng chăm sóc phù hợp nhất.
                        </p>

                        <div className="mt-7 rounded-[28px] border border-white/75 bg-white/78 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.07)] backdrop-blur-sm">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-600">
                                Closing Line
                            </p>
                            <p className="mt-3 text-base leading-7 text-slate-700">
                                AYANAVITA không chỉ là một trải nghiệm một lần. Đó là một hành trình chăm sóc và phát triển bản thân lâu dài.
                            </p>
                        </div>
                    </div>

                    <div className="xl:col-span-7">
                        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-8 xl:auto-rows-[minmax(170px,auto)]">
                            <JourneyCard item={items[0]} large />
                            <JourneyCard item={items[1]} />
                            <JourneyCard item={items[2]} />
                            <JourneyCard item={items[3]} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
