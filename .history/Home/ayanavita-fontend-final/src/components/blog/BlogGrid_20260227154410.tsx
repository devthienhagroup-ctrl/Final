import React from "react";
import type { BlogPost } from "../../shared/blog.types";
import { copyLink, formatViews, tagLabel } from "../../shared/blog.store";

export function BlogGrid(props: {
  posts: BlogPost[];
  savedIds: Set<string>;
  onRead: (id: string) => void;
  onToggleSave: (id: string) => void;
  onReset: () => void;
}) {
  const empty = props.posts.length === 0;

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-6" id="grid">
        {props.posts.map((p) => (
          <article key={p.id} className="card overflow-hidden" id={`post-${p.id}`}>
            <div className="relative">
              <img src={p.img} alt={p.title} className="w-full h-44 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/55 to-transparent" />
              <div className="absolute left-4 bottom-4 flex flex-wrap gap-2">
                <span className="chip">
                  <i className="fa-solid fa-tag text-emerald-600" />
                  {tagLabel(p.tag)}
                </span>
                <span className="chip">
                  <i className="fa-solid fa-fire text-rose-600" />
                  {formatViews(p.views)} views
                </span>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-extrabold">{p.title}</div>
                  <div className="text-sm text-slate-600 mt-1">
                    <b>{p.author}</b> • <span className="text-slate-400">{p.date}</span>
                  </div>
                </div>
                <button className="btn h-10 w-10 p-0" onClick={() => props.onToggleSave(p.id)} title="Lưu">
                  <i
                    className={
                      "fa-solid fa-bookmark " +
                      (props.savedIds.has(p.id) ? "text-indigo-600" : "text-slate-400")
                    }
                  />
                </button>
              </div>

              <p className="mt-3 text-slate-700 leading-relaxed">{p.excerpt}</p>

              <div className="mt-5 flex gap-2">
                <button className="btn btn-primary flex-1" onClick={() => props.onRead(p.id)}>
                  <i className="fa-solid fa-book-open" /> Đọc bài
                </button>
                <button
                  className="btn flex-1"
                  onClick={async () => {
                    await copyLink(p.id);
                    alert(`Đã copy link (demo): #post-${p.id}`);
                  }}
                >
                  <i className="fa-solid fa-link" /> Copy link
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {empty ? (
        <div className="mt-10 card p-8 text-center">
          <div className="text-4xl">
            <i className="fa-solid fa-box-open text-slate-400" />
          </div>
          <div className="mt-2 text-xl font-extrabold">Không tìm thấy bài viết</div>
          <div className="mt-2 text-slate-600">Thử đổi từ khóa hoặc tag khác.</div>
          <button className="btn btn-primary mt-4" onClick={props.onReset}>
            <i className="fa-solid fa-rotate" /> Reset
          </button>
        </div>
      ) : null}
    </div>
  );
}
