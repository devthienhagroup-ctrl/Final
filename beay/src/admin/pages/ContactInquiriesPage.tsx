import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../app/auth";
import {
    adminListContactInquiries,
    adminReplyContactInquiry,
    type ContactInquiry,
} from "../api/contactInquiries.api";

type ChartBarItem = {
    label: string;
    value: number;
    tone?: "blue" | "emerald" | "amber" | "violet";
};

function StatCard({
                      title,
                      value,
                      hint,
                      icon,
                  }: {
    title: string;
    value: string | number;
    hint?: string;
    icon: string;
}) {
    return (
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm">
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-indigo-500/10 blur-2xl" />
            <div className="relative flex items-start justify-between gap-3">
                <div>
                    <div className="mb-2 text-sm font-semibold text-slate-500">{title}</div>
                    <div className="text-3xl font-extrabold leading-none text-slate-900">{value}</div>
                    {hint ? <div className="mt-2 text-xs text-slate-500">{hint}</div> : null}
                </div>
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-indigo-200/70 bg-indigo-50 text-lg text-indigo-700">
                    <i className={icon} />
                </div>
            </div>
        </div>
    );
}

function EmptyState({ title, description }: { title: string; description: string }) {
    return (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center">
            <div className="text-base font-bold text-slate-900">{title}</div>
            <div className="mt-2 text-sm text-slate-500">{description}</div>
        </div>
    );
}

function MiniBarChart({
                          title,
                          subtitle,
                          items,
                      }: {
    title: string;
    subtitle?: string;
    items: ChartBarItem[];
}) {
    const max = Math.max(...items.map((it) => it.value), 1);
    const toneMap: Record<NonNullable<ChartBarItem["tone"]>, string> = {
        blue: "bg-gradient-to-b from-sky-400 to-blue-600",
        emerald: "bg-gradient-to-b from-emerald-400 to-emerald-600",
        amber: "bg-gradient-to-b from-amber-300 to-amber-600",
        violet: "bg-gradient-to-b from-violet-300 to-violet-600",
    };

    return (
        <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm">
            <div className="mb-5">
                <div className="text-base font-extrabold text-slate-900">{title}</div>
                {subtitle ? <div className="mt-1 text-sm text-slate-500">{subtitle}</div> : null}
            </div>

            <div
                className="grid min-h-[220px] items-end gap-3"
                style={{ gridTemplateColumns: `repeat(${Math.max(items.length, 1)}, minmax(0, 1fr))` }}
            >
                {items.map((it, index) => (
                    <div key={`${it.label}-${index}`} className="grid items-end gap-3">
                        <div className="flex h-40 items-end">
                            <div
                                title={`${it.label}: ${it.value}`}
                                className={`w-full rounded-2xl shadow-sm ${toneMap[it.tone || "blue"]}`}
                                style={{
                                    height: `${Math.max((it.value / max) * 100, it.value > 0 ? 10 : 2)}%`,
                                    minHeight: it.value > 0 ? 12 : 4,
                                }}
                            />
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-extrabold text-slate-900">{it.value}</div>
                            <div className="text-xs text-slate-500">{it.label}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function TrendChart({
                        title,
                        subtitle,
                        items,
                    }: {
    title: string;
    subtitle?: string;
    items: Array<{ label: string; value: number }>;
}) {
    const width = 560;
    const height = 220;
    const padX = 22;
    const padTop = 20;
    const padBottom = 34;
    const max = Math.max(...items.map((i) => i.value), 1);
    const stepX = items.length > 1 ? (width - padX * 2) / (items.length - 1) : 0;

    const points = items
        .map((item, index) => {
            const x = padX + index * stepX;
            const y = padTop + (1 - item.value / max) * (height - padTop - padBottom);
            return `${x},${y}`;
        })
        .join(" ");

    const area = `${padX},${height - padBottom} ${points} ${padX + (items.length - 1) * stepX},${height - padBottom}`;

    return (
        <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm">
            <div className="mb-4">
                <div className="text-base font-extrabold text-slate-900">{title}</div>
                {subtitle ? <div className="mt-1 text-sm text-slate-500">{subtitle}</div> : null}
            </div>

            <svg viewBox={`0 0 ${width} ${height}`} className="block h-auto w-full">
                {[0, 1, 2, 3].map((n) => {
                    const y = padTop + ((height - padTop - padBottom) / 3) * n;
                    return (
                        <line
                            key={n}
                            x1={padX}
                            y1={y}
                            x2={width - padX}
                            y2={y}
                            stroke="rgba(148,163,184,0.25)"
                            strokeDasharray="4 6"
                        />
                    );
                })}
                <polygon fill="rgba(99,102,241,0.12)" points={area} />
                <polyline
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="4"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    points={points}
                />
                {items.map((item, index) => {
                    const x = padX + index * stepX;
                    const y = padTop + (1 - item.value / max) * (height - padTop - padBottom);
                    return (
                        <g key={`${item.label}-${index}`}>
                            <circle cx={x} cy={y} r="5" fill="#4f46e5" />
                            <circle cx={x} cy={y} r="10" fill="rgba(79,70,229,0.12)" />
                            <text x={x} y={height - 10} textAnchor="middle" fontSize="12" fill="#64748b">
                                {item.label}
                            </text>
                            <text x={x} y={Math.max(y - 12, 14)} textAnchor="middle" fontSize="12" fill="#0f172a" fontWeight="700">
                                {item.value}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

function DetailRow({ label, value }: { label: string; value?: React.ReactNode }) {
    return (
        <div className="grid grid-cols-[112px_minmax(0,1fr)] items-start gap-3">
            <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</div>
            <div className="break-words leading-7 text-slate-900">{value || "-"}</div>
        </div>
    );
}

function StatusBadge({ status }: { status: ContactInquiry["status"] }) {
    const isReplied = status === "replied";
    return (
        <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${
                isReplied
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
            }`}
        >
      <span className="h-2 w-2 rounded-full bg-current opacity-80" />
            {isReplied ? "Đã phản hồi" : "Mới"}
    </span>
    );
}

export function ContactInquiriesPage() {
    const { token } = useAuth();
    const [items, setItems] = useState<ContactInquiry[]>([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string>("");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<ContactInquiry | null>(null);
    const [subject, setSubject] = useState("Phản hồi từ AYANAVITA");
    const [content, setContent] = useState("");
    const [replying, setReplying] = useState(false);

    const query = useMemo(() => {
        const params: Record<string, string> = {};
        if (status) params.status = status;
        if (search.trim()) params.search = search.trim();
        return params;
    }, [search, status]);

    const loadData = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await adminListContactInquiries(token, query);
            setItems(res.items);
            if (selected) {
                const fresh = res.items.find((it) => it.id === selected.id) || null;
                setSelected(fresh);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, query]);

    useEffect(() => {
        if (!selected) return;
        setSubject(`Phản hồi từ AYANAVITA${selected.name ? ` • ${selected.name}` : ""}`);
    }, [selected]);

    const onReply = async () => {
        if (!token || !selected || !subject.trim() || !content.trim()) return;
        setReplying(true);
        try {
            await adminReplyContactInquiry(token, selected.id, {
                toEmail: selected.email || undefined,
                subject: subject.trim(),
                content: content.trim(),
            });
            setContent("");
            await loadData();
        } finally {
            setReplying(false);
        }
    };

    const stats = useMemo(() => {
        const total = items.length;
        const newCount = items.filter((it) => it.status === "new").length;
        const repliedCount = items.filter((it) => it.status === "replied").length;
        const emailCount = items.filter((it) => !!it.email).length;

        return { total, newCount, repliedCount, emailCount };
    }, [items]);

    const statusChart = useMemo<ChartBarItem[]>(() => {
        return [
            { label: "Mới", value: items.filter((it) => it.status === "new").length, tone: "amber" },
            { label: "Đã phản hồi", value: items.filter((it) => it.status === "replied").length, tone: "emerald" },
            { label: "Có email", value: items.filter((it) => !!it.email).length, tone: "blue" },
            { label: "Có ghi chú", value: items.filter((it) => !!it.note?.trim()).length, tone: "violet" },
        ];
    }, [items]);

    const trendChart = useMemo(() => {
        const fmt = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" });
        const days = Array.from({ length: 7 }, (_, idx) => {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            d.setDate(d.getDate() - (6 - idx));
            return d;
        });

        return days.map((day) => {
            const start = day.getTime();
            const end = start + 24 * 60 * 60 * 1000;
            const value = items.filter((it) => {
                const t = new Date(it.createdAt).getTime();
                return t >= start && t < end;
            }).length;
            return { label: fmt.format(day), value };
        });
    }, [items]);

    const filteredCountText = useMemo(() => {
        if (!status && !search.trim()) return `${items.length} liên hệ`;
        return `${items.length} kết quả phù hợp`;
    }, [items.length, search, status]);

    return (
        <div className="relative grid gap-5 px-4 py-5 md:px-6 xl:px-8">
            <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-800 to-indigo-700 p-6 text-white shadow-xl md:p-7">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.18),transparent_25%)]" />
                <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-3xl">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold">
                            <i className="fa-solid fa-headset" />
                            Hộp thư liên hệ • Admin CRM
                        </div>
                        <h1 className="text-2xl font-extrabold leading-tight md:text-3xl">
                            Quản lý liên hệ khách hàng hiện đại, rõ ràng và thao tác nhanh hơn
                        </h1>
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard title="Tổng liên hệ" value={stats.total} hint="Theo bộ lọc hiện tại" icon="fa-solid fa-inbox" />
                <StatCard title="Liên hệ mới" value={stats.newCount} hint="Ưu tiên xử lý trước" icon="fa-solid fa-bolt" />
                <StatCard title="Đã phản hồi" value={stats.repliedCount} hint="Đã có lịch sử email" icon="fa-solid fa-paper-plane" />
                <StatCard title="Có email" value={stats.emailCount} hint="Có thể phản hồi trực tiếp" icon="fa-solid fa-envelope" />
            </section>

            <section className="grid gap-4">
                <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <div className="text-xl font-extrabold text-slate-900">Bộ lọc & thao tác nhanh</div>
                            <div className="mt-1 text-sm text-slate-500">{filteredCountText}</div>
                        </div>
                        <button
                            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            onClick={() => void loadData()}
                            disabled={loading}
                        >
                            {loading ? "Đang tải..." : "Làm mới dữ liệu"}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(220px,1.8fr)_minmax(180px,0.9fr)_auto]">
                        <div className="relative">
                            <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                                placeholder="Tìm theo tên, số điện thoại, email"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <select
                            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="new">Mới</option>
                            <option value="replied">Đã phản hồi</option>
                        </select>
                        <button
                            className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                            onClick={() => {
                                setSearch("");
                                setStatus("");
                            }}
                        >
                            Xóa lọc
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <MiniBarChart
                        title="Thống kê nhanh theo nhóm"
                        items={statusChart}
                    />
                    <TrendChart
                        title="Xu hướng liên hệ 7 ngày gần đây"
                        items={trendChart}
                    />
                </div>
            </section>

            <section className="overflow-hidden rounded-[28px] border border-slate-200/70 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                    <div>
                        <div className="text-xl font-extrabold text-slate-900">Danh sách liên hệ</div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-[1040px] w-full table-fixed border-separate border-spacing-0">
                        <thead>
                        <tr className="bg-slate-50">
                            <th className="w-24 border-b border-slate-200 px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                                ID
                            </th>
                            <th className="w-[26%] border-b border-slate-200 px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                                Khách hàng
                            </th>
                            <th className="w-[22%] border-b border-slate-200 px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                                Nhu cầu
                            </th>
                            <th className="w-[16%] border-b border-slate-200 px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                                IP
                            </th>
                            <th className="w-[14%] border-b border-slate-200 px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                                Trạng thái
                            </th>
                            <th className="w-[18%] border-b border-slate-200 px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                                Ngày tạo
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-5">
                                    <EmptyState
                                        title="Chưa có liên hệ phù hợp"
                                        description="Thử đổi bộ lọc hoặc làm mới dữ liệu để kiểm tra lại."
                                    />
                                </td>
                            </tr>
                        ) : (
                            items.map((it) => {
                                const active = selected?.id === it.id;
                                return (
                                    <tr
                                        key={it.id}
                                        onClick={() => setSelected(it)}
                                        className={`cursor-pointer align-top transition ${
                                            active ? "bg-indigo-50/70" : "hover:bg-slate-50/90"
                                        }`}
                                    >
                                        <td className="border-b border-slate-100 px-6 py-5 text-sm font-bold text-slate-900">#{it.id}</td>
                                        <td className="border-b border-slate-100 px-6 py-5">
                                            <div className="grid gap-1.5 pr-4">
                                                <div className="break-words text-sm font-bold text-slate-900">{it.name}</div>
                                                <div className="break-words text-sm leading-6 text-slate-500">
                                                    {it.phone || "-"} <span className="mx-1 text-slate-300">•</span> {it.email || "Không có email"}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="border-b border-slate-100 px-6 py-5 text-sm leading-6 text-slate-600">
                                            <div className="line-clamp-2 break-words pr-4">{it.need || "-"}</div>
                                        </td>
                                        <td className="border-b border-slate-100 px-6 py-5 text-sm text-slate-500">
                        <span className="break-all rounded-xl bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600">
                          {it.ipAddress || "-"}
                        </span>
                                        </td>
                                        <td className="border-b border-slate-100 px-6 py-5">
                                            <StatusBadge status={it.status} />
                                        </td>
                                        <td className="border-b border-slate-100 px-6 py-5 text-sm leading-6 text-slate-600">
                                            {new Date(it.createdAt).toLocaleString("vi-VN")}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                </div>
            </section>

            {selected ? (
                <>
                    <div
                        onClick={() => setSelected(null)}
                        className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-[2px]"
                    />
                    <aside className="fixed right-0 top-0 z-[60] grid h-screen w-full max-w-[560px] grid-rows-[auto_1fr_auto] overflow-hidden border-l border-slate-200 bg-white shadow-2xl">
                        <div className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white px-6 py-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="text-2xl font-extrabold text-slate-900">Chi tiết liên hệ #{selected.id}</div>
                                </div>
                                <button
                                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                    onClick={() => setSelected(null)}
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>

                        <div className="grid gap-4 overflow-y-auto px-6 py-5">
                            <div className="grid gap-4 rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-5">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <div className="text-xl font-extrabold text-slate-900">{selected.name || "Khách hàng"}</div>
                                        <div className="mt-1 text-sm text-slate-500">{selected.phone || "Không có số điện thoại"}</div>
                                    </div>
                                    <StatusBadge status={selected.status} />
                                </div>

                                <DetailRow label="Email" value={selected.email || "Không có email"} />
                                <DetailRow label="Nhu cầu" value={selected.need || "Chưa ghi rõ"} />
                                <DetailRow label="Ghi chú" value={selected.note || "Không có ghi chú"} />
                                <DetailRow label="IP" value={<span className="font-mono text-sm">{selected.ipAddress || "-"}</span>} />
                                <DetailRow label="Ngày tạo" value={new Date(selected.createdAt).toLocaleString("vi-VN")} />
                            </div>

                            <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5">
                                <div>
                                    <div className="text-lg font-extrabold text-slate-900">Phản hồi email</div>
                                </div>
                                <input
                                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Tiêu đề email"
                                />
                                <textarea
                                    className="min-h-[180px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                                    rows={8}
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Nội dung phản hồi"
                                />
                            </div>

                            <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5">
                                <div>
                                    <div className="text-lg font-extrabold text-slate-900">Lịch sử phản hồi</div>
                                </div>
                                {selected.replies?.length ? (
                                    <div className="grid gap-3">
                                        {selected.replies.map((r) => (
                                            <div key={r.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                                <div className="flex flex-wrap items-start justify-between gap-2">
                                                    <div className="font-bold text-slate-900">{r.subject}</div>
                                                    <div className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleString("vi-VN")}</div>
                                                </div>
                                                <div className="mt-2 text-sm text-slate-500">{r.staffEmail || "staff"}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState
                                        title="Chưa có phản hồi trước đó"
                                        description="Sau khi gửi email, lịch sử phản hồi sẽ hiển thị tại đây."
                                    />
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-6 py-4">
                            <div className="text-sm text-slate-500">Gửi tới: {selected.email || "Chưa có email khách hàng"}</div>
                            <button
                                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                                onClick={() => void onReply()}
                                disabled={replying || !selected.email || !subject.trim() || !content.trim()}
                            >
                                {replying ? "Đang gửi..." : "Gửi phản hồi email"}
                            </button>
                        </div>
                    </aside>
                </>
            ) : null}
        </div>
    );
}
