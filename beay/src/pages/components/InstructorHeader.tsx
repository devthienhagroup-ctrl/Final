// src/pages/instructor/components/InstructorHeader.tsx
type Props = {
  onOpenStudent: () => void;
  onOpenRbac: () => void;
  onNotif: () => void;
  onNewCourse: () => void;
  onLogout: () => void;
};

export function InstructorHeader(props: Props) {
  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-slate-200/70">
      <div className="h-16 px-4 md:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25"
            title="Home"
          >
            <span className="text-white font-extrabold">A</span>
          </a>
          <div>
            <div className="text-xs text-slate-500 font-semibold -mb-1">AYANAVITA • Instructor</div>
            <div className="text-lg font-extrabold">Bảng điều khiển giảng viên</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn hidden md:inline-flex items-center gap-2" onClick={props.onOpenStudent}>
            <i className="fa-solid fa-user-graduate" /> Học viên
          </button>
          <button className="btn hidden md:inline-flex items-center gap-2" onClick={props.onOpenRbac}>
            <i className="fa-solid fa-user-shield" /> RBAC
          </button>
          <button className="btn inline-flex items-center gap-2" onClick={props.onNotif}>
            <i className="fa-regular fa-bell" /> Thông báo
          </button>
          <button className="btn btn-primary inline-flex items-center gap-2" onClick={props.onNewCourse}>
            <i className="fa-solid fa-plus" /> Tạo khóa học
          </button>
          <button className="btn inline-flex items-center gap-2" onClick={props.onLogout}>
            <i className="fa-solid fa-right-from-bracket" /> Đăng xuất
          </button>
        </div>
      </div>
    </header>
  );
}