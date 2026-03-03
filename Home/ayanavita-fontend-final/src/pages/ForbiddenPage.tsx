import { Link } from "react-router-dom";

export default function ForbiddenPage() {
  return (
    <main className="min-h-[70vh] bg-gradient-to-b from-rose-50 to-white px-4 py-16">
      <div className="mx-auto max-w-3xl rounded-3xl border border-rose-100 bg-white/95 p-8 text-center shadow-xl md:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-500">403</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900 md:text-5xl">Bạn chưa có quyền truy cập</h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">
          Tài khoản hiện tại không có quyền mở trang này. Vui lòng liên hệ quản trị viên hoặc quay lại khu
          vực cho phép.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Về trang chủ
          </Link>
          <Link
            to="/account-center"
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Vào trung tâm tài khoản
          </Link>
        </div>
      </div>
    </main>
  );
}
