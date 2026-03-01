import type { Assignment } from "../rbac.model";
import { expiryStatus } from "../rbac.date";

export function AssignmentsPanel(props: {
  assignments: Assignment[];
  onAdd: () => void;
  onClear: () => void;
  onRenew: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="card p-6 lg:col-span-2">
      <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
        <div>
          <div className="text-xs font-extrabold text-slate-500">Gán role cho user</div>
          <div className="text-lg font-extrabold">Role Assignments + Expiry</div>
          <div className="mt-1 text-sm text-slate-600">Role theo chu kỳ: day/week/month/year.</div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-primary" onClick={props.onAdd}>
            <i className="fa-solid fa-user-plus mr-1" />Gán role
          </button>
          <button className="btn" onClick={props.onClear}>
            <i className="fa-solid fa-broom mr-1" />Xoá hết
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-3 pr-4">User</th>
              <th className="py-3 pr-4">Role</th>
              <th className="py-3 pr-4">Scope</th>
              <th className="py-3 pr-4">Chu kỳ</th>
              <th className="py-3 pr-4">Bắt đầu</th>
              <th className="py-3 pr-4">Hết hạn</th>
              <th className="py-3 pr-4">Trạng thái</th>
              <th className="py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {props.assignments.map((a) => {
              const st = expiryStatus(a.expiresAt);
              const pillClass = st.tone === "ok" ? "pill pill-ok" : st.tone === "warn" ? "pill pill-warn" : "pill pill-bad";
              const icon = st.tone === "ok" ? "fa-circle-check" : st.tone === "warn" ? "fa-triangle-exclamation" : "fa-circle-xmark";
              const scopeText = a.scope?.type ? `${a.scope.type}${a.scope.id ? ":" + a.scope.id : ""}` : "GLOBAL";
              return (
                <tr key={a.id}>
                  <td className="py-3 pr-4 font-extrabold">{a.user}</td>
                  <td className="py-3 pr-4"><span className="chip">{a.role}</span></td>
                  <td className="py-3 pr-4"><span className="chip">{scopeText}</span></td>
                  <td className="py-3 pr-4">{a.cadence.unit}/{a.cadence.value}</td>
                  <td className="py-3 pr-4 text-slate-600">{a.startAt}</td>
                  <td className="py-3 pr-4 text-slate-600">{a.expiresAt}</td>
                  <td className="py-3 pr-4">
                    <span className={pillClass}><i className={`fa-solid ${icon}`} />{st.text}</span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="btn h-9 w-9 p-0 rounded-2xl" title="Gia hạn" onClick={() => props.onRenew(a.id)}>
                        <i className="fa-solid fa-rotate-right" />
                      </button>
                      <button className="btn h-9 w-9 p-0 rounded-2xl" title="Xoá" onClick={() => props.onDelete(a.id)}>
                        <i className="fa-solid fa-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!props.assignments.length && (
              <tr>
                <td className="py-4 text-slate-500" colSpan={8}>Chưa có assignments.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-xs text-slate-500">
        * Prototype lưu localStorage. Khi làm NestJS: bảng user_roles có (scopeType, scopeId, startAt, expiresAt).
      </div>
    </div>
  );
}