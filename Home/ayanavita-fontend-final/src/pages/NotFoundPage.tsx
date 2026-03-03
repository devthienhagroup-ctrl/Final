import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="min-h-[70vh] bg-gradient-to-b from-slate-50 to-white px-4 py-16">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white/95 p-8 text-center shadow-xl md:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-500">404</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900 md:text-5xl">Trang bạn tìm không tồn tại</h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">
          Đường dẫn này có thể đã bị thay đổi hoặc bị xoá. Bạn có thể quay về trang chủ để tiếp tục trải
          nghiệm.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Về trang chủ
          </Link>
          <Link
            to="/courses"
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Khám phá khóa học
          </Link>
        </div>
      </div>
    </main>
  );
}
