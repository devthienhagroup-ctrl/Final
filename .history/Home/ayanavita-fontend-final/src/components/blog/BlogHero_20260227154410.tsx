import React from "react";
import type { BlogFilter } from "../../shared/blog.types";

export function BlogHero(props: {
  stats: { posts: number; saved: number };
  filter: BlogFilter;
  onChange: (patch: Partial<BlogFilter>) => void;
  onApply: () => void;
  onReset: () => void;
}) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?auto=format&fit=crop&w=2200&q=80"
          alt="Blog hero"
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
              <span className="chip chip-dark"><i className="fa-solid fa-leaf text-emerald-200" /> Wellness</span>
              <span className="chip chip-dark"><i className="fa-solid fa-spa text-indigo-200" /> Spa Care</span>
              <span className="chip chip-dark"><i className="fa-solid fa-bottle-droplet text-amber-200" /> Skincare</span>
            </div>

            <h1 className="mt-5 text-4xl lg:text-5xl font-extrabold leading-tight">
              Blog kiến thức<br /><span className="text-amber-300">AYANAVITA</span>
            </h1>
            <p className="mt-4 text-white/90 text-lg leading-relaxed">
              Bài viết chuyên sâu, dễ áp dụng: chăm sóc da, phục hồi hàng rào bảo vệ, massage trị liệu, tối ưu thói quen sống khỏe.
            </p>

            <div className="mt-7 grid sm:grid-cols-2 gap-3">
              <div className="card p-4 bg-white/10 border border-white/15 text-white">
                <div className="text-xs font-extrabold text-white/70">Bài viết</div>
                <div className="text-2xl font-extrabold">{props.stats.posts}</div>
              </div>
              <div className="card p-4 bg-white/10 border border-white/15 text-white">
                <div className="text-xs font-extrabold text-white/70">Saved</div>
                <div className="text-2xl font-extrabold">{props.stats.saved}</div>
              </div>
            </div>
          </div>

          <div className="card p-6" id="latest">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-extrabold text-slate-500">Tìm bài viết</div>
                <div className="text-xl font-extrabold">Tìm nhanh theo chủ đề</div>
              </div>
              <span className="chip"><i className="fa-solid fa-bolt text-amber-500" /> Demo</span>
            </div>

            <div className="mt-4 grid gap-3">
              <div>
                <label className="text-sm font-extrabold text-slate-700">Từ khóa</label>
                <input
                  className="field mt-2"
                  placeholder="VD: hàng rào da, retinol, massage..."
                  value={props.filter.q}
                  onChange={(e) => props.onChange({ q: e.target.value })}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-extrabold text-slate-700">Tag</label>
                  <select
                    className="field mt-2"
                    value={props.filter.tag}
                    onChange={(e) => props.onChange({ tag: e.target.value as any })}
                  >
                    <option value="all">Tất cả</option>
                    <option value="skincare">Skincare</option>
                    <option value="massage">Massage</option>
                    <option value="wellness">Wellness</option>
                    <option value="franchise">Nhượng quyền</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-extrabold text-slate-700">Sắp xếp</label>
                  <select
                    className="field mt-2"
                    value={props.filter.sort}
                    onChange={(e) => props.onChange({ sort: e.target.value as any })}
                  >
                    <option value="new">Mới nhất</option>
                    <option value="popular">Phổ biến (demo)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="btn btn-primary flex-1" onClick={props.onApply}>
                  <i className="fa-solid fa-filter" /> Lọc
                </button>
                <button className="btn flex-1" onClick={props.onReset}>
                  <i className="fa-solid fa-rotate" /> Reset
                </button>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 text-sm text-slate-700">
                Prototype: khi có CMS, bạn map bài viết theo slug, author, category, SEO meta, schema Article.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
