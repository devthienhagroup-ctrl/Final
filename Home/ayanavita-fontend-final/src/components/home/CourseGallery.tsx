// src/components/home/CourseGallery.tsx
import React from "react";

type ExperienceItem = {
  title?: string;
  description?: string;
};

type CourseGalleryCMS = {
  heading?: string;
  subheading?: string;
  items?: ExperienceItem[];
};

type CourseGalleryProps = {
  onGetDeal?: () => void;
  cmsData?: CourseGalleryCMS;
};

const defaultCmsData: Required<CourseGalleryCMS> = {
  heading: "Trải nghiệm nổi bật tại AYANAVITA",
  subheading:
      "Khám phá những trải nghiệm wellness cá nhân hóa giúp bạn thấu hiểu bản thân, tái tạo năng lượng và chăm sóc mình theo cách phù hợp nhất.",
  items: [
    {
      title: "Personal Wellness Check-in",
      description:
          "Một trải nghiệm giúp bạn hiểu rõ tình trạng\nsức khỏe – sắc đẹp – năng lượng của mình.",
    },
    {
      title: "Skin & Vitality Analysis",
      description:
          "Phân tích làn da và sức sống\nđể tìm ra giải pháp phù hợp nhất cho bạn.",
    },
    {
      title: "Personalized Wellness Programs",
      description:
          "Chương trình chăm sóc được thiết kế riêng\ncho từng cá nhân.",
    },
  ],
};

const cardStyles = [
  {
    icon: "fa-solid fa-heart-pulse",
    badge: "Wellness Check-in",
    glow: "from-indigo-500/20 via-violet-500/10 to-cyan-400/20",
    iconWrap:
        "from-indigo-600 via-violet-600 to-cyan-500 text-white shadow-indigo-500/30",
    border: "group-hover:border-indigo-200",
    dot: "bg-indigo-500",
  },
  {
    icon: "fa-solid fa-spa",
    badge: "Skin Analysis",
    glow: "from-amber-400/20 via-yellow-300/10 to-orange-400/20",
    iconWrap:
        "from-amber-400 via-yellow-400 to-orange-400 text-slate-900 shadow-amber-400/30",
    border: "group-hover:border-amber-200",
    dot: "bg-amber-400",
  },
  {
    icon: "fa-solid fa-leaf",
    badge: "Personalized Program",
    glow: "from-emerald-500/20 via-teal-400/10 to-cyan-400/20",
    iconWrap:
        "from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-emerald-500/30",
    border: "group-hover:border-emerald-200",
    dot: "bg-emerald-500",
  },
] as const;

export const CourseGallery: React.FC<CourseGalleryProps> = ({ cmsData }) => {
  const mergedCmsData: Required<CourseGalleryCMS> = {
    heading: cmsData?.heading || defaultCmsData.heading,
    subheading: cmsData?.subheading || defaultCmsData.subheading,
    items: cmsData?.items?.length ? cmsData.items : defaultCmsData.items,
  };

  return (
      <section
          id="courseGallery"
          className="relative w-full overflow-hidden py-14 md:py-20"
      >
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.10),transparent_24%)]" />

        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-4 py-1.5 text-sm font-medium text-indigo-700 shadow-sm backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" />
            Signature Experiences
          </span>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              {mergedCmsData.heading}
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600 md:text-lg">
              {mergedCmsData.subheading}
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {mergedCmsData.items.map((item, index) => {
              const style = cardStyles[index % cardStyles.length];

              return (
                  <article
                      key={`${item.title || "experience"}-${index}`}
                      className={`group relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_22px_60px_rgba(79,70,229,0.16)] ${style.border}`}
                  >
                    <div
                        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${style.glow} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
                    />
                    <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 translate-x-10 -translate-y-10 rounded-full bg-white/50 blur-2xl transition-transform duration-500 group-hover:scale-125" />

                    <div className="relative z-10 flex items-start justify-between gap-4">
                      <div
                          className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${style.iconWrap} shadow-lg transition duration-500 group-hover:scale-110 group-hover:rotate-3`}
                      >
                        <i className={`${style.icon} text-lg`} aria-hidden="true" />
                      </div>

                      <div className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 transition duration-500 group-hover:border-white/70 group-hover:bg-white/90">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                    </div>

                    <div className="relative z-10 mt-5">
                      <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 transition duration-500 group-hover:bg-white/80">
                        <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                        {style.badge}
                      </div>

                      <h3 className="mt-4 text-xl font-semibold leading-snug text-slate-900 transition duration-500 group-hover:text-slate-950">
                        {item.title}
                      </h3>

                      <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600 md:text-[15px]">
                        {item.description}
                      </p>
                    </div>

                  </article>
              );
            })}
          </div>
        </div>
      </section>
  );
};
