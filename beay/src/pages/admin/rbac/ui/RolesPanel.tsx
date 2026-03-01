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
            <div className="mt-1 text-sm text-slate-600">
              Chọn role để chỉnh permission.
            </div>
          </div>

          {/* ADD ROLE */}
          <button
              className="btn flex items-center justify-center gap-2"
              style={{
                background: "#4f46e5",
                color: "#fff",
                borderRadius: "14px",
                padding: "8px 14px",
                fontWeight: 600,
              }}
              onClick={props.onNewRole}
          >
            <i
                className="fa-solid fa-plus"
                style={{ color: "#fff", fontSize: 14 }}
            />
            Thêm
          </button>
        </div>

        {/* SEARCH */}
        <div className="mt-4">
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
                className="input pl-11"
                placeholder="Tìm role... (phím /)"
                value={props.search}
                onChange={(e) => props.onSearch(e.target.value)}
            />
          </div>
        </div>

        {/* ROLE LIST */}
        <div className="mt-4 space-y-2">
          {props.roles.length ? (
              props.roles.map((r) => {
                const active = r.key === props.activeRole;
                return (
                    <button
                        key={r.key}
                        className="w-full text-left p-4 rounded-2xl transition-all"
                        style={{
                          background: active ? "#eef2ff" : "#ffffff",
                          border: active
                              ? "1px solid #c7d2fe"   // viền indigo nhạt khi active
                              : "1px solid #e5e7eb",  // viền xám mỏng bình thường
                        }}
                        onClick={() => props.onSelectRole(r.key)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-extrabold">{r.name}</div>
                          <div className="text-sm text-slate-600">{r.desc}</div>

                          {/* TAGS */}
                          <div className="mt-2 flex flex-wrap gap-2">
                      <span
                          className="chip"
                          style={{
                            background: "#eef2ff",
                            color: "#4f46e5",
                            fontWeight: 600,
                          }}
                      >
                        <i
                            className="fa-solid fa-tag"
                            style={{ marginRight: 6 }}
                        />
                        {r.key}
                      </span>

                            <span
                                className="chip"
                                style={{
                                  background: "#fff7ed",
                                  color: "#f59e0b",
                                  fontWeight: 600,
                                }}
                            >
                        <i
                            className="fa-solid fa-diagram-project"
                            style={{ marginRight: 6 }}
                        />
                              {r.scope}
                      </span>

                            <span
                                className="chip"
                                style={{
                                  background: "#ecfdf5",
                                  color: "#10b981",
                                  fontWeight: 600,
                                }}
                            >
                        <i
                            className="fa-solid fa-signal"
                            style={{ marginRight: 6 }}
                        />
                              {r.tier}
                      </span>
                          </div>
                        </div>

                        {/* ACTION BUTTONS */}
                        <div className="flex flex-col gap-2 items-end">
                          {/* EDIT */}
                          <button
                              title="Edit role"
                              className="ring-1 ring-indigo-100 hover:ring-indigo-200"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                props.onEditRole(r.key);
                              }}
                              style={{
                                width: 38,
                                height: 38,
                                borderRadius: 14,
                                background: "#eef2ff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "0.2s",
                              }}
                          >
                            <i
                                className="fa-solid fa-pen"
                                style={{ color: "#4f46e5" }}
                            />
                          </button>

                          {/* DELETE */}
                          <button
                              title="Delete role"
                              className="ring-1 ring-red-100 hover:ring-red-200"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                props.onDeleteRole(r.key);
                              }}
                              style={{
                                width: 38,
                                height: 38,
                                borderRadius: 14,
                                background: "#fef2f2",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "0.2s",
                              }}
                          >
                            <i
                                className="fa-solid fa-trash"
                                style={{ color: "#dc2626" }}
                            />
                          </button>
                        </div>
                      </div>
                    </button>
                );
              })
          ) : (
              <div className="text-sm text-slate-600 p-3">
                Không tìm thấy role.
              </div>
          )}
        </div>

        {/* PRESET */}
        <div
            className="mt-4 p-4 rounded-2xl"
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
            }}
        >
          <div className="text-xs font-extrabold text-slate-500">
            Preset nhanh ( Mặc định )
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              { key: "ADMIN", icon: "fa-crown", color: "#f59e0b" },
              { key: "OPS", icon: "fa-gears", color: "#6366f1" },
              { key: "FINANCE", icon: "fa-coins", color: "#10b981" },
              { key: "SUPPORT", icon: "fa-headset", color: "#0ea5e9" },
              { key: "BRANCH_MANAGER", icon: "fa-store", color: "#8b5cf6" },
              { key: "STAFF", icon: "fa-spa", color: "#22c55e" },
              { key: "LECTURER", icon: "fa-chalkboard-user", color: "#f97316" },
              { key: "USER", icon: "fa-user", color: "#64748b" },
            ].map((item) => (
                <button
                    key={item.key}
                    className="text-slate-700 hover:bg-indigo-50"
                    onClick={() => props.onJumpRole(item.key)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      padding: "8px",
                      borderRadius: 14,
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                      fontWeight: 600,
                    }}
                >
                  <i
                      className={`fa-solid ${item.icon}`}
                      style={{ color: item.color }}
                  />
                  {item.key}
                </button>
            ))}
          </div>

          <div className="mt-3 text-xs text-slate-500">
            Mẹo: <span className="kbd">/</span> tìm role •{" "}
            <span className="kbd">Esc</span> đóng drawer
          </div>
        </div>
      </div>
  );
}
