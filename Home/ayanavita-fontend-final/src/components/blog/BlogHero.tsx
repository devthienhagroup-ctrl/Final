import React from "react";
import type { BlogFilter } from "../../shared/blog.types";

export type BlogHeroCmsData = {
  heroImageUrl: string;
  heroImageAlt: string;
  chips: Array<{ label: string; iconClass?: string }>;
  heading: {
    title: string;
    highlight: string;
  };
  description: string;
  stats: {
    postsLabel: string;
    savedLabel: string;
  };
  searchCard: {
    eyebrow: string;
    title: string;
    keywordLabel: string;
    keywordPlaceholder: string;
    tagLabel: string;
    tagOptions: Array<{ value: string; label: string }>;
    sortLabel: string;
    sortOptions: Array<{ value: string; label: string }>;
    applyLabel: string;
    applyIconClass?: string;
    resetLabel: string;
    resetIconClass?: string;
    note: string;
  };
};

export const defaultBlogHeroCmsData: BlogHeroCmsData = {
  heroImageUrl:
      "https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?auto=format&fit=crop&w=2200&q=80",
  heroImageAlt: "Blog hero",
  chips: [
    { label: "Wellness", iconClass: "fa-solid fa-leaf" },
    { label: "Spa Care", iconClass: "fa-solid fa-spa" },
    { label: "Skincare", iconClass: "fa-solid fa-bottle-droplet" },
  ],
  heading: {
    title: "Blog kiến thức",
    highlight: "AYANAVITA",
  },
  description:
      "Bài viết chuyên sâu, dễ áp dụng: chăm sóc da, phục hồi hàng rào bảo vệ, massage trị liệu, tối ưu thói quen sống khỏe.",
  stats: {
    postsLabel: "Bài viết",
    savedLabel: "Saved",
  },
  searchCard: {
    eyebrow: "Tìm bài viết",
    title: "Tìm nhanh theo chủ đề",
    keywordLabel: "Từ khóa",
    keywordPlaceholder: "VD: hàng rào da, retinol, massage...",
    tagLabel: "Tag",
    tagOptions: [
      { value: "all", label: "Tất cả" },
      { value: "skincare", label: "Skincare" },
      { value: "massage", label: "Massage" },
      { value: "wellness", label: "Wellness" },
      { value: "franchise", label: "Nhượng quyền" },
    ],
    sortLabel: "Sắp xếp",
    sortOptions: [
      { value: "new", label: "Mới nhất" },
      { value: "popular", label: "Phổ biến (demo)" },
    ],
    applyLabel: "Lọc",
    applyIconClass: "fa-solid fa-filter",
    resetLabel: "Reset",
    resetIconClass: "fa-solid fa-rotate",
    note: "Prototype: khi có CMS, bạn map bài viết theo slug, author, category, SEO meta, schema Article.",
  },
};

export function BlogHero(props: {
  stats: { posts: number; saved: number };
  filter: BlogFilter;
  onChange: (patch: Partial<BlogFilter>) => void;
  onApply: () => void;
  onReset: () => void;
  cmsData?: BlogHeroCmsData;
}) {
  const cms = props.cmsData ?? defaultBlogHeroCmsData;

  // màu icon là UI/styling => không nhét vào cmsData
  const chipIconColorClasses = [
    "text-emerald-200",
    "text-indigo-200",
    "text-amber-200",
  ];

  return (
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
              src={cms.heroImageUrl}
              alt={cms.heroImageAlt}
              className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 gradient-lux" />
          <div className="absolute left-0 right-0 top-10 h-[2px] gold-line opacity-80" />
          <div className="absolute left-0 right-0 bottom-12 h-[2px] gold-line opacity-50" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-14 lg:py-18">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="text-white">
              <div className="flex flex-wrap gap-2">
                {cms.chips.map((chip, idx) => (
                    <span key={`${chip.label}-${idx}`} className="chip chip-dark">
                  {chip.iconClass ? (
                      <i
                          className={`${chip.iconClass} ${
                              chipIconColorClasses[idx % chipIconColorClasses.length]
                          }`}
                      />
                  ) : null}{" "}
                      {chip.label}
                </span>
                ))}
              </div>

              <h1 className="mt-5 text-4xl lg:text-5xl font-extrabold leading-tight">
                {cms.heading.title}
                <br />
                <span className="text-amber-300">{cms.heading.highlight}</span>
              </h1>

              <p className="mt-4 text-white/90 text-lg leading-relaxed">
                {cms.description}
              </p>

              <div className="mt-7 grid sm:grid-cols-2 gap-3">
                <div className="card p-4 bg-white/10 border border-white/15 text-white">
                  <div className="text-xs font-extrabold text-slate-600">
                    {cms.stats.postsLabel}
                  </div>
                  <div className="text-2xl font-extrabold text-slate-800">
                    {props.stats.posts}
                  </div>
                </div>

                <div className="card p-4 bg-white/10 border border-white/15 text-white">
                  <div className="text-xs font-extrabold text-slate-600">
                    {cms.stats.savedLabel}
                  </div>
                  <div className="text-2xl font-extrabold text-slate-800">
                    {props.stats.saved}
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6" id="latest">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-extrabold text-slate-500">
                    {cms.searchCard.eyebrow}
                  </div>
                  <div className="text-xl font-extrabold">
                    {cms.searchCard.title}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                <div>
                  <label className="text-sm font-extrabold text-slate-700">
                    {cms.searchCard.keywordLabel}
                  </label>
                  <input
                      className="field mt-2"
                      placeholder={cms.searchCard.keywordPlaceholder}
                      value={props.filter.q}
                      onChange={(e) => props.onChange({ q: e.target.value })}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-extrabold text-slate-700">
                      {cms.searchCard.tagLabel}
                    </label>
                    <select
                        className="field mt-2"
                        value={props.filter.tag}
                        onChange={(e) => props.onChange({ tag: e.target.value as any })}
                    >
                      {cms.searchCard.tagOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-extrabold text-slate-700">
                      {cms.searchCard.sortLabel}
                    </label>
                    <select
                        className="field mt-2"
                        value={props.filter.sort}
                        onChange={(e) => props.onChange({ sort: e.target.value as any })}
                    >
                      {cms.searchCard.sortOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                      className="btn btn-primary hover:text-purple-800 flex-1"
                      onClick={props.onApply}
                  >
                    {cms.searchCard.applyIconClass ? (
                        <i className={cms.searchCard.applyIconClass} />
                    ) : null}{" "}
                    {cms.searchCard.applyLabel}
                  </button>

                  <button className="btn flex-1" onClick={props.onReset}>
                    {cms.searchCard.resetIconClass ? (
                        <i className={cms.searchCard.resetIconClass} />
                    ) : null}{" "}
                    {cms.searchCard.resetLabel}
                  </button>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 text-sm text-slate-700">
                  {cms.searchCard.note}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
  );
}