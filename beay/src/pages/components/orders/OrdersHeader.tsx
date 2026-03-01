export function OrdersHeader(props: {
  onGoDashboard: () => void;
  onGoRBAC: () => void;
  onPrint: () => void;
  onExport: () => void;
  onCreateManual: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-slate-200/70">
      <div className="h-16 px-4 md:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25"
            onClick={props.onGoDashboard}
            title="Về Dashboard"
          >
            <span className="text-white font-extrabold">A</span>
          </button>
          <div>
            <div className="text-xs text-slate-500 font-semibold -mb-1">AYANAVITA • Admin</div>
            <div className="text-lg font-extrabold">Quản lý đơn hàng</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn hidden md:inline-flex items-center gap-2" onClick={props.onGoRBAC}>
            <i className="fa-solid fa-user-shield" /> Phân quyền
          </button>
          <button className="btn hidden md:inline-flex items-center gap-2" onClick={props.onPrint}>
            <i className="fa-solid fa-print" /> In
          </button>
          <button className="btn hidden md:inline-flex items-center gap-2" onClick={props.onExport}>
            <i className="fa-solid fa-file-export" /> Xuất CSV
          </button>
          <button className="btn btn-primary inline-flex items-center gap-2" onClick={props.onCreateManual}>
            <i className="fa-solid fa-plus" /> Tạo đơn thủ công
          </button>
        </div>
      </div>
    </header>
  );
}