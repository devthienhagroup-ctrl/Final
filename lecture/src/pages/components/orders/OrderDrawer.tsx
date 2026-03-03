import type { Order } from "../../admin/AdminOrdersPage";


function money(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

function badge(status: Order["status"]) {
  if (status === "PAID") return { label: "Đã thanh toán", dot: "text-emerald-500" };
  if (status === "PENDING") return { label: "Chờ thanh toán", dot: "text-amber-500" };
  if (status === "REFUND") return { label: "Hoàn tiền", dot: "text-rose-500" };
  return { label: "Huỷ", dot: "text-slate-500" };
}

export function OrderDrawer(props: {
  open: boolean;
  order: Order | null;
  onClose: () => void;
  onAction: (a: "paid" | "refund" | "cancel" | "invoice") => void;
}) {
  const o = props.order;

  return (
    <>
      <div className={`fixed inset-0 bg-black/40 z-40 ${props.open ? "" : "hidden"}`} onClick={props.onClose} />
      <aside
        className={[
          "fixed top-0 right-0 h-full w-full sm:w-[540px] bg-white z-50 border-l border-slate-200",
          "transition-transform duration-200",
          props.open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200">
          <div>
            <div className="text-xs font-extrabold text-slate-500">Chi tiết đơn</div>
            <div className="text-lg font-extrabold">{o?.code ?? "#OD-xxxxx"}</div>
          </div>
          <button className="btn h-10 w-10 p-0 rounded-2xl" onClick={props.onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-auto h-[calc(100%-64px)]">
          <div className="card p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-extrabold text-slate-500">Học viên</div>
                <div className="mt-1 font-extrabold">{o?.student ?? "—"}</div>
                <div className="text-sm text-slate-600">{o?.email ?? "—"}</div>
              </div>

              <div className="chip">
                {o ? (
                  <>
                    <i className={`fa-solid fa-circle ${badge(o.status).dot} mr-1`} />
                    {badge(o.status).label}
                  </>
                ) : (
                  "—"
                )}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-2xl bg-slate-50 ring-1 ring-slate-200">
                <div className="text-xs font-extrabold text-slate-500">Tổng tiền</div>
                <div className="mt-1 font-extrabold">{o ? money(o.total) : "—"}</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 ring-1 ring-slate-200">
                <div className="text-xs font-extrabold text-slate-500">Kênh</div>
                <div className="mt-1 font-extrabold">{o?.channel ?? "—"}</div>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="text-xs font-extrabold text-slate-500">Khoá học</div>
            <div className="mt-1 text-lg font-extrabold">{o?.course ?? "—"}</div>
            <div className="text-sm text-slate-600 mt-1">{o ? `Ngày: ${o.date}` : "—"}</div>

            <div className="mt-3 p-3 rounded-2xl bg-slate-50 ring-1 ring-slate-200 text-sm text-slate-600">
              Prototype logic: mark PAID → tạo/đổi Enrollment ACTIVE.
            </div>
          </div>

          <div className="card p-4">
            <div className="text-xs font-extrabold text-slate-500">Thao tác</div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button className="btn btn-primary" onClick={() => props.onAction("paid")}>
                <i className="fa-solid fa-check mr-1" />Mark PAID
              </button>
              <button className="btn btn-accent" onClick={() => props.onAction("refund")}>
                <i className="fa-solid fa-rotate-left mr-1" />Refund
              </button>
              <button className="btn" onClick={() => props.onAction("cancel")}>
                <i className="fa-solid fa-ban mr-1" />Huỷ
              </button>
              <button className="btn" onClick={() => props.onAction("invoice")}>
                <i className="fa-solid fa-receipt mr-1" />Xuất hoá đơn
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}