import { useMemo, useState } from "react";
import type { ActionDef, ModuleDef } from "../rbac.model";
import type { Role, TestScope } from "../rbac.model";

type TestInput = {
  email: string;
  role: string;
  module: string;
  action: string;
  resource: string;
  scope: TestScope;
};

export function TestAccessDrawer(props: {
  open: boolean;
  onClose: () => void;
  roles: Role[];
  modules: ModuleDef[];
  actions: ActionDef[];
  onRun: (input: TestInput) => { permKey: string; active: boolean; allowed: boolean; reason: string };
}) {
  const defaultRole = props.roles[0]?.key || "USER";
  const defaultModule = props.modules[0]?.key || "orders";
  const defaultAction = props.actions[0]?.key || "read";

  const [name] = useState("Người dùng Demo");
  const [email, setEmail] = useState("demo@ayanavita.vn");
  const [role, setRole] = useState(defaultRole);
  const [module, setModule] = useState(defaultModule);
  const [action, setAction] = useState(defaultAction);
  const [resource, setResource] = useState("");
  const [scope, setScope] = useState<TestScope>("OWN");

  const [result, setResult] = useState<ReturnType<typeof props.onRun> | null>(null);

  const statusUI = useMemo(() => {
    if (!result) return null;
    if (result.allowed) return { cls: "pill pill-ok", icon: "fa-circle-check", label: "ALLOWED" };
    if (!result.active) return { cls: "pill pill-bad", icon: "fa-circle-xmark", label: "DENY • ROLE EXPIRED/NOT ASSIGNED" };
    return { cls: "pill pill-bad", icon: "fa-circle-xmark", label: "DENY • NO PERMISSION" };
  }, [result]);

  return (
    <>
      <div className={`drawer-overlay ${props.open ? "show" : ""}`} onClick={props.onClose} />
      <aside className={`drawer ${props.open ? "open" : ""}`}>
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200/70">
          <div>
            <div className="text-xs font-extrabold text-slate-500">Công cụ</div>
            <div className="text-lg font-extrabold">Test quyền truy cập</div>
          </div>
          <button className="btn h-10 w-10 p-0 rounded-2xl" onClick={props.onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-auto" style={{ height: "calc(100% - 64px)" }}>
          <div className="card p-4">
            <div className="text-xs font-extrabold text-slate-500">User mô phỏng</div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <div className="text-xs font-extrabold text-slate-500">Tên</div>
                <input className="input mt-2" value={name} readOnly />
              </div>
              <div>
                <div className="text-xs font-extrabold text-slate-500">Email</div>
                <input className="input mt-2" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <div className="text-xs font-extrabold text-slate-500">Role</div>
                <select className="input mt-2" value={role} onChange={(e) => setRole(e.target.value)}>
                  {props.roles.map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.key} — {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="text-xs font-extrabold text-slate-500">Thao tác cần kiểm tra</div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <div className="text-xs font-extrabold text-slate-500">Module</div>
                <select className="input mt-2" value={module} onChange={(e) => setModule(e.target.value)}>
                  {props.modules.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-xs font-extrabold text-slate-500">Action</div>
                <select className="input mt-2" value={action} onChange={(e) => setAction(e.target.value)}>
                  {props.actions.map((a) => (
                    <option key={a.key} value={a.key}>
                      {a.key}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <div className="text-xs font-extrabold text-slate-500">Resource (tuỳ chọn)</div>
                <input className="input mt-2" value={resource} onChange={(e) => setResource(e.target.value)} placeholder="VD: course:123, branch:2, appointment:988, cms:landing..." />
              </div>

              <div className="md:col-span-2">
                <div className="text-xs font-extrabold text-slate-500">Scope giả lập (tuỳ chọn)</div>
                <select className="input mt-2" value={scope} onChange={(e) => setScope(e.target.value as TestScope)}>
                  <option value="OWN">OWN (của mình)</option>
                  <option value="BRANCH">BRANCH (chi nhánh)</option>
                  <option value="COURSE">COURSE (khoá)</option>
                  <option value="GLOBAL">GLOBAL (toàn hệ thống)</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                className="btn btn-primary"
                onClick={() => {
                  const r = props.onRun({ email: email.trim(), role, module, action, resource: resource.trim(), scope });
                  setResult(r);
                }}
              >
                <i className="fa-solid fa-vial mr-1" />
                Chạy test
              </button>
            </div>

            {result && (
              <div className="mt-4">
                <div className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-extrabold text-slate-500">Kết quả</div>
                      <div className="mt-1 font-extrabold">{email}</div>
                      <div className="mt-2 text-sm text-slate-700">
                        Role: <b>{role}</b>
                        <br />
                        Permission: <b>{result.permKey}</b>
                        <br />
                        Scope: <b>{scope}</b>
                        <br />
                        Resource: <b>{resource || "-"}</b>
                      </div>
                    </div>
                    {statusUI && (
                      <div>
                        <span className={statusUI.cls}>
                          <i className={`fa-solid ${statusUI.icon}`} />
                          {statusUI.label}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 text-xs text-slate-500">
                    * Prototype. Khi tách NestJS: check user_roles.expiresAt + scope enforcement + permission guard.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}