import React, { useMemo } from "react";

type Notif = { title: string; desc: string; time: string; tone: "emerald" | "amber" | "indigo" };

export function NotificationsDrawer(props: { open: boolean; onClose: () => void }) {
  const data = useMemo<Notif[]>(
    () => [
      { title: "Đơn hàng mới #OD-12952", desc: "Khách thanh toán VNPay • 799.000đ", time: "2 phút trước", tone: "emerald" },
      { title: "Cảnh báo drop-off tăng", desc: "Tuần này +2.1% so với tuần trước", time: "1 giờ trước", tone: "amber" },
      { title: "Giảng viên đăng bài mới", desc: "Khoá Flutter LMS • Bài 09", time: "Hôm nay", tone: "indigo" },
      { title: "Checklist go-live", desc: "Bạn còn thiếu: Kết nối thanh toán", time: "Gợi ý", tone: "amber" },
    ],
    []
  );

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 z-[60] ${props.open ? "" : "hidden"}`}
        onClick={props.onClose}
      />
      <aside
        className={[
          "fixed top-0 right-0 h-full w-full max-w-[460px] z-[70] border-l border-slate-200/70",
          "bg-white",
          "transition-transform duration-200",
          props.open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200/70">
          <div>
            <div className="text-xs font-extrabold text-slate-500">Trung tâm</div>
            <div className="text-lg font-extrabold">Thông báo</div>
          </div>
          <button onClick={props.onClose} className="btn h-10 w-10 p-0 rounded-2xl">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="p-5 space-y-3 overflow-auto h-[calc(100%-64px)]">
          {data.map((n, idx) => (
            <div key={idx} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-extrabold">{n.title}</div>
                  <div className="mt-1 text-sm text-slate-600">{n.desc}</div>
                </div>
                <span className="chip">
                  <i className={`fa-solid fa-circle text-${n.tone}-500 mr-1`} />
                  {n.time}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <button className="btn flex-1">Xem</button>
                <button className="btn">Đánh dấu đã đọc</button>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}