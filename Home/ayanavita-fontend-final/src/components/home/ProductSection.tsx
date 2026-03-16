// src/components/home/ProductSection.fixed.tsx
import React from "react";

interface ProductItem {
  icon: string;
  title: string;
  desc: string;
  tone: string;
}

interface ProductSectionProps {
  cmsData?: {
    badge?: string;
    title?: string;
    description?: string;
    items?: ProductItem[];
    insightBox?: {
      label: string;
      title: string;
      desc: string;
    };
    experienceBox?: {
      label: string;
      title: string;
      desc: string;
    };
    imageUrl?: string;
    imageAlt?: string;
  };
}

export const ProductSection: React.FC<ProductSectionProps> = ({ cmsData }) => {
  const defaultItems: ProductItem[] = [
    {
      icon: "fa-solid fa-heart-pulse",
      title: "Personalized wellness insights",
      desc: "Hiểu rõ tình trạng sức khỏe và năng lượng của cơ thể bạn.",
      tone: "indigo",
    },
    {
      icon: "fa-solid fa-brain",
      title: "AI supported recommendations",
      desc: "Những gợi ý chăm sóc phù hợp dựa trên dữ liệu wellness của bạn.",
      tone: "amber",
    },
    {
      icon: "fa-solid fa-spa",
      title: "Wellness experiences",
      desc: "Những trải nghiệm giúp cơ thể, làn da và tinh thần được tái tạo.",
      tone: "cyan",
    },
    {
      icon: "fa-solid fa-seedling",
      title: "Long-term vitality roadmap",
      desc: "Một lộ trình dài hạn để sống khỏe và duy trì năng lượng bền vững.",
      tone: "emerald",
    },
  ];

  const defaultData = {
    badge: "AYANAVITA mang lại điều gì?",
    title: "AYANAVITA mang lại điều gì?",
    description:
        "AYANAVITA giúp bạn hiểu cơ thể mình tốt hơn và xây dựng một hành trình chăm sóc sức khỏe cá nhân hóa thông qua dữ liệu wellness, công nghệ và những trải nghiệm tái tạo năng lượng.",
    items: defaultItems,
    insightBox: {
      label: "Wellness Insight",
      title: "Hiểu rõ cơ thể của bạn",
      desc: "Thu thập và phân tích dữ liệu wellness để giúp bạn hiểu rõ hơn về trạng thái cơ thể, làn da và năng lượng.",
    },
    experienceBox: {
      label: "Wellness Experience",
      title: "Trải nghiệm tái tạo năng lượng",
      desc: "Những trải nghiệm spa và wellness được thiết kế để giúp cơ thể và tinh thần được phục hồi.",
    },
    imageUrl:
        "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=1400&q=80",
    imageAlt: "Wellness experience",
  };

  const data = {
    ...defaultData,
    ...cmsData,
    items: cmsData?.items || defaultData.items,
    insightBox: {
      ...defaultData.insightBox,
      ...cmsData?.insightBox,
    },
    experienceBox: {
      ...defaultData.experienceBox,
      ...cmsData?.experienceBox,
    },
  };

  const toneIconWrap: Record<string, string> = {
    indigo:
        "bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-500 text-white shadow-indigo-200",
    amber:
        "bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-400 text-white shadow-amber-200",
    cyan:
        "bg-gradient-to-br from-cyan-400 via-sky-400 to-blue-500 text-white shadow-cyan-200",
    emerald:
        "bg-gradient-to-br from-emerald-400 via-teal-400 to-green-500 text-white shadow-emerald-200",
  };

  return (
      <section
          id="product"
          className="relative w-full overflow-hidden py-16 md:py-20"
      >
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl" />
          <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-amber-200/30 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-200/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            {/* LEFT */}
            <div>
              {data.badge && (
                  <span className="mb-3 inline-flex rounded-full border border-indigo-200 bg-white/80 px-4 py-1.5 text-sm font-semibold text-indigo-700 shadow-sm backdrop-blur">
                {data.badge}
              </span>
              )}

              <h2 className="max-w-xl text-3xl font-extrabold leading-tight text-slate-900 md:text-4xl">
                {data.title}
              </h2>

              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                {data.description}
              </p>

              <div className="mt-8 grid gap-4">
                {data.items.map((x) => (
                    <div
                        key={x.title}
                        className="group relative overflow-hidden rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(79,70,229,0.14)]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white via-white to-indigo-50/40 opacity-0 transition duration-300 group-hover:opacity-100" />

                      <div className="relative flex items-start gap-4">
                        <div
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-lg ${toneIconWrap[x.tone]}`}
                        >
                          <i className={`${x.icon} text-lg`} />
                        </div>

                        <div>
                          <div className="text-base font-semibold text-slate-900 md:text-lg">
                            {x.title}
                          </div>
                          <div className="mt-1.5 text-sm leading-6 text-slate-600 md:text-[15px]">
                            {x.desc}
                          </div>
                        </div>
                      </div>
                    </div>
                ))}
              </div>
            </div>

            {/* RIGHT */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-[36px] bg-gradient-to-br from-indigo-200/40 via-white to-amber-100/40 blur-2xl" />

              <div className="relative overflow-hidden rounded-[32px] border border-white/70 bg-white/70 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.10)] backdrop-blur-xl">
                <div className="relative overflow-hidden rounded-[24px]">
                  <img
                      className="h-72 w-full object-cover transition duration-700 hover:scale-105 md:h-[360px]"
                      src={data.imageUrl}
                      alt={data.imageAlt}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/25 via-slate-900/5 to-white/10" />

                  <div className="absolute left-4 top-4 rounded-full border border-white/40 bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                    AYANAVITA Wellness
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-[24px] border border-slate-200/70 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-600">
                      {data.insightBox.label}
                    </div>
                    <div className="mt-2 text-base font-semibold text-slate-900">
                      {data.insightBox.title}
                    </div>
                    <div className="mt-2 text-sm leading-6 text-slate-600">
                      {data.insightBox.desc}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200/70 bg-gradient-to-br from-white to-amber-50/40 p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-600">
                      {data.experienceBox.label}
                    </div>
                    <div className="mt-2 text-base font-semibold text-slate-900">
                      {data.experienceBox.title}
                    </div>
                    <div className="mt-2 text-sm leading-6 text-slate-600">
                      {data.experienceBox.desc}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* END RIGHT */}
          </div>
        </div>
      </section>
  );
};