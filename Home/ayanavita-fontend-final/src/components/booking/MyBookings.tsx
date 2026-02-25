// src/components/booking/MyBookings.tsx
import React from "react";
import type { Booking, BookingStatus } from "../../services/booking.storage";
import { money } from "../../services/booking.utils";

export type MyBookingsCmsData = {
    title: string;
    clearButtonText: string;
    clearButtonIconClass: string;

    statusConfirmedText: string;
    statusPendingText: string;
    statusCancelledText: string;

    setPendingButtonText: string;
    setCancelledButtonText: string;

    staffLabel: string;
    minutesLabel: string;

    emptyStateText: string;
};

const defaultCmsData: MyBookingsCmsData = {
    title: "Lịch đã đặt",
    clearButtonText: "Xóa",
    clearButtonIconClass: "fa-solid fa-trash-can",

    statusConfirmedText: "Confirmed",
    statusPendingText: "Pending",
    statusCancelledText: "Cancelled",

    setPendingButtonText: "Chờ",
    setCancelledButtonText: "Hủy",

    staffLabel: "Chuyên viên",
    minutesLabel: "phút",

    emptyStateText: "Chưa có lịch hẹn. Hãy tạo lịch hẹn ở form bên trái.",
};

function StatusBadge({
                         status,
                         cms,
                     }: {
    status: BookingStatus;
    cms: MyBookingsCmsData;
}) {
    if (status === "confirmed")
        return (
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-extrabold">
        <span className="text-emerald-500">●</span> {cms.statusConfirmedText}
      </span>
        );
    if (status === "pending")
        return (
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-extrabold">
        <span className="text-amber-500">●</span> {cms.statusPendingText}
      </span>
        );
    return (
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-extrabold">
      <span className="text-slate-400">●</span> {cms.statusCancelledText}
    </span>
    );
}

export function MyBookings({
                               list,
                               onSetStatus,
                               onClear,
                               cmsData,
                           }: {
    list: Booking[];
    onSetStatus: (id: string, status: BookingStatus) => void;
    onClear: () => void;
    cmsData?: Partial<MyBookingsCmsData>;
}) {
    const cms: MyBookingsCmsData = { ...defaultCmsData, ...(cmsData || {}) };

    return (
        <div className="mt-4 border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between">
                <div className="font-extrabold">{cms.title}</div>
                <button
                    type="button"
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold hover:bg-slate-50"
                    onClick={onClear}
                >
                    <i className={cms.clearButtonIconClass}></i> {cms.clearButtonText}
                </button>
            </div>

            <div className="mt-3 grid gap-2">
                {list.length ? (
                    list.slice(0, 5).map((b) => (
                        <div key={b.id} className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <div className="font-extrabold">{b.serviceName}</div>
                                    <div className="mt-1 text-xs text-slate-500">
                                        {b.id} • {b.branchName}
                                    </div>

                                    <div className="mt-2 text-sm text-slate-700">
                                        <i className="fa-solid fa-calendar-day"></i> <b>{b.date}</b>{" "}
                                        <span className="text-slate-400">•</span>{" "}
                                        <i className="fa-solid fa-clock"></i> <b>{b.time}</b>
                                    </div>

                                    <div className="mt-1 text-xs text-slate-500">
                                        {cms.staffLabel}: {b.staffName} • {b.duration} {cms.minutesLabel} •{" "}
                                        {money(b.price || 0)}
                                    </div>
                                </div>

                                <div className="grid justify-items-end gap-2">
                                    <StatusBadge status={b.status} cms={cms} />
                                    <div className="flex gap-2">
                                        <button
                                            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-extrabold hover:bg-white"
                                            onClick={() => onSetStatus(b.id, "pending")}
                                            type="button"
                                        >
                                            {cms.setPendingButtonText}
                                        </button>
                                        <button
                                            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-extrabold hover:bg-white"
                                            onClick={() => onSetStatus(b.id, "cancelled")}
                                            type="button"
                                        >
                                            {cms.setCancelledButtonText}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200 text-sm text-slate-600">
                        {cms.emptyStateText}
                    </div>
                )}
            </div>

            {/*
      <div className="mt-2 text-xs text-slate-500">
        Lưu localStorage: <b>aya_bookings_v1</b>
      </div>
      */}
        </div>
    );
}