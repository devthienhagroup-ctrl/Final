import type { AuditItem } from "../rbac.model";

export function AuditPanel(props: { audit: AuditItem[]; onClear: () => void }) {
  const list = props.audit.slice(0, 200);

  return (
    <div className="card p-6">
      <div className="text-xs font-extrabold text-slate-500">Audit log</div>
      <div className="text-lg font-extrabold">Nhật ký thay đổi</div>
      <div className="mt-1 text-sm text-slate-600">Hiển thị text để dễ đọc, có giới hạn chiều cao.</div>

      <ul className="mt-4 rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-3 space-y-2 overflow-auto" style={{ maxHeight: 420 }}>
        {list.length ? (
          list.map((a, idx) => (
            <li key={`${a.at}-${idx}`} className="text-sm text-slate-700 border-b border-slate-200/70 pb-2 last:border-0 last:pb-0">
              <span className="font-extrabold">[{a.type}]</span> {a.msg}
              <span className="text-slate-500"> — {a.at}</span>
            </li>
          ))
        ) : (
          <li className="text-sm text-slate-600">Chưa có log.</li>
        )}
      </ul>

      <button className="mt-4 w-full btn" onClick={props.onClear}>
        <i className="fa-solid fa-trash mr-1" />Xoá log
      </button>
    </div>
  );
}
