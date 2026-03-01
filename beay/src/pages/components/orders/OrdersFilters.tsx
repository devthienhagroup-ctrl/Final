export type OrdersSort = "date_desc" | "date_asc" | "total_desc" | "total_asc";
export type OrdersStatusFilter = "ALL" | "PAID" | "PENDING" | "REFUND" | "CANCEL";
export type OrdersChannelFilter = "ALL" | "FB" | "GG" | "TT" | "REF" | "EMAIL" | "MANUAL";

export type OrdersFilterState = {
  q: string;
  status: OrdersStatusFilter;
  channel: OrdersChannelFilter;
  sort: OrdersSort;
};

export function OrdersFilters(props: {
  value: OrdersFilterState;
  onChange: (v: OrdersFilterState) => void;
  onApply: () => void;
  onReset: () => void;
}) {
  const v = props.value;

  return (
    <div className="flex items-start justify-between gap-4 flex-col lg:flex-row">
      <div className="flex-1 grid gap-3 md:grid-cols-5">
        <div className="md:col-span-2">
          <div className="text-xs font-extrabold text-slate-500">Tìm kiếm</div>
          <div className="relative mt-2">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="ordersSearch"
              className="input w-full pl-11"
              placeholder="Mã đơn / học viên / khoá học... (phím /)"
              value={v.q}
              onChange={(e) => props.onChange({ ...v, q: e.target.value })}
            />
          </div>
        </div>

        <div>
          <div className="text-xs font-extrabold text-slate-500">Trạng thái</div>
          <select
            className="input w-full mt-2"
            value={v.status}
            onChange={(e) => props.onChange({ ...v, status: e.target.value as OrdersFilterState["status"] })}
          >
            <option value="ALL">Tất cả</option>
            <option value="PAID">Đã thanh toán</option>
            <option value="PENDING">Chờ thanh toán</option>
            <option value="REFUND">Hoàn tiền</option>
            <option value="CANCEL">Huỷ</option>
          </select>
        </div>

        <div>
          <div className="text-xs font-extrabold text-slate-500">Kênh</div>
          <select
            className="input w-full mt-2"
            value={v.channel}
            onChange={(e) => props.onChange({ ...v, channel: e.target.value as OrdersFilterState["channel"] })}
          >
            <option value="ALL">Tất cả</option>
            <option value="FB">Facebook</option>
            <option value="GG">Google</option>
            <option value="TT">Tiktok</option>
            <option value="REF">Referral</option>
            <option value="EMAIL">Email</option>
            <option value="MANUAL">Manual</option>
          </select>
        </div>

        <div>
          <div className="text-xs font-extrabold text-slate-500">Sắp xếp</div>
          <select
            className="input w-full mt-2"
            value={v.sort}
            onChange={(e) => props.onChange({ ...v, sort: e.target.value as OrdersFilterState["sort"] })}
          >
            <option value="date_desc">Mới nhất</option>
            <option value="date_asc">Cũ nhất</option>
            <option value="total_desc">Tổng cao → thấp</option>
            <option value="total_asc">Tổng thấp → cao</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="btn" onClick={props.onReset}>Reset</button>
        <button className="btn btn-primary" onClick={props.onApply}>Áp dụng</button>
      </div>
    </div>
  );
}