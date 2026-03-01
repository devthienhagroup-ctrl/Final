import React from "react";
import type { BlogPost } from "../../shared/blog.types";
import { copyLink, formatViews, tagLabel } from "../../shared/blog.store";

export type BlogGridCmsData = {
    meta: {
        viewsSuffix: string; // "views"
        copyAlertTemplate: string; // dùng "{hash}" -> "Đã copy link (demo): {hash}"
    };

    chips: {
        tag: { icon: string }; // FA class
        views: { icon: string }; // FA class
    };

    buttons: {
        save: { title: string; icon: string }; // tooltip + icon
        read: { text: string; icon: string };
        copy: { text: string; icon: string };
        reset: { text: string; icon: string };
    };

    emptyState: {
        icon: string;
        title: string;
        description: string;
    };
};

export const defaultCmsData: BlogGridCmsData = {
    meta: {
        viewsSuffix: "views",
        copyAlertTemplate: "Đã copy link (demo): {hash}",
    },
    chips: {
        tag: { icon: "fa-solid fa-tag" },
        views: { icon: "fa-solid fa-fire" },
    },
    buttons: {
        save: { title: "Lưu", icon: "fa-solid fa-bookmark" },
        read: { text: "Đọc bài", icon: "fa-solid fa-book-open" },
        copy: { text: "Copy link", icon: "fa-solid fa-link" },
        reset: { text: "Reset", icon: "fa-solid fa-rotate" },
    },
    emptyState: {
        icon: "fa-solid fa-box-open",
        title: "Không tìm thấy bài viết",
        description: "Thử đổi từ khóa hoặc tag khác.",
    },
};

export function BlogGrid(props: {
    posts: BlogPost[];
    savedIds: Set<string>;
    onRead: (id: string) => void;
    onToggleSave: (id: string) => void;
    onReset: () => void;
    cmsData?: BlogGridCmsData;
}) {
    const empty = props.posts.length === 0;
    const cms = props.cmsData ?? defaultCmsData;

    const safe = {
        meta: {
            viewsSuffix: cms.meta?.viewsSuffix ?? defaultCmsData.meta.viewsSuffix,
            copyAlertTemplate:
                cms.meta?.copyAlertTemplate ?? defaultCmsData.meta.copyAlertTemplate,
        },
        chips: {
            tag: { icon: cms.chips?.tag?.icon ?? defaultCmsData.chips.tag.icon },
            views: { icon: cms.chips?.views?.icon ?? defaultCmsData.chips.views.icon },
        },
        buttons: {
            save: {
                title: cms.buttons?.save?.title ?? defaultCmsData.buttons.save.title,
                icon: cms.buttons?.save?.icon ?? defaultCmsData.buttons.save.icon,
            },
            read: {
                text: cms.buttons?.read?.text ?? defaultCmsData.buttons.read.text,
                icon: cms.buttons?.read?.icon ?? defaultCmsData.buttons.read.icon,
            },
            copy: {
                text: cms.buttons?.copy?.text ?? defaultCmsData.buttons.copy.text,
                icon: cms.buttons?.copy?.icon ?? defaultCmsData.buttons.copy.icon,
            },
            reset: {
                text: cms.buttons?.reset?.text ?? defaultCmsData.buttons.reset.text,
                icon: cms.buttons?.reset?.icon ?? defaultCmsData.buttons.reset.icon,
            },
        },
        emptyState: {
            icon: cms.emptyState?.icon ?? defaultCmsData.emptyState.icon,
            title: cms.emptyState?.title ?? defaultCmsData.emptyState.title,
            description:
                cms.emptyState?.description ?? defaultCmsData.emptyState.description,
        },
    };

    return (
        <div className="max-w-7xl mx-auto px-4">
            <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr" id="grid">
                {props.posts.map((p) => (
                    <article
                        key={p.id}
                        className="card overflow-hidden flex flex-col h-full"
                        id={`post-${p.id}`}
                    >
                        <div className="relative flex-shrink-0">
                            <img src={p.img} alt={p.title} className="w-full h-44 object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/55 to-transparent"></div>

                            <div className="absolute left-4 bottom-4 flex flex-wrap gap-2">
                <span className="chip">
                  <i className={`${safe.chips.tag.icon} text-emerald-600`} />
                    {tagLabel(p.tag)}
                </span>

                                <span className="chip">
                  <i className={`${safe.chips.views.icon} text-rose-600`} />
                                    {formatViews(p.views)} {safe.meta.viewsSuffix}
                </span>
                            </div>
                        </div>

                        <div className="p-6 flex flex-col flex-1">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="text-lg font-extrabold">{p.title}</div>
                                    <div className="text-sm text-slate-600 mt-1">
                                        <b>{p.author}</b> • <span className="text-slate-400">{p.date}</span>
                                    </div>
                                </div>

                                <button
                                    className="btn h-10 w-10 p-0 flex-shrink-0"
                                    onClick={() => props.onToggleSave(p.id)}
                                    title={safe.buttons.save.title}
                                >
                                    <i
                                        className={
                                            `${safe.buttons.save.icon} ` +
                                            (props.savedIds.has(p.id) ? "text-indigo-600" : "text-slate-400")
                                        }
                                    />
                                </button>
                            </div>

                            <p className="mt-3 text-slate-700 leading-relaxed flex-1">{p.excerpt}</p>

                            <div className="mt-5 flex gap-2">
                                <button
                                    className="btn btn-primary hover:text-purple-800 flex-1"
                                    onClick={() => props.onRead(p.id)}
                                >
                                    <i className={safe.buttons.read.icon} /> {safe.buttons.read.text}
                                </button>

                                <button
                                    className="btn flex-1"
                                    onClick={async () => {
                                        await copyLink(p.id);
                                        const hash = `#post-${p.id}`;
                                        alert(safe.meta.copyAlertTemplate.replace("{hash}", hash));
                                    }}
                                >
                                    <i className={safe.buttons.copy.icon} /> {safe.buttons.copy.text}
                                </button>
                            </div>
                        </div>
                    </article>
                ))}
            </div>

            {empty ? (
                <div className="mt-10 card p-8 text-center">
                    <div className="text-4xl">
                        <i className={`${safe.emptyState.icon} text-slate-400`} />
                    </div>
                    <div className="mt-2 text-xl font-extrabold">{safe.emptyState.title}</div>
                    <div className="mt-2 text-slate-600">{safe.emptyState.description}</div>
                    <button className="btn btn-primary mt-4" onClick={props.onReset}>
                        <i className={safe.buttons.reset.icon} /> {safe.buttons.reset.text}
                    </button>
                </div>
            ) : null}
        </div>
    );
}