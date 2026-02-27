import React from "react";

export function BlogTopics(props: { onQuick: (tag: "all" | any) => void }) {
  return (
    <section id="topics" className="max-w-7xl mx-auto px-4 py-14">
      <div className="text-xs font-extrabold text-slate-500">Chủ đề</div>
      <div className="mt-1 flex flex-wrap gap-2">
        <button className="chip" onClick={() => props.onQuick("skincare")}>
          <i className="fa-solid fa-bottle-droplet text-amber-600" /> Skincare
        </button>
        <button className="chip" onClick={() => props.onQuick("massage")}>
          <i className="fa-solid fa-hand-sparkles text-indigo-600" /> Massage
        </button>
        <button className="chip" onClick={() => props.onQuick("wellness")}>
          <i className="fa-solid fa-leaf text-emerald-600" /> Wellness
        </button>
        <button className="chip" onClick={() => props.onQuick("franchise")}>
          <i className="fa-solid fa-store text-slate-700" /> Nhượng quyền
        </button>
        <button className="chip" onClick={() => props.onQuick("all")}>
          <i className="fa-solid fa-layer-group text-indigo-600" /> Tất cả
        </button>
      </div>
    </section>
  );
}
