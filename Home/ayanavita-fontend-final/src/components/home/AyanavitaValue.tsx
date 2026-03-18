import React from "react";

type ValueItem = {
    key: string;
    label: string;
    title: string;
    description: string;
    icon: string;
};

export interface ValuesSectionCmsData {
    badge: string;
    title: string;
    description: string;
    items: ValueItem[];
}

export const cmsDataDefault: ValuesSectionCmsData = {
    badge: "The AYANAVITA Values",
    title: "Những giá trị cốt lõi tại AYANAVITA",
    description:
        "Những giá trị này định hướng cách chúng tôi chăm sóc khách hàng và xây dựng trải nghiệm wellness tinh tế, bền vững hơn.",
    items: [
        {
            key: "understanding",
            label: "01 · Understanding",
            title: "Thấu hiểu từng cá nhân",
            description:
                "Mỗi trải nghiệm bắt đầu từ việc hiểu cơ thể, lối sống và nhu cầu riêng, thay vì áp dụng một khuôn mẫu chung cho tất cả.",
            icon: "fa-solid fa-heart-pulse",
        },
        {
            key: "balance",
            label: "02 · Balance",
            title: "Khôi phục sự cân bằng",
            description:
                "AYANAVITA hướng tới sự hài hòa giữa cơ thể, tâm trí và nhịp sống, để wellness trở thành trạng thái bền vững mỗi ngày.",
            icon: "fa-solid fa-scale-balanced",
        },
        {
            key: "personalization",
            label: "03 · Personalization",
            title: "Wellness cá nhân hóa",
            description:
                "Không có một giải pháp chung cho tất cả. Mỗi hành trình được điều chỉnh để phù hợp hơn với thể trạng và mục tiêu riêng của từng người.",
            icon: "fa-solid fa-leaf",
        },
        {
            key: "long-term-care",
            label: "04 · Long-term Care",
            title: "Đồng hành dài lâu",
            description:
                "Chúng tôi tin rằng wellness là một hành trình lâu dài, cần sự chăm sóc đều đặn, nhẹ nhàng và có chiều sâu theo thời gian.",
            icon: "fa-solid fa-seedling",
        },
        {
            key: "community",
            label: "05 · Community",
            title: "Cộng đồng kết nối",
            description:
                "AYANAVITA không chỉ là một nơi trải nghiệm, mà còn là không gian kết nối khách hàng, đối tác và chuyên gia trong cùng một hệ sinh thái wellness.",
            icon: "fa-solid fa-globe",
        },
    ],
};

export interface ValuesSectionProps {
    cmsData?: Partial<ValuesSectionCmsData>;
    className?: string;
}

const cardStyles = [
    {
        iconWrap:
            "from-indigo-600 via-violet-600 to-cyan-500 text-white shadow-indigo-500/30",
        border:
            "border-indigo-100 hover:border-indigo-200 hover:shadow-[0_20px_50px_-24px_rgba(79,70,229,0.18)]",
        label: "text-indigo-600",
    },
    {
        iconWrap:
            "from-amber-400 via-yellow-400 to-orange-400 text-slate-900 shadow-amber-400/30",
        border:
            "border-amber-100 hover:border-amber-200 hover:shadow-[0_20px_50px_-24px_rgba(245,158,11,0.22)]",
        label: "text-amber-600",
    },
    {
        iconWrap:
            "from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-emerald-500/30",
        border:
            "border-emerald-100 hover:border-emerald-200 hover:shadow-[0_20px_50px_-24px_rgba(16,185,129,0.20)]",
        label: "text-emerald-600",
    },
    {
        iconWrap:
            "from-rose-500 via-pink-500 to-fuchsia-500 text-white shadow-rose-400/30",
        border:
            "border-rose-100 hover:border-rose-200 hover:shadow-[0_20px_50px_-24px_rgba(244,63,94,0.18)]",
        label: "text-rose-600",
    },
    {
        iconWrap:
            "from-cyan-500 via-sky-500 to-blue-500 text-white shadow-cyan-500/30",
        border:
            "border-cyan-100 hover:border-cyan-200 hover:shadow-[0_20px_50px_-24px_rgba(6,182,212,0.18)]",
        label: "text-cyan-600",
    },
] as const;

const ValuesSection: React.FC<ValuesSectionProps> = ({
                                                         cmsData,
                                                         className = "",
                                                     }) => {
    const data: ValuesSectionCmsData = {
        ...cmsDataDefault,
        ...cmsData,
        items: cmsData?.items ?? cmsDataDefault.items,
    };

    if (!data.items.length) return null;

    return (
        <section
            className={[
                "relative isolate overflow-hidden bg-white py-16 md:py-20",
                className,
            ].join(" ")}
        >
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-amber-100/40 blur-3xl" />
                <div className="absolute right-0 top-20 h-72 w-72 rounded-full bg-stone-100 blur-3xl" />
            </div>

            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700 md:text-sm">
                        {data.badge}
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                        {data.title}
                    </h2>
                    <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
                        {data.description}
                    </p>
                </div>

                <div className="mt-10 grid gap-4 md:grid-cols-2">
                    {data.items.map((item, index) => {
                        const isWide = index === data.items.length - 1;
                        const style = cardStyles[index % cardStyles.length];

                        return (
                            <article
                                key={item.key}
                                className={[
                                    "group relative overflow-hidden rounded-[24px] border bg-white p-5 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.14)] transition-all duration-300 hover:-translate-y-1",
                                    style.border,
                                    isWide ? "md:col-span-2" : "",
                                ].join(" ")}
                            >
                                <div className="relative flex items-start gap-4">
                                    <div
                                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${style.iconWrap} text-sm shadow-lg transition duration-500 group-hover:scale-110 group-hover:rotate-3`}
                                    >
                                        <i className={item.icon} />
                                    </div>

                                    <div className="min-w-0">
                                        <p
                                            className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${style.label}`}
                                        >
                                            {item.label}
                                        </p>
                                        <h3 className="mt-1 text-base font-semibold text-slate-900 md:text-lg">
                                            {item.title}
                                        </h3>
                                        <p className="mt-2 text-sm leading-7 text-slate-600 md:text-[15px]">
                                            {item.description}
                                        </p>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default ValuesSection;