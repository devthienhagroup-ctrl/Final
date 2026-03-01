import type { AuditItem } from "../rbac.model";

export function AuditPanel(props: { audit: AuditItem[]; onClear: () => void }) {
  const list = props.audit.slice(0, 24);

  return (
    <div className="card p-6">
      <div className="text-xs font-extrabold text-slate-500">Audit log</div>
      <div className="text-lg font-extrabold">Nhật ký thay đổi</div>
      <div className="mt-1 text-sm text-slate-600">Ghi lại thay đổi permission/assignment/test.</div>

      <div className="mt-4 space-y-3">
        {list.length ? (
          list.map((a, idx) => (
            <div key={idx} className="p-3 rounded-2xl bg-slate-50 ring-1 ring-slate-200">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-extrabold">{a.type}</div>
                  <div className="text-sm text-slate-700 mt-1">{a.msg}</div>
                </div>
                <span className="chip">{a.at}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-slate-600">Chưa có log.</div>
        )}
      </div>

      <button className="mt-4 w-full btn" onClick={props.onClear}>
        <i className="fa-solid fa-trash mr-1" />Xoá log
      </button>
    </div>
  );
}