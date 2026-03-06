import { useAuth } from "../../app/auth";
import {Link} from "react-router-dom";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function AdminSidebar({ open, onClose }: Props) {
  const { can, logout } = useAuth();

  function handleLogout() {
    onClose();
    logout();
  }

  return (
    <aside
      className={[
        "fixed z-50 md:static md:z-auto inset-y-0 left-0 w-72",
        "bg-white/90 backdrop-blur border-r border-slate-200/70",
        "transition-transform duration-200",
        open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      ].join(" ")}
    >
      <div className="h-48 py-2 px-5 items-center justify-between border-b border-slate-200/70">
        <div className=" p-4">
          <div className="flex items-center gap-3">
            <img
                className="h-11 w-11 rounded-2xl object-cover ring-1 ring-slate-200"
                src="/imgs/Logo-Ayanavita.png"
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
        <button type="button" className="w-full text-center btn" onClick={handleLogout}>
          <i className="fa-solid fa-arrow-right-from-bracket fa-rotate-180"></i> Đăng xuất
        </button>

      </div>

      <div className="p-5">
        <div className="mt-4 card p-3">
          <div className="text-xs font-semibold text-slate-500">Đi nhanh</div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            {can("orders.write") ? <a className="btn text-center" href="/admin/orders"><i className="fa-solid fa-receipt mr-1" />Đơn hàng</a> : null}
            {can("role.write") ? <a className="btn text-center" href="/admin/rbac"><i className="fa-solid fa-user-shield mr-1" />Phân quyền</a> : null}
          </div>
        </div>

        <nav className="mt-5 space-y-2">
          <Link to="#overview" className="flex items-center gap-3 px-4 py-3 rounded-2xl nav-active">
            <i className="fa-solid fa-gauge-high text-indigo-600" />
            <span className="font-semibold">Tổng quan</span>
          </Link>
          <Link to="/admin/courses" className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50">
            <i className="fa-solid fa-book-open text-amber-600" />
            <span className="font-semibold">Khóa học</span>
          </Link>
          {can("packages.read") ? (
            <Link to="/admin/course-plans" className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50">
              <i className="fa-solid fa-layer-group text-sky-700" />
              <span className="font-semibold">Gói dịch vụ khóa học</span>
            </Link>
          ) : null}
          {/* thêm link: sản phẩm /admin/product */}
          <Link to="/admin/product" className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50">
            <i className="fa-solid fa-box text-emerald-700" />
            <span className="font-semibold">Sản phẩm</span>
          </Link>
          <Link to="/admin/services" className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50">
            <i className="fa-solid fa-spa text-violet-700" />
            <span className="font-semibold">Dịch vụ</span>
          </Link>
          <Link to="/admin/orders" className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50">
            <i className="fa-solid fa-bag-shopping text-emerald-700" />
            <span className="font-semibold">Đơn hàng</span>
          </Link>
          <Link to="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50">
            <i className="fa-solid fa-users-gear text-indigo-700" />
            <span className="font-semibold">User Management</span>
          </Link>
          {/* Thêm link: CMS /admin/cms */}
          <Link to="/admin/cms" className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50">
            <i className="fa-solid fa-file-lines text-slate-700" />
            <span className="font-semibold">CMS</span>
          </Link>
          {/* Thêm link: Đánh giá /admin/reviews */}
          <Link to="/admin/reviews" className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50">
            <i className="fa-solid fa-star text-yellow-700" />
            <span className="font-semibold">Đánh giá</span>
          </Link>

          <Link to="/admin/blog" className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50">
            <i className="fa-solid fa-newspaper text-yellow-700" />
            <span className="font-semibold">Quản lý blog</span>
          </Link>

          {/*<a href="#settings" className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50">*/}
          {/*  <i className="fa-solid fa-gear text-slate-700" />*/}
          {/*  <span className="font-semibold">Cài đặt</span>*/}
          {/*</a>*/}
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



