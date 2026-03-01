import { MODULES } from "../rbac.catalog";
import type { PermDef, Role } from "../rbac.model";

export function PermissionsMatrix(props: {
  roles: Role[];
  activeRole: string;

  moduleFilter: string;
  onChangeModuleFilter: (v: string) => void;

  presetSelectOptions: { value: string; label: string }[];
  onApplyPreset: (v: string) => void;

  onAll: () => void;
  onNone: () => void;

  perms: PermDef[];
  activePermSet: Set<string>;
  onTogglePerm: (permKey: string, checked: boolean) => void;
}) {
  const countsByModule = (() => {
    const map: Record<string, number> = {};
    for (const k of props.activePermSet) {
      const mod = k.split(".")[0];
      map[mod] = (map[mod] || 0) + 1;
    }
    return map;
  })();

  const topModules = Object.entries(countsByModule)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7);

  return (
    <div className="card p-6 lg:col-span-2">
      <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
        <div>
          <div className="text-xs font-extrabold text-slate-500">Phân quyền</div>
          <div className="text-lg font-extrabold">Permissions Matrix</div>
          <div className="mt-1 text-sm text-slate-600">
            Permission key chuẩn: <b>{"{module}.{action}"}</b>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select className="input" style={{ width: "auto" }} value={props.moduleFilter} onChange={(e) => props.onChangeModuleFilter(e.target.value)}>
            <option value="ALL">Tất cả module</option>
            {MODULES.map((m) => (
              <option key={m.key} value={m.key}>
                {m.name}
              </option>
            ))}
          </select>

          <select className="input" style={{ width: "auto" }} defaultValue="KEEP" onChange={(e) => { props.onApplyPreset(e.target.value); e.currentTarget.value = "KEEP"; }}>
            {props.presetSelectOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <button className="btn" onClick={props.onAll}>
            <i className="fa-solid fa-check-double mr-1" />All
          </button>
          <button className="btn" onClick={props.onNone}>
            <i className="fa-solid fa-eraser mr-1" />None
          </button>
        </div>
      </div>

      <div
          className="mt-4"
          style={{
            maxHeight: 1160,
            overflowY: "auto",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 10
          }}
      >
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-3 pr-4">Module</th>
              <th className="py-3 pr-4">Action</th>
              <th className="py-3 pr-4">Permission</th>
              <th className="py-3 pr-4">Mô tả</th>
              <th className="py-3 text-right">Cho phép</th>
            </tr>
          </thead>
          <tbody>
            {props.perms.map((p) => (
              <tr key={p.key}>
                <td className="py-3 pr-4 font-extrabold">{p.moduleName}</td>
                <td className="py-3 pr-4">
                  <span className="chip">{p.action}</span>
                </td>
                <td className="py-3 pr-4">
                  <div className="font-extrabold">{p.key}</div>
                </td>
                <td className="py-3 pr-4 text-slate-600">{p.desc}</td>
                <td className="py-3 text-right">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={props.activePermSet.has(p.key)}
                    onChange={(e) => props.onTogglePerm(p.key, e.target.checked)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="p-4 rounded-2xl bg-slate-50 ring-1 ring-slate-200">
          <div className="text-xs font-extrabold text-slate-500">Policy preview</div>
          <div className="mt-2 text-sm text-slate-700">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-extrabold text-slate-900">{props.activeRole}</div>
                <div className="text-sm text-slate-600">{props.activePermSet.size} permission</div>
              </div>
              <span className="chip"><i className="fa-solid fa-shield text-indigo-600 mr-1" />RBAC</span>
            </div>

            <div className="mt-3">
              <div className="text-xs font-extrabold text-slate-500 mb-1">Phân bổ module (top)</div>
              {topModules.length ? (
                <div className="text-sm">
                  {topModules.map(([m, c]) => (
                    <div key={m}>
                      {(MODULES.find((x) => x.key === m)?.name || m)}: <b>{c}</b>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-500 text-sm">Chưa có quyền nào.</div>
              )}
            </div>

            <div className="mt-3 text-xs text-slate-500 break-words">
              {[...props.activePermSet].sort().join(" • ")}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 ring-1 ring-slate-200">
          <div className="text-xs font-extrabold text-slate-500">Rule đặc biệt</div>
          <div className="mt-2 text-sm text-slate-700">
            <b>LMS gating:</b> Lesson/Progress chỉ khi Enrollment <b>ACTIVE</b> (ADMIN bypass).<br />
            <b>Refund:</b> chỉ FINANCE/ADMIN mặc định.<br />
            <b>Branch scope:</b> STAFF/BRANCH_MANAGER chỉ dữ liệu chi nhánh.<br />
            <b>Course scope:</b> LECTURER chỉ các course được gán.
          </div>
        </div>
      </div>
    </div>
  );
}