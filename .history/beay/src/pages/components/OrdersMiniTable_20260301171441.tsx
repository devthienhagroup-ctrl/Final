

export type OrderMiniStatus = "PAID" | "PENDING" | "REFUND";

export type OrderMini = {
  code: string;
  student: string;
  course: string;
  total: number;
  status: OrderMiniStatus;
  date: string;
};

function moneyVND(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

function statusBadge(s: OrderMiniStatus) {
  if (s === "PAID") return { label: "Đã thanh toán", tone: "text-emerald-500" };
  if (s === "PENDING") return { label: "Chờ thanh toán", tone: "text-amber-500" };
  return { label: "Hoàn tiền", tone: "text-rose-500" };
}

export function OrdersMiniTable(props: { items: OrderMini[]; onOpenOrders: () => void }) {
  return (
    <div className="card p-6 lg:col-span-2" id="orders">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-slate-500">Giao dịch</div>
          <div className="text-lg font-extrabold">Đơn hàng gần đây</div>
          <div className="mt-1 text-sm text-slate-600">Prototype: click để sang trang Orders nâng cao.</div>
        </div>
        <div className="flex gap-2">
          <button className="btn" onClick={props.onOpenOrders}><i className="fa-solid fa-receipt mr-1" />Chi tiết</button>
          <button className="btn" onClick={() => props.onOpenOrders()}>Xuất CSV</button>
        </div>
      </div>

      <div className="mt-5 overflow-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr className="border-b border-slate-200">
              <th className="py-3 pr-4">Mã</th>
              <th className="py-3 pr-4">Học viên</th>
              <th className="py-3 pr-4">Khoá</th>
              <th className="py-3 pr-4">Tổng</th>
              <th className="py-3 pr-4">Trạng thái</th>
              <th className="py-3">Ngày</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {props.items.map((o) => {
              const b = statusBadge(o.status);
              return (
                <tr
                  key={o.code}
                  className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                  onClick={props.onOpenOrders}
                >
                  <td className="py-3 pr-4 font-extrabold">{o.code}</td>
                  <td className="py-3 pr-4">{o.student}</td>
                  <td className="py-3 pr-4">{o.course}</td>
                  <td className="py-3 pr-4 font-extrabold">{moneyVND(o.total)}</td>
                  <td className="py-3 pr-4">
                    <span className="chip">
                      <i className={`fa-solid fa-circle ${b.tone} mr-1`} />
                      {b.label}
                    </span>
                  </td>
                  <td className="py-3 text-slate-500">{o.date}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}