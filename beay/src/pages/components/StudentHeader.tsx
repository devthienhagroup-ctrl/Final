// src/pages/student/components/StudentHeader.tsx
type Props = {
  onBell: () => void;
  onContinue: () => void;
};

export function StudentHeader(props: Props) {
  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-slate-200/70">
      <div className="h-16 px-4 md:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25"
          >
            <span className="text-white font-extrabold">A</span>
          </a>
          <div>
            <div className="text-xs text-slate-500 font-semibold -mb-1">AYANAVITA • Student</div>
            <div className="text-lg font-extrabold">Không gian học tập</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a className="btn hidden md:inline-flex items-center gap-2" href="/instructor">
            <i className="fa-solid fa-chalkboard-user" /> Giảng viên
          </a>
          <button className="btn inline-flex items-center gap-2" onClick={props.onBell}>
            <i className="fa-regular fa-bell" /> Thông báo
          </button>
          <button className="btn btn-primary inline-flex items-center gap-2" onClick={props.onContinue}>
            <i className="fa-solid fa-play" /> Tiếp tục học
          </button>
        </div>
      </div>
    </header>
  );
}