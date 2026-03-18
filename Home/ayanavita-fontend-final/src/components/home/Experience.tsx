import React from "react";

type ExperienceSectionCMS = {
    eyebrow?: string;
    title?: string;
    description?: string;
    highlight?: string;
};

type ExperienceSectionProps = {
    cmsData?: ExperienceSectionCMS;
};

const cmsDataDefault: Required<ExperienceSectionCMS> = {
    eyebrow: "THE AYANAVITA EXPERIENCE",
    title: "Một trải nghiệm nhẹ nhàng để bạn kết nối lại với cơ thể và tìm lại sự cân bằng.",
    description:
        "Từ không gian bình yên đến những trải nghiệm wellness cá nhân hóa, AYANAVITA giúp bạn tái tạo năng lượng và nuôi dưỡng một nhịp sống khỏe mạnh hơn mỗi ngày.",
    highlight:
        "Wellness không chỉ là vẻ ngoài — mà là cảm giác bên trong và cách bạn chăm sóc bản thân theo thời gian.",
};

export default function AyanavitaExperienceSection({
                                                       cmsData,
                                                   }: ExperienceSectionProps) {
    const mergedCmsData: Required<ExperienceSectionCMS> = {
        eyebrow: cmsData?.eyebrow || cmsDataDefault.eyebrow,
        title: cmsData?.title || cmsDataDefault.title,
        description: cmsData?.description || cmsDataDefault.description,
        highlight: cmsData?.highlight || cmsDataDefault.highlight,
    };

    return (
        <section className="relative w-full py-12 md:py-16">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.10),transparent_24%)]" />

            <div className="mx-auto max-w-6xl px-4">
                <div className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white/85 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm md:p-8">
                    <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                        <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                <span className="h-2 w-2 rounded-full bg-gradient-to-r from-amber-400 to-rose-400" />
                  {mergedCmsData.eyebrow}
              </span>

                            <h2 className="mt-4 max-w-3xl text-2xl font-semibold leading-tight text-slate-900 md:text-[30px]">
                                {mergedCmsData.title}
                            </h2>

                            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 md:text-[15px]">
                                {mergedCmsData.description}
                            </p>
                        </div>

                        <div className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-amber-50/60 p-5">
                            <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-amber-200/40 blur-3xl" />
                            <div className="pointer-events-none absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-indigo-200/30 blur-3xl" />

                            <div className="relative z-10">
                                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-rose-400 to-fuchsia-500 text-white shadow-lg shadow-rose-200/60">
                                    <span className="text-lg">✦</span>
                                </div>

                                <p className="mt-4 text-sm leading-7 text-slate-700 md:text-[15px]">
                                    {mergedCmsData.highlight}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
