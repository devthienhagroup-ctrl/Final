export function RbacHeader(props: {
  onTest: () => void;
  onImport: () => void;
  onExport: () => void;
  onSave: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200/70">
      <div className="h-16 px-4 md:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <span className="text-white font-extrabold">A</span>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold -mb-1">AYANAVITA • Admin</div>
            <div className="text-lg font-extrabold">RBAC (Role • Permission • Expiry)</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn hidden md:inline-flex items-center gap-2" onClick={props.onTest}>
            <i className="fa-solid fa-vial" /> Test quyền
          </button>
          <button className="btn hidden md:inline-flex items-center gap-2" onClick={props.onImport}>
            <i className="fa-solid fa-file-import" /> Import JSON
          </button>
          <button className="btn hidden md:inline-flex items-center gap-2" onClick={props.onExport}>
            <i className="fa-solid fa-file-export" /> Export JSON
          </button>
          <button className="btn btn-primary inline-flex items-center gap-2" onClick={props.onSave}>
            <i className="fa-solid fa-floppy-disk" /> Lưu cấu hình
          </button>
        </div>
      </div>
    </header>
  );
}