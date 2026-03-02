
export type TopCourse = {
  name: string;
  revenue: number;
  orders: number;
  trend: string;
  icon: "mobile-screen" | "layer-group" | "cubes" | "bullhorn";
  tone: "cyan" | "indigo" | "amber" | "emerald";
};

function moneyVND(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

export function TopCoursesCard(props: {
  items: TopCourse[];
  onManage: () => void;
  onIdea: () => void;
}) {
  const toneToBg = (t: TopCourse["tone"]) =>
    t === "cyan" ? "bg-cyan-100 text-cyan-700"
    : t === "indigo" ? "bg-indigo-100 text-indigo-700"
    : t === "amber" ? "bg-amber-100 text-amber-700"
    : "bg-emerald-100 text-emerald-700";

  return (
    <div className="card p-6" id="courses">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-slate-500">Top khóa học</div>
          <div className="text-lg font-extrabold">Bán chạy</div>
          <div className="mt-1 text-sm text-slate-600">Theo doanh thu trong kỳ.</div>
        </div>
        <button className="btn" onClick={props.onManage}>Quản lý</button>
      </div>

      <div className="mt-5 space-y-4">
        {props.items.map((c) => (
          <div key={c.name} className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`h-11 w-11 rounded-2xl flex items-center justify-center ${toneToBg(c.tone)}`}>
                <i className={`fa-solid fa-${c.icon}`} />
              </div>
              <div>
                <div className="font-extrabold">{c.name}</div>
                <div className="text-xs text-slate-500">{c.orders} đơn • {c.trend}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-extrabold">{moneyVND(c.revenue)}</div>
              <div className="text-xs text-slate-500">Doanh thu</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 p-4 rounded-2xl bg-slate-50 ring-1 ring-slate-200">
        <div className="text-xs font-extrabold text-slate-500">Gợi ý tối ưu</div>
        <div className="mt-1 text-sm text-slate-600">Thêm upsell, bundle, voucher theo cohort.</div>
        <button className="mt-3 w-full btn btn-accent" onClick={props.onIdea}>Tạo chiến dịch</button>
      </div>
    </div>
  );
}