function money(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

export function OrdersSummary(props: { totalOrders: number; revenue: number; paidRate: number; refund: number }) {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      <div className="p-4 rounded-2xl bg-slate-50 ring-1 ring-slate-200">
        <div className="text-xs font-extrabold text-slate-500">Tổng đơn</div>
        <div className="mt-1 text-2xl font-extrabold">{props.totalOrders}</div>
      </div>
      <div className="p-4 rounded-2xl bg-slate-50 ring-1 ring-slate-200">
        <div className="text-xs font-extrabold text-slate-500">Doanh thu (PAID)</div>
        <div className="mt-1 text-2xl font-extrabold">{money(props.revenue)}</div>
      </div>
      <div className="p-4 rounded-2xl bg-slate-50 ring-1 ring-slate-200">
        <div className="text-xs font-extrabold text-slate-500">Tỉ lệ thanh toán</div>
        <div className="mt-1 text-2xl font-extrabold">{props.paidRate}%</div>
      </div>
      <div className="p-4 rounded-2xl bg-slate-50 ring-1 ring-slate-200">
        <div className="text-xs font-extrabold text-slate-500">Hoàn tiền</div>
        <div className="mt-1 text-2xl font-extrabold">{money(props.refund)}</div>
      </div>
    </div>
  );
}