// src/components/home/Stats.tsx
import React from "react";

type Tone = "amber" | "indigo" | "cyan" | "emerald";

// Định nghĩa kiểu cho mỗi item trong cmsData
export interface StatsItem {
    icon: string;       // class name cho icon (ví dụ: "fa-solid fa-users")
    value: string;
    label: string;
}

interface ItemProps {
    icon: string;       // nhận string thay vì ReactNode
    value: string;
    label: string;
    tone: Tone;
}

const Item: React.FC<ItemProps> = ({ icon, value, label, tone }) => {
    const toneMap: Record<Tone, string> = {
        amber: "bg-amber-100 text-amber-700",
        indigo: "bg-indigo-100 text-indigo-700",
        cyan: "bg-cyan-100 text-cyan-700",
        emerald: "bg-emerald-100 text-emerald-700",
    };

    return (
        <div className="rounded-3xl bg-white p-6 text-center ring-1 ring-slate-200 shadow-sm hover:shadow-md transition duration-300">
            <div
                className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-2xl ${toneMap[tone]}`}
            >
                {/* Render icon từ string className */}
                <i className={icon}></i>
            </div>

            <div className="text-3xl font-extrabold text-slate-900">{value}</div>
            <div className="mt-1 text-sm text-slate-600">{label}</div>
        </div>
    );
};

// Props cho Stats component
interface StatsProps {
    cmsData?: StatsItem[];   // nếu không có, dùng dữ liệu mẫu
}

export const Stats: React.FC<StatsProps> = ({ cmsData }) => {
    // Dữ liệu mẫu (fallback) – chuyển các icon thành string
    const defaultData: StatsItem[] = [
        { icon: "fa-solid fa-users", value: "30K+", label: "Học viên" },
        { icon: "fa-solid fa-book", value: "120+", label: "Khóa học" },
        { icon: "fa-solid fa-graduation-cap", value: "50+", label: "Giảng viên" },
        { icon: "fa-solid fa-star", value: "4.8★", label: "Đánh giá" },
    ];

    const data = cmsData || defaultData;

    // Mảng tone mặc định, có thể lặp lại nếu data dài hơn
    const tones: Tone[] = ["amber", "indigo", "cyan", "emerald"];

    return (
        <section className="w-full py-8">
            <div className="mx-auto max-w-6xl px-4">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {data.map((item, index) => {
                        // Lấy tone theo index (vòng tròn nếu cần)
                        const tone = tones[index % tones.length];
                        return (
                            <Item
                                key={index}
                                icon={item.icon}
                                value={item.value}
                                label={item.label}
                                tone={tone}
                            />
                        );
                    })}
                </div>
            </div>
        </section>
    );
};