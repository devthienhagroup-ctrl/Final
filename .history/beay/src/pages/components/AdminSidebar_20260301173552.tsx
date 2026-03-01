import React from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onConnectPay: () => void;
};

export function AdminSidebar({ open, onClose, onConnectPay }: Props) {
  return (
    <aside
      className={[
        "fixed z-50 md:static md:z-auto inset-y-0 left-0 w-72",
        "bg-white/90 backdrop-blur border-r border-slate-200/70",
        "transition-transform duration-200",
        open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      ].join(" ")}
    >
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200/70">
        <a href="/admin/dashboard" className="flex items-center gap-2 font-extrabold">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <span className="text-white text-lg">A</span>
          </div>
          <div>
            <div className="text-sm text-slate-500 font-semibold -mb-1">AYANAVITA</div>
            <div className="text-lg">Admin</div>
          </div>
        </a>
        <button onClick={onClose} className="md:hidden h-10 w-10 rounded-2xl bg-slate-50 ring-1 ring-slate-200 hover:bg-slate-100">
          <i className="fa-solid fa-xmark" />
        </button>
      </div>

      <div className="p-5">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <img
              className="h-11 w-11 rounded-2xl object-cover ring-1 ring-slate-200"
              src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80"
              alt="Admin"
            />
            <div>
              <div className="font-extrabold">Admin AYANAVITA</div>
              <div className="text-xs text-slate-500">admin@ayanavita.vn</div>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <span className="chip"><i className="fa-solid fa-shield-halved text-indigo-600 mr-1" /> Admin</span>
            <span className="chip"><i className="fa-solid fa-circle text-emerald-500 mr-1" /> Online</span>
          </div>
        </div>

        <div className="mt-4 card p-3">
          <div className="text-xs font-semibold text-slate-500">Đi nhanh</div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <a className="btn text-center" href="/admin/orders"><i className="fa-solid fa-receipt mr-1" />Đơn hàng</a>
            <a className="btn text-center" href="/admin/rbac"><i className="fa-solid fa-user-shield mr-1" />Phân quyền</a>
            <a className="btn text-center" href="/instructor"><i className="fa-solid fa-chalkboard-user mr-1" />Giảng viên</a>
            <a className="btn text-center" href="/student"><i className="fa-solid fa-user-graduate mr-1" />Học viên</a>
          </div>
        </div>

        <nav className="mt-5 space-y-2">
          <a href="#overview" className="flex items-center gap-3 px-4 py-3 rounded-2xl nav-active">
            <i className="fa-solid fa-gauge-high text-indigo-600" />
            <span className="font-semibold">Tổng quan</span>
          </a>
          <a href="#courses" className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50">
            <i className="fa-solid fa-book-open text-amber-600" />
            <span className="font-semibold">Khóa học</span>
          </a>
          <a href="#students" className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50">
            <i className="fa-solid fa-users text-cyan-700" />
            <span className="font-semibold">Học viên</span>
          </a>
          <a href="#orders" className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50">
            <i className="fa-solid fa-bag-shopping text-emerald-700" />
            <span className="font-semibold">Đơn hàng</span>
          </a>
          <a href="#analytics" className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50">
            <i className="fa-solid fa-chart-line text-violet-700" />
            <span className="font-semibold">Báo cáo</span>
          </a>
          <a href="#settings" className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50">
            <i className="fa-solid fa-gear text-slate-700" />
            <span className="font-semibold">Cài đặt</span>
          </a>
        </nav>

        {/* <div className="mt-6 card p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-slate-500">Gợi ý</div>
              <div className="mt-1 font-extrabold">Thiết lập thanh toán</div>
              <div className="mt-1 text-sm text-slate-600">Kết nối MoMo/VNPay/Stripe để bán khoá học.</div>
            </div>
            <div className="h-10 w-10 rounded-2xl bg-amber-100 flex items-center justify-center">
              <i className="fa-solid fa-bolt text-amber-700" />
            </div>
          </div>
          <button onClick={onConnectPay} className="mt-4 w-full btn btn-accent">Kết nối ngay</button>
          <div className="mt-3 text-xs text-slate-500">
            Mẹo: <span className="kbd">/</span> focus search • <span className="kbd">g</span> <span className="kbd">o</span> sang Orders
          </div>
        </div> */}
      </div>
    </aside>
  );
}