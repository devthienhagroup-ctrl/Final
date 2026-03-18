import React from "react";

type CmsData = {
  title?: string;
  description?: string;
  primaryCtaText?: string;
  primaryCtaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  backgroundImageUrl?: string;
};

type TopBannerProps = {
  cmsData?: CmsData;
};

const defaultCmsData: Required<CmsData> = {
  title: "Chào mừng bạn đến với AYANAVITA",
  description: "Một nơi nơi sức khỏe, sắc đẹp và sự cân bằng hòa quyện.\n" +
      "AYANAVITA đồng hành cùng bạn hiểu cơ thể mình, chăm sóc bản thân và xây dựng một cuộc sống khỏe mạnh, trọn vẹn hơn.",
  primaryCtaText: "Khám phá trải nghiệm",
  primaryCtaHref: "#experience",
  secondaryCtaText: "Nhận tư vấn",
  secondaryCtaHref: "#contact",
  backgroundImageUrl:
      "https://images.unsplash.com/photo-1506260408121-e353d10b87c7?q=80&w=1228&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
};

export const TopBanner: React.FC<TopBannerProps> = ({ cmsData }) => {
  const data = { ...defaultCmsData, ...cmsData };

  return (
      <section className="w-full pt-5" id="top">
        <div className="mx-auto max-w-6xl px-4">
          <div className="relative overflow-hidden rounded-[28px] border border-white/60 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.32)]">
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${data.backgroundImageUrl})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/82 via-slate-900/68 to-amber-900/45" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-black/10" />

            <div className="relative flex min-h-[128px] flex-col justify-center gap-4 px-4 py-4 sm:px-6 md:min-h-[136px] md:flex-row md:items-center md:justify-between md:px-8">
              <div className="max-w-2xl">
                <h2 className="text-xl font-semibold leading-snug tracking-tight text-white sm:text-2xl md:text-[28px]">
                  {data.title}
                </h2>

                <p className="mt-2 text-sm leading-5 text-white/90 md:text-[14px]">
                  {data.description}a
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <a
                    href={data.primaryCtaHref}
                    className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-amber-500/20 transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  {data.primaryCtaText}
                </a>
                <a
                    href={data.secondaryCtaHref}
                    className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/12 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/18"
                >
                  {data.secondaryCtaText}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
  );
};

export default TopBanner;
