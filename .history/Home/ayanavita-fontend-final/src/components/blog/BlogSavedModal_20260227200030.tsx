import React, { useEffect, useMemo, useRef } from "react";
import type { BlogPost } from "../../shared/blog.types";
import { copyLink, tagLabel } from "../../shared/blog.store";
import { useOutsideClick } from "../../hooks/useOutsideClick";

export type BlogSavedModalCmsData = {
  headerKicker: string;
  headerTitle: string;

  clearText: string;
  clearIconClass: string;
  closeIconClass: string;

  emptyIconClass: string;
  emptyTitle: string;
  emptyDescription: string;

  bookmarkIconClass: string;
  bookmarkButtonTitle: string;

  readText: string;
  readIconClass: string;

  linkText: string;
  linkIconClass: string;

  // dùng {id} làm placeholder
  copiedAlertTemplate: string;
};

const defaultCmsData: BlogSavedModalCmsData = {
  headerKicker: "Saved",
  headerTitle: "Bài viết đã lưu",

  clearText: "Xoá",
  clearIconClass: "fa-solid fa-trash",
  closeIconClass: "fa-solid fa-xmark",

  emptyIconClass: "fa-solid fa-inbox",
  emptyTitle: "Chưa có bài lưu",
  emptyDescription: "Nhấn “Lưu” ở một bài viết để thấy nó xuất hiện tại đây.",

  bookmarkIconClass: "fa-solid fa-bookmark",
  bookmarkButtonTitle: "Bỏ lưu",

  readText: "Đọc",
  readIconClass: "fa-solid fa-book-open",

  linkText: "Link",
  linkIconClass: "fa-solid fa-link",

  copiedAlertTemplate: "Đã copy link (demo): #post-{id}",
};

export function BlogSavedModal(props: {
  open: boolean;
  savedIds: Set<string>;
  posts: BlogPost[];
  onClose: () => void;
  onClear: () => void;
  onToggleSave: (id: string) => void;
  onRead: (id: string) => void;

  // cmsData chỉ chứa NỘI DUNG (text/icon class), không chứa màu sắc/kích thước/DB...
  cmsData?: Partial<BlogSavedModalCmsData>;
}) {
  const cms = useMemo(
      () => ({ ...defaultCmsData, ...(props.cmsData ?? {}) }),
      [props.cmsData]
  );

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

  const items = useMemo(() => {
    const ids = Array.from(props.savedIds);
    const map = new Map(props.posts.map((p) => [p.id, p]));
    return ids.map((id) => map.get(id)).filter(Boolean) as BlogPost[];
  }, [props.savedIds, props.posts]);

  if (!props.open) return null;

  return (
      <div className="modal-backdrop" aria-hidden="false">
        <div ref={panelRef} className="card w-full max-w-3xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-extrabold text-slate-500">{cms.headerKicker}</div>
              <div className="text-lg font-extrabold">{cms.headerTitle}</div>
            </div>
            <div className="flex gap-2">
              <button className="btn" onClick={props.onClear}>
                <i className={cms.clearIconClass} /> {cms.clearText}
              </button>
              <button className="btn h-10 w-10 p-0" onClick={props.onClose}>
                <i className={cms.closeIconClass} />
              </button>
            </div>
          </div>

          <div className="p-6">
            {items.length === 0 ? (
                <div className="text-center text-slate-600 py-10">
                  <div className="text-3xl">
                    <i className={cms.emptyIconClass} />
                  </div>
                  <div className="mt-2 font-extrabold">{cms.emptyTitle}</div>
                  <div className="text-sm mt-1">{cms.emptyDescription}</div>
                </div>
            ) : (
                <div className="grid gap-3">
                  {items.map((p) => (
                      <div key={p.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-extrabold">{p.title}</div>
                            <div className="text-sm text-slate-600 mt-1">
                              {tagLabel(p.tag)} • {p.date}
                            </div>
                          </div>
                          <button
                              className="btn h-10 w-10 p-0"
                              onClick={() => props.onToggleSave(p.id)}
                              title={cms.bookmarkButtonTitle}
                          >
                            <i className={`${cms.bookmarkIconClass} text-indigo-600`} />
                          </button>
                        </div>

                        <div className="mt-3 flex gap-2">
                          <button className="btn btn-primary flex-1" onClick={() => props.onRead(p.id)}>
                            <i className={cms.readIconClass} /> {cms.readText}
                          </button>
                          <button
                              className="btn flex-1"
                              onClick={async () => {
                                await copyLink(p.id);
                                alert(cms.copiedAlertTemplate.replace("{id}", p.id));
                              }}
                          >
                            <i className={cms.linkIconClass} /> {cms.linkText}
                          </button>
                        </div>
                      </div>
                  ))}
                </div>
            )}
          </div>
        </div>
      </div>
  );
}