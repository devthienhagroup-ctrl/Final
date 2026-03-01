import type { Role } from "../rbac.model";

export function RolesPanel(props: {
  roles: Role[];
  activeRole: string;
  search: string;
  onSearch: (v: string) => void;
  onSelectRole: (key: string) => void;
  onNewRole: () => void;
  onEditRole: (key: string) => void;
  onDeleteRole: (key: string) => void;
  onJumpRole: (key: string) => void;
}) {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-extrabold text-slate-500">Vai trò</div>
          <div className="text-lg font-extrabold">Roles</div>
          <div className="mt-1 text-sm text-slate-600">Chọn role để chỉnh permission.</div>
        </div>
        <button className="btn" onClick={props.onNewRole}>
          <i className="fa-solid fa-plus mr-1" />
          Thêm
        </button>
      </div>

      <div className="mt-4">
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-11"
            placeholder="Tìm role... (phím /)"
            value={props.search}
            onChange={(e) => props.onSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "/" && (e.target as HTMLInputElement).value === "") {
                // allow typing /
              }
            }}
          />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {props.roles.length ? (
          props.roles.map((r) => {
            const active = r.key === props.activeRole;
            return (
              <button
                key={r.key}
                className={`w-full text-left p-4 rounded-2xl ring-1 ring-slate-200 hover:bg-slate-50 ${
                  active ? "bg-indigo-50 ring-indigo-200" : ""
                }`}
                onClick={() => props.onSelectRole(r.key)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-extrabold">{r.name}</div>
                    <div className="text-sm text-slate-600">{r.desc}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="chip">
                        <i className="fa-solid fa-tag text-indigo-600 mr-1" />
                        {r.key}
                      </span>
                      <span className="chip">
                        <i className="fa-solid fa-diagram-project text-amber-600 mr-1" />
                        {r.scope}
                      </span>
                      <span className="chip">
                        <i className="fa-solid fa-signal text-emerald-600 mr-1" />
                        {r.tier}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 items-end">
                    <button
                      className="btn h-9 w-9 p-0 rounded-2xl"
                      title="Edit role"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        props.onEditRole(r.key);
                      }}
                    >
                      <i className="fa-solid fa-pen" />
                    </button>
                    <button
                      className="btn h-9 w-9 p-0 rounded-2xl"
                      title="Delete role"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        props.onDeleteRole(r.key);
                      }}
                    >
                      <i className="fa-solid fa-trash" />
                    </button>
                  </div>
                </div>
              </button>
            );
          })
        ) : (
          <div className="text-sm text-slate-600 p-3">Không tìm thấy role.</div>
        )}
      </div>

      <div className="mt-4 p-4 rounded-2xl bg-slate-50 ring-1 ring-slate-200">
        <div className="text-xs font-extrabold text-slate-500">Preset nhanh (đúng bảng đã chốt)</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button className="btn" onClick={() => props.onJumpRole("ADMIN")}><i className="fa-solid fa-crown mr-1" />ADMIN</button>
          <button className="btn" onClick={() => props.onJumpRole("OPS")}><i className="fa-solid fa-gears mr-1" />OPS</button>
          <button className="btn" onClick={() => props.onJumpRole("FINANCE")}><i className="fa-solid fa-coins mr-1" />FINANCE</button>
          <button className="btn" onClick={() => props.onJumpRole("SUPPORT")}><i className="fa-solid fa-headset mr-1" />SUPPORT</button>
          <button className="btn" onClick={() => props.onJumpRole("BRANCH_MANAGER")}><i className="fa-solid fa-store mr-1" />BRANCH</button>
          <button className="btn" onClick={() => props.onJumpRole("STAFF")}><i className="fa-solid fa-spa mr-1" />STAFF</button>
          <button className="btn" onClick={() => props.onJumpRole("LECTURER")}><i className="fa-solid fa-chalkboard-user mr-1" />LECTURER</button>
          <button className="btn" onClick={() => props.onJumpRole("USER")}><i className="fa-solid fa-user mr-1" />USER</button>
        </div>

        <div className="mt-3 text-xs text-slate-500">
          Mẹo: <span className="kbd">/</span> tìm role • <span className="kbd">Esc</span> đóng drawer
        </div>
      </div>
    </div>
  );
}