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

export function OrdersTable(props: {
  items: Order[];
  page: number;
  totalPages: number;
  showing: number;
  total: number;

  selectedIds: number[];
  onToggleAll: (checked: boolean) => void;
  onToggleOne: (id: number, checked: boolean) => void;

  onPrev: () => void;
  onNext: () => void;

  onOpen: (id: number) => void;
  onCopy: (code: string) => void;

  onBulkPaid: () => void;
  onBulkRefund: () => void;
  onBulkCancel: () => void;
}) {
  const allChecked = props.items.length > 0 && props.items.every((x) => props.selectedIds.includes(x.id));

  return (
    <>
      <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
        <div>
          <div className="text-xs font-extrabold text-slate-500">Danh sách</div>
          <div className="text-lg font-extrabold">Đơn hàng</div>
          <div className="mt-1 text-sm text-slate-600">
            Bulk action + chi tiết drawer. Phím: <b>/</b> search • <b>Esc</b> đóng drawer/modal • <b>g d</b> về Dashboard
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn" onClick={props.onBulkPaid}><i className="fa-solid fa-check mr-1" />Mark PAID</button>
          <button className="btn" onClick={props.onBulkRefund}><i className="fa-solid fa-rotate-left mr-1" />Refund</button>
          <button className="btn" onClick={props.onBulkCancel}><i className="fa-solid fa-ban mr-1" />Huỷ</button>
        </div>
      </div>

      <div className="mt-4 overflow-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr className="border-b border-slate-200">
              <th className="py-3 pr-4 w-10">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={allChecked}
                  onChange={(e) => props.onToggleAll(e.target.checked)}
                />
              </th>
              <th className="py-3 pr-4">Mã</th>
              <th className="py-3 pr-4">Học viên</th>
              <th className="py-3 pr-4">Khoá</th>
              <th className="py-3 pr-4">Kênh</th>
              <th className="py-3 pr-4 text-right">Tổng</th>
              <th className="py-3 pr-4">Trạng thái</th>
              <th className="py-3 pr-4">Ngày</th>
              <th className="py-3">Thao tác</th>
            </tr>
          </thead>

          <tbody className="text-slate-700">
            {props.items.map((o) => {
              const b = badge(o.status);
              const checked = props.selectedIds.includes(o.id);

              return (
                <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 pr-4">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={checked}
                      onChange={(e) => props.onToggleOne(o.id, e.target.checked)}
                    />
                  </td>

                  <td className="py-3 pr-4 font-extrabold cursor-pointer" onClick={() => props.onOpen(o.id)}>
                    {o.code}
                  </td>

                  <td className="py-3 pr-4">
                    {o.student}
                    <div className="text-xs text-slate-500">{o.email}</div>
                  </td>

                  <td className="py-3 pr-4">{o.course}</td>

                  <td className="py-3 pr-4">
                    <span className="chip">{o.channel}</span>
                  </td>

                  <td className="py-3 pr-4 text-right font-extrabold">{money(o.total)}</td>

                  <td className="py-3 pr-4">
                    <span className="chip">
                      <i className={`fa-solid fa-circle ${b.dot} mr-1`} />
                      {b.label}
                    </span>
                  </td>

                  <td className="py-3 pr-4 text-slate-500">{o.date}</td>

                  <td className="py-3">
                    <div className="flex gap-2">
                      <button className="btn px-3 py-2" onClick={() => props.onOpen(o.id)} title="Xem">
                        <i className="fa-solid fa-eye" />
                      </button>
                      <button className="btn px-3 py-2" onClick={() => props.onCopy(o.code)} title="Copy mã">
                        <i className="fa-regular fa-copy" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 flex-col md:flex-row">
        <div className="text-sm text-slate-600">
          Hiển thị <b>{props.showing}</b> / <b>{props.total}</b> đơn
        </div>
        <div className="flex items-center gap-2">
          <button className="btn" onClick={props.onPrev}>Trước</button>
          <div className="chip">Trang <span>{props.page}</span> / {props.totalPages}</div>
          <button className="btn" onClick={props.onNext}>Sau</button>
        </div>
      </div>
    </>
  );
}