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

// cmsData chỉ chứa NỘI DUNG + class icon fontawesome
// KHÔNG chứa màu sắc / kích thước / layout class / db stuff
export type BlogReadModalCmsData = {
  headerKicker: string;
  imageAlt: string;

  saveButton: {
    default: { iconClass: string; text: string };
    active: { iconClass: string; text: string };
  };

  closeButton: {
    iconClass: string;
    ariaLabel: string;
  };

  meta: {
    author: { iconClass: string };
    date: { iconClass: string };
    tag: { iconClass: string };
    views: { iconClass: string; suffix: string };
  };
};

// Lấy lại dữ liệu mặc định từ nội dung hiện tại của component
export const DEFAULT_CMS_DATA: BlogReadModalCmsData = {
  headerKicker: "Article",
  imageAlt: "img",
  saveButton: {
    default: { iconClass: "fa-solid fa-bookmark", text: "Lưu" },
    active: { iconClass: "fa-solid fa-bookmark", text: "Đã lưu" },
  },
  closeButton: {
    iconClass: "fa-solid fa-xmark",
    ariaLabel: "Đóng",
  },
  meta: {
    author: { iconClass: "fa-solid fa-user" },
    date: { iconClass: "fa-solid fa-calendar-days" },
    tag: { iconClass: "fa-solid fa-tag" },
    views: { iconClass: "fa-solid fa-fire", suffix: "views" },
  },
};

function mergeCmsData(
    incoming?: Partial<BlogReadModalCmsData>
): BlogReadModalCmsData {
  const cd = incoming ?? {};
  return {
    headerKicker: cd.headerKicker ?? DEFAULT_CMS_DATA.headerKicker,
    imageAlt: cd.imageAlt ?? DEFAULT_CMS_DATA.imageAlt,

    saveButton: {
      default: {
        ...DEFAULT_CMS_DATA.saveButton.default,
        ...(cd.saveButton?.default ?? {}),
      },
      active: {
        ...DEFAULT_CMS_DATA.saveButton.active,
        ...(cd.saveButton?.active ?? {}),
      },
    },

    closeButton: {
      ...DEFAULT_CMS_DATA.closeButton,
      ...(cd.closeButton ?? {}),
    },

    meta: {
      author: { ...DEFAULT_CMS_DATA.meta.author, ...(cd.meta?.author ?? {}) },
      date: { ...DEFAULT_CMS_DATA.meta.date, ...(cd.meta?.date ?? {}) },
      tag: { ...DEFAULT_CMS_DATA.meta.tag, ...(cd.meta?.tag ?? {}) },
      views: { ...DEFAULT_CMS_DATA.meta.views, ...(cd.meta?.views ?? {}) },
    },
  };
}

export function BlogReadModal(props: {
  open: boolean;
  post: BlogPost | null;
  savedOn: boolean;
  onClose: () => void;
  onToggleSave: () => void;

  // NEW
  cmsData?: Partial<BlogReadModalCmsData>;
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

  const cms = useMemo(() => mergeCmsData(props.cmsData), [props.cmsData]);

  const bodyHtml = useMemo(() => {
    const p = props.post;
    if (!p) return "";
    return p.body.map((x) => `<p class="mb-3">${escapeHtml(x)}</p>`).join("");
  }, [props.post]);

  if (!props.open || !props.post) return null;
  const p = props.post;

  const saveCfg = props.savedOn ? cms.saveButton.active : cms.saveButton.default;

  return (
      <div className="modal-backdrop" aria-hidden="false">
        <div ref={panelRef} className="card w-full max-w-4xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-extrabold text-slate-500">
                {cms.headerKicker}
              </div>
              <div className="text-lg font-extrabold">{p.title}</div>
            </div>

            <div className="flex gap-2">
              <button className="btn" onClick={props.onToggleSave}>
                <i
                    className={
                        saveCfg.iconClass + " " + (props.savedOn ? "text-indigo-600" : "")
                    }
                />
                {saveCfg.text}
              </button>

              <button
                  className="btn h-10 w-10 p-0"
                  onClick={props.onClose}
                  aria-label={cms.closeButton.ariaLabel}
              >
                <i className={cms.closeButton.iconClass} />
              </button>
            </div>
          </div>

          <div className="p-6 grid gap-4">
            <img
                alt={cms.imageAlt}
                className="w-full h-64 object-cover rounded-3xl ring-1 ring-slate-200"
                src={p.img}
            />

            <div className="flex flex-wrap gap-2">
            <span className="chip">
              <i className={`${cms.meta.author.iconClass} text-indigo-600`} />{" "}
              {p.author}
            </span>

              <span className="chip">
              <i className={`${cms.meta.date.iconClass} text-amber-600`} />{" "}
                {p.date}
            </span>

              <span className="chip">
              <i className={`${cms.meta.tag.iconClass} text-emerald-600`} />{" "}
                {tagLabel(p.tag)}
            </span>

              <span className="chip">
              <i className={`${cms.meta.views.iconClass} text-rose-600`} />{" "}
                {formatViews(p.views)} {cms.meta.views.suffix}
            </span>
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