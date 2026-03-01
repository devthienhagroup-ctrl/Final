import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../ui/toast";
import {
  assignPermissionsToRole,
  assignRoleToUser,
  createRole as apiCreateRole,
  deleteRole as apiDeleteRole,
  getPermissions,
  getRoles,
  getUsers,
  updateRole as apiUpdateRole,
} from "../../app/api";

import { MODULES, PERMS, DEFAULT_ROLES, ACTIONS } from "./rbac/rbac.catalog";
import type { Assignment, AuditItem, Role, RolePermMap, TestScope } from "./rbac/rbac.model";
import { presetMap, type PresetKey } from "./rbac/rbac.presets";
import { nowISO } from "./rbac/rbac.storage";

import { RbacHeader } from "./rbac/ui/RbacHeader";
import { RolesPanel } from "./rbac/ui/RolesPanel";
import { PermissionsMatrix } from "./rbac/ui/PermissionsMatrix";
import { AssignmentsPanel } from "./rbac/ui/AssignmentsPanel";
import { AuditPanel } from "./rbac/ui/AuditPanel";
import { TestAccessDrawer } from "./rbac/ui/TestAccessDrawer";

export function AdminRbacPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleIdMap, setRoleIdMap] = useState<Record<string, number>>({});
  const [permCodeToId, setPermCodeToId] = useState<Record<string, number>>({});
  const [rolePerms, setRolePerms] = useState<RolePermMap>({});
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [audit, setAudit] = useState<AuditItem[]>([]);

  const [activeRole, setActiveRole] = useState<string>("ADMIN");
  const [roleSearch, setRoleSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("ALL");
  const [testOpen, setTestOpen] = useState(false);
  const [testKey, setTestKey] = useState(0);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [rolesRaw, permsRaw, usersRaw] = await Promise.all([getRoles(), getPermissions(), getUsers()]);
      const roleRows = rolesRaw as Array<{ id: number; code: string; scopeType: Role["scope"]; description?: string; permissions?: Array<{ permission: { code: string } }> }>;
      const nextRoles: Role[] = roleRows.map((r) => ({ key: r.code, name: r.code, desc: r.description || "", scope: r.scopeType, tier: "custom" }));
      const rolePermMap: RolePermMap = {};
      const nextRoleIdMap: Record<string, number> = {};
      roleRows.forEach((r) => {
        nextRoleIdMap[r.code] = r.id;
        rolePermMap[r.code] = (r.permissions || []).map((x) => x.permission.code);
      });
      const nextPermCodeToId: Record<string, number> = {};
      permsRaw.forEach((p) => {
        nextPermCodeToId[p.code] = p.id;
      });
      const nextAssignments: Assignment[] = usersRaw
        .filter((u) => u.roleRef?.code)
        .map((u) => ({
          id: u.id,
          user: u.email,
          role: u.roleRef!.code,
          scope: { type: (u.roleRef!.scopeType as Assignment["scope"]["type"]) || "OWN", id: null },
          cadence: { unit: "year", value: 10 },
          startAt: "2025-01-01",
          expiresAt: "2099-12-31",
        }));

      setRoles(nextRoles.length ? nextRoles : [...DEFAULT_ROLES] as unknown as Role[]);
      setRoleIdMap(nextRoleIdMap);
      setPermCodeToId(nextPermCodeToId);
      setRolePerms(rolePermMap);
      setAssignments(nextAssignments);
    } catch (e) {
      toast("Lỗi tải RBAC", e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  const activePermSet = useMemo(() => new Set(rolePerms[activeRole] ?? []), [rolePerms, activeRole]);
  const visibleRoles = useMemo(() => {
    const kw = roleSearch.trim().toLowerCase();
    return roles.filter((r) => !kw || (r.key + " " + r.name + " " + r.desc).toLowerCase().includes(kw));
  }, [roles, roleSearch]);
  const filteredPerms = useMemo(() => (moduleFilter === "ALL" ? PERMS : PERMS.filter((p) => p.module === moduleFilter)), [moduleFilter]);

  function pushAudit(type: AuditItem["type"], msg: string) {
    setAudit((prev) => [{ at: nowISO(), type, msg }, ...prev].slice(0, 200));
  }

  async function createRole() {
    const code = (prompt("Nhập key role", "MANAGER") || "").trim().toUpperCase();
    if (!code) return;
    const scopeType = ((prompt("Scope", "GLOBAL") || "GLOBAL") as Role["scope"]);
    const description = prompt("Mô tả", "") || "";
    await apiCreateRole({ code, scopeType, description });
    pushAudit("ROLE", `Tạo role ${code}`);
    await loadData();
  }

  async function editRole(key: string) {
    const roleId = roleIdMap[key];
    if (!roleId) return;
    const row = roles.find((r) => r.key === key);
    if (!row) return;
    const description = prompt("Mô tả", row.desc) ?? row.desc;
    const scopeType = (prompt("Scope", row.scope) ?? row.scope) as Role["scope"];
    await apiUpdateRole(roleId, { description, scopeType });
    pushAudit("ROLE", `Sửa role ${key}`);
    await loadData();
  }

  async function deleteRole(key: string) {
    const roleId = roleIdMap[key];
    if (!roleId || !confirm(`Xoá role ${key}?`)) return;
    await apiDeleteRole(roleId);
    pushAudit("ROLE", `Xoá role ${key}`);
    await loadData();
  }

  async function syncRolePerms(nextCodes: string[]) {
    const roleId = roleIdMap[activeRole];
    if (!roleId) return;
    const ids = nextCodes.map((code) => permCodeToId[code]).filter(Boolean);
    await assignPermissionsToRole(roleId, ids);
    setRolePerms((prev) => ({ ...prev, [activeRole]: nextCodes }));
  }

  async function togglePerm(permKey: string, checked: boolean) {
    const cur = new Set(rolePerms[activeRole] ?? []);
    if (checked) cur.add(permKey);
    else cur.delete(permKey);
    const nextCodes = Array.from(cur);
    await syncRolePerms(nextCodes);
    pushAudit("PERM", `${activeRole} ${checked ? "+" : "-"} ${permKey}`);
  }

  async function applyPresetToActive(preset: PresetKey) {
    const set = Array.from(presetMap()[preset]);
    await syncRolePerms(set);
    pushAudit("PERM", `Áp preset ${preset} cho ${activeRole}`);
  }

  async function allPerms() { await syncRolePerms(PERMS.map((x) => x.key)); }
  async function nonePerms() { await syncRolePerms([]); }

  async function addAssignment() {
    const email = prompt("Nhập email user", "") || "";
    const role = prompt("Nhập role key", "USER") || "USER";
    const roleId = roleIdMap[role];
    if (!email || !roleId) return;
    const user = assignments.find((a) => a.user === email);
    if (!user) {
      toast("Không tìm thấy user", "Hãy tạo user trước.");
      return;
    }
    await assignRoleToUser(user.id, roleId);
    pushAudit("ASSIGN", `Gán ${role} cho ${email}`);
    await loadData();
  }

  async function deleteAssignment(id: number) {
    await assignRoleToUser(id, roleIdMap.USER);
    pushAudit("ASSIGN", `Reset role user #${id}`);
    await loadData();
  }

  function renewAssignment() { toast("Info", "Assignment đang đồng bộ theo role hiện tại."); }
  function clearAssignments() { toast("Info", "Không hỗ trợ xoá hàng loạt trên API."); }
  function saveAll() { toast("Đã lưu", "Mọi thay đổi đã đồng bộ API."); }
  function exportJson() { toast("Info", "Sử dụng API backend để export."); }
  async function importJsonFile() { toast("Info", "Sử dụng API backend để import."); }
  function clearAudit() { setAudit([]); }

  function isRoleActiveForUser(email: string, roleKey: string) {
    return assignments.some((a) => a.user === email && a.role === roleKey);
  }
  function can(roleKey: string, permKey: string) { return new Set(rolePerms[roleKey] ?? []).has(permKey); }

  function runTestAccess(params: { email: string; role: string; module: string; action: string; resource: string; scope: TestScope; }) {
    const permKey = `${params.module}.${params.action}`;
    const active = isRoleActiveForUser(params.email, params.role);
    const allowed = active && can(params.role, permKey);
    return { permKey, active, allowed, reason: allowed ? "OK" : "DENY" };
  }

  if (loading) return <div className="p-6">Đang tải RBAC...</div>;

  return (
    <div className="soft text-slate-900 min-h-screen">
      <RbacHeader
        onTest={() => { setTestKey((k) => k + 1); setTestOpen(true); }}
        onImport={async () => { await importJsonFile(); }}
        onExport={exportJson}
        onSave={saveAll}
      />
      <main className="px-4 md:px-8 py-6 space-y-6">
        <section className="grid gap-4 lg:grid-cols-3">
          <RolesPanel roles={visibleRoles} activeRole={activeRole} onSelectRole={setActiveRole} search={roleSearch} onSearch={setRoleSearch} onNewRole={createRole} onEditRole={editRole} onDeleteRole={deleteRole} onJumpRole={setActiveRole} />
          <PermissionsMatrix activeRole={activeRole} moduleFilter={moduleFilter} onChangeModuleFilter={setModuleFilter} presetSelectOptions={[{ value: "KEEP", label: "Preset: (không đổi)" }, { value: "STRICT", label: "Preset: Nghiêm ngặt" }, { value: "USER", label: "Preset: USER" }, { value: "STAFF", label: "Preset: STAFF" }, { value: "BRANCH_MANAGER", label: "Preset: BRANCH_MANAGER" }, { value: "LECTURER", label: "Preset: LECTURER" }, { value: "SUPPORT", label: "Preset: SUPPORT" }, { value: "OPS", label: "Preset: OPS" }, { value: "FINANCE", label: "Preset: FINANCE" }, { value: "ADMIN", label: "Preset: ADMIN" }]} onApplyPreset={(v) => { if (v !== "KEEP") void applyPresetToActive(v as PresetKey); }} onAll={() => void allPerms()} onNone={() => void nonePerms()} perms={filteredPerms} activePermSet={activePermSet} onTogglePerm={(k, c) => void togglePerm(k, c)} roles={roles} />
        </section>
        <section className="grid gap-4 lg:grid-cols-3">
          <AssignmentsPanel assignments={assignments} onAdd={() => void addAssignment()} onClear={clearAssignments} onRenew={renewAssignment} onDelete={(id) => void deleteAssignment(id)} />
          <AuditPanel audit={audit} onClear={clearAudit} />
        </section>
      </main>
      <TestAccessDrawer key={testKey} open={testOpen} onClose={() => setTestOpen(false)} roles={roles} modules={[...MODULES]} actions={[...ACTIONS]} onRun={(input) => runTestAccess(input)} />
    </div>
  );
}
