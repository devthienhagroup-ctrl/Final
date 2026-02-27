import React, { useEffect, useMemo, useRef } from "react";
import type { BlogPost } from "../../shared/blog.types";
import { formatViews, tagLabel } from "../../shared/blog.store";
import { useOutsideClick } from "../../hooks/useOutsideClick";

function escapeHtml(s: string) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function BlogReadModal(props: {
  open: boolean;
  post: BlogPost | null;
  savedOn: boolean;
  onClose: () => void;
  onToggleSave: () => void;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  useOutsideClick(panelRef, props.onClose, props.open);

  useEffect(() => {
    if (!props.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") props.onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [props.open, props.onClose]);

  const bodyHtml = useMemo(() => {
    const p = props.post;
    if (!p) return "";
    return p.body.map((x) => `<p class="mb-3">${escapeHtml(x)}</p>`).join("");
  }, [props.post]);

  if (!props.open || !props.post) return null;
  const p = props.post;

  return (
    <div className="modal-backdrop" aria-hidden="false">
      <div ref={panelRef} className="card w-full max-w-4xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-extrabold text-slate-500">Article</div>
            <div className="text-lg font-extrabold">{p.title}</div>
          </div>
          <div className="flex gap-2">
            <button className="btn" onClick={props.onToggleSave}>
              <i className={"fa-solid fa-bookmark " + (props.savedOn ? "text-indigo-600" : "")} />
              {props.savedOn ? "Đã lưu" : "Lưu"}
            </button>
            <button className="btn h-10 w-10 p-0" onClick={props.onClose}>
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        </div>

        <div className="p-6 grid gap-4">
          <img
            alt="img"
            className="w-full h-64 object-cover rounded-3xl ring-1 ring-slate-200"
            src={p.img}
          />
          <div className="flex flex-wrap gap-2">
            <span className="chip"><i className="fa-solid fa-user text-indigo-600" /> {p.author}</span>
            <span className="chip"><i className="fa-solid fa-calendar-days text-amber-600" /> {p.date}</span>
            <span className="chip"><i className="fa-solid fa-tag text-emerald-600" /> {tagLabel(p.tag)}</span>
            <span className="chip"><i className="fa-solid fa-fire text-rose-600" /> {formatViews(p.views)} views</span>
          </div>

          <div
            className="text-slate-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
        </div>
      </div>
    </div>
  );
}
