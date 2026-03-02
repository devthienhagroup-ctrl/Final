import React from "react";

type Props = {
  onOpenSidebar: () => void;

  theme: "light" | "dark";
  onToggleTheme: () => void;

  rangeDays: number;
  onRangeChange: (v: number) => void;

  search: string;
  onSearchChange: (v: string) => void;

  onOpenNotif: () => void;
  onCreateCourse: () => void;
};

export function AdminTopbar(props: Props) {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200/70">
      <div className="h-16 px-4 md:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={props.onOpenSidebar}
            className="md:hidden h-10 w-10 rounded-2xl bg-slate-50 ring-1 ring-slate-200 hover:bg-slate-100"
          >
            <i className="fa-solid fa-bars" />
          </button>

          <div className="hidden md:block">
            <div className="text-sm text-slate-500 font-semibold">Chào mừng trở lại</div>
            <div className="text-lg font-extrabold">Dashboard tổng quan</div>
          </div>
        </div>

        <div className="flex-1 max-w-xl">
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="adminSearchInput"
              className="input pl-11"
              placeholder="Tìm khóa học, học viên, đơn hàng... (phím /)"
              value={props.search}
              onChange={(e) => props.onSearchChange(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            className="btn"
            value={String(props.rangeDays)}
            onChange={(e) => props.onRangeChange(Number(e.target.value))}
          >
            <option value="7">7 ngày</option>
            <option value="30">30 ngày</option>
            <option value="90">90 ngày</option>
          </select>

          <button onClick={props.onToggleTheme} className="btn hidden md:inline-flex items-center gap-2" title="Đổi theme">
            <i className={`fa-solid ${props.theme === "dark" ? "fa-sun" : "fa-moon"}`} />
            Theme
          </button>

          <button onClick={props.onOpenNotif} className="btn hidden md:inline-flex items-center gap-2">
            <i className="fa-regular fa-bell" />
            Thông báo
          </button>

          <button onClick={props.onCreateCourse} className="btn btn-primary inline-flex items-center gap-2">
            <i className="fa-solid fa-plus" />
            Tạo khóa học
          </button>
        </div>
      </div>
    </header>
  );
}