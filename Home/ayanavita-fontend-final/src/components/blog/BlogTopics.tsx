import React from "react";

type BlogTag = "all" | "skincare" | "massage" | "wellness" | "franchise";

export type BlogTopicsCmsData = {
    // Nội dung text (không chứa màu sắc/kích thước/spacing...)
    eyebrow: string;
    topics: Array<{
        tag: BlogTag;
        label: string;
        // Cho phép truyền class icon FontAwesome (ví dụ: "fa-solid fa-leaf")
        iconClass: string;
    }>;
    savedLabel: string;
    savedIconClass: string;
};

export const defaultBlogTopicsCmsData: BlogTopicsCmsData = {
    eyebrow: "Chủ đề",
    topics: [
        { tag: "skincare", label: "Skincare", iconClass: "fa-solid fa-bottle-droplet" },
        { tag: "massage", label: "Massage", iconClass: "fa-solid fa-hand-sparkles" },
        { tag: "wellness", label: "Wellness", iconClass: "fa-solid fa-leaf" },
        { tag: "franchise", label: "Nhượng quyền", iconClass: "fa-solid fa-store" },
        { tag: "all", label: "Tất cả", iconClass: "fa-solid fa-layer-group" },
    ],
    savedLabel: "Các blog đã lưu",
    savedIconClass: "fa-solid fa-bookmark",
};

function getTopicStyles(tag: BlogTag) {
    switch (tag) {
        case "skincare":
            return {
                activeChip: "bg-amber-50 border-amber-300 text-amber-700 shadow-sm",
                hoverChip: "hover:bg-amber-50 hover:border-amber-200",
                iconActive: "text-amber-700",
                iconIdle: "text-amber-600",
            };
        case "massage":
            return {
                activeChip: "bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm",
                hoverChip: "hover:bg-indigo-50 hover:border-indigo-200",
                iconActive: "text-indigo-700",
                iconIdle: "text-indigo-600",
            };
        case "wellness":
            return {
                activeChip: "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm",
                hoverChip: "hover:bg-emerald-50 hover:border-emerald-200",
                iconActive: "text-emerald-700",
                iconIdle: "text-emerald-600",
            };
        case "franchise":
            return {
                activeChip: "bg-slate-100 border-slate-400 text-slate-800 shadow-sm",
                hoverChip: "hover:bg-slate-100 hover:border-slate-300",
                iconActive: "text-slate-800",
                iconIdle: "text-slate-700",
            };
        case "all":
        default:
            return {
                activeChip: "bg-indigo-100 border-indigo-400 text-indigo-800 shadow-md font-bold",
                hoverChip: "hover:bg-indigo-50 hover:border-indigo-200",
                iconActive: "text-indigo-800",
                iconIdle: "text-indigo-600",
            };
    }
}

export function BlogTopics(props: {
    onQuick: (tag: BlogTag) => void;
    onOpenSaved?: () => void;
    activeTag?: BlogTag;
    cmsData?: Partial<BlogTopicsCmsData>;
}) {
    // Fallback: lấy nội dung hiện tại làm mẫu nếu không nhận cmsData
    // Lưu ý: topics là mảng nên ưu tiên "replace" (không merge từng item)
    const cms: BlogTopicsCmsData = {
        ...defaultBlogTopicsCmsData,
        ...props.cmsData,
        topics: props.cmsData?.topics ?? defaultBlogTopicsCmsData.topics,
    };

    return (
        <section id="topics" className="max-w-7xl mx-auto px-4 py-14">
            <div className="text-xs font-extrabold text-slate-500">{cms.eyebrow}</div>

            <div className="flex justify-between">
                <div className="mt-1 flex flex-wrap gap-2">
                    {cms.topics.map((t) => {
                        const isActive = props.activeTag === t.tag;
                        const styles = getTopicStyles(t.tag);

                        return (
                            <button
                                key={t.tag}
                                className={`chip transition-all duration-200 ${
                                    isActive ? styles.activeChip : styles.hoverChip
                                }`}
                                onClick={() => props.onQuick(t.tag)}
                            >
                                <i
                                    className={`${t.iconClass} ${
                                        isActive ? styles.iconActive : styles.iconIdle
                                    }`}
                                />{" "}
                                {t.label}
                            </button>
                        );
                    })}
                </div>

                <button
                    className="chip hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 transition-all duration-200 active:scale-95 active:bg-indigo-100"
                    onClick={() => props.onOpenSaved?.()}
                >
                    <i className={`${cms.savedIconClass} text-indigo-600`} />
                    {cms.savedLabel}
                </button>
            </div>
        </section>
    );
}