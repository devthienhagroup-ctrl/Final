import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../ui/toast";
import {
  assignPermissionsToRole,
  assignRoleToUser,
  checkPermission,
  createRole as apiCreateRole,
  deleteRole as apiDeleteRole,
  getPermissions,
  getRoleAuditLogs,
  getRoles,
  getUsers,
  type ApiUser,
  updateRole as apiUpdateRole,
} from "../../app/api";

import { MODULES, PERMS, DEFAULT_ROLES, ACTIONS } from "./rbac/rbac.catalog";
import type { AuditItem, Role, RolePermMap, TestScope } from "./rbac/rbac.model";
import { presetMap, type PresetKey } from "./rbac/rbac.presets";
import { nowISO } from "./rbac/rbac.storage";

import { RbacHeader } from "./rbac/ui/RbacHeader";
import { RolesPanel } from "./rbac/ui/RolesPanel";
import { PermissionsMatrix } from "./rbac/ui/PermissionsMatrix";
import { AssignmentsPanel, type UserRoleRow } from "./rbac/ui/AssignmentsPanel";
import { AuditPanel } from "./rbac/ui/AuditPanel";
import { TestAccessDrawer } from "./rbac/ui/TestAccessDrawer";

type RoleFormState = { mode: "create" | "edit"; key?: string; code: string; scopeType: Role["scope"]; description: string };
type AssignmentFormState = { userId: number; userEmail: string; role: string };
type DeleteTarget = { key: string } | null;

const PAGE_SIZE = 10;

export function AdminRbacPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleIdMap, setRoleIdMap] = useState<Record<string, number>>({});
  const [permCodeToId, setPermCodeToId] = useState<Record<string, number>>({});
  const [rolePerms, setRolePerms] = useState<RolePermMap>({});
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [audit, setAudit] = useState<AuditItem[]>([]);

  const [activeRole, setActiveRole] = useState<string>("ADMIN");
  const [roleSearch, setRoleSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("ALL");
  const [testOpen, setTestOpen] = useState(false);
  const [testKey, setTestKey] = useState(0);

  const [roleForm, setRoleForm] = useState<RoleFormState | null>(null);
  const [assignmentForm, setAssignmentForm] = useState<AssignmentFormState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  const [userKeyword, setUserKeyword] = useState("");
  const [userPage, setUserPage] = useState(1);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [rolesRaw, permsRaw, usersRaw, auditRaw] = await Promise.all([getRoles(), getPermissions(), getUsers(), getRoleAuditLogs(120)]);
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

      const auditRows: AuditItem[] = auditRaw.map((item) => ({
        at: item.createdAt,
        type: item.action.includes("PERMISSION") ? "PERM" : item.action.includes("ASSIGN") ? "ASSIGN" : "ROLE",
        msg: item.message,
      }));

      setRoles(nextRoles.length ? nextRoles : ([...DEFAULT_ROLES] as unknown as Role[]));
      setRoleIdMap(nextRoleIdMap);
      setPermCodeToId(nextPermCodeToId);
      setRolePerms(rolePermMap);
      setUsers(usersRaw);
      setAudit(auditRows);
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

  const filteredUsers = useMemo(() => {
    const kw = userKeyword.trim().toLowerCase();
    if (!kw) return users;
    return users.filter((u) => `${u.name || ""} ${u.email}`.toLowerCase().includes(kw));
  }, [users, userKeyword]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));

  useEffect(() => {
    if (userPage > totalPages) setUserPage(totalPages);
  }, [userPage, totalPages]);

  const userRows = useMemo<UserRoleRow[]>(() => {
    const start = (userPage - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE).map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.roleRef?.code || "USER",
      scopeType: u.roleRef?.scopeType || null,
    }));
  }, [filteredUsers, userPage]);

  function pushAudit(type: AuditItem["type"], msg: string) {
    setAudit((prev) => [{ at: nowISO(), type, msg }, ...prev].slice(0, 200));
  }

  function openCreateRoleModal() {
    setRoleForm({ mode: "create", code: "MANAGER", scopeType: "GLOBAL", description: "" });
  }

  function openEditRoleModal(key: string) {
    const row = roles.find((r) => r.key === key);
    if (!row) return;
    setRoleForm({ mode: "edit", key, code: row.key, scopeType: row.scope, description: row.desc });
  }

  async function submitRoleForm() {
    if (!roleForm) return;
    const code = roleForm.code.trim().toUpperCase();
    if (!code) {
      toast("Thiếu dữ liệu", "Role key không được để trống.");
      return;
    }

    if (roleForm.mode === "create") {
      await apiCreateRole({ code, scopeType: roleForm.scopeType, description: roleForm.description.trim() });
      pushAudit("ROLE", `Tạo role ${code}`);
    } else {
      const roleId = roleForm.key ? roleIdMap[roleForm.key] : null;
      if (!roleId) return;
      await apiUpdateRole(roleId, { description: roleForm.description.trim(), scopeType: roleForm.scopeType });
      pushAudit("ROLE", `Sửa role ${roleForm.key}`);
    }

    setRoleForm(null);
    await loadData();
  }

  function openDeleteRoleModal(key: string) {
    setDeleteTarget({ key });
  }

  async function confirmDeleteRole() {
    const key = deleteTarget?.key;
    if (!key) return;
    const roleId = roleIdMap[key];
    if (!roleId) return;
    await apiDeleteRole(roleId);
    pushAudit("ROLE", `Xoá role ${key}`);
    setDeleteTarget(null);
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

  async function allPerms() {
    await syncRolePerms(PERMS.map((x) => x.key));
  }

  async function nonePerms() {
    await syncRolePerms([]);
  }

  function openAssignmentModal(row: UserRoleRow) {
    setAssignmentForm({ userId: row.id, userEmail: row.email, role: row.role });
  }

  async function submitAssignment() {
    if (!assignmentForm) return;
    const roleId = roleIdMap[assignmentForm.role];
    if (!roleId) {
      toast("Thiếu dữ liệu", "Role không hợp lệ.");
      return;
    }
    await assignRoleToUser(assignmentForm.userId, roleId);
    pushAudit("ASSIGN", `Gán ${assignmentForm.role} cho ${assignmentForm.userEmail}`);
    setAssignmentForm(null);
    await loadData();
  }

  async function resetUserRole(userId: number) {
    if (!roleIdMap.USER) return;
    await assignRoleToUser(userId, roleIdMap.USER);
    pushAudit("ASSIGN", `Reset role user #${userId}`);
    await loadData();
  }

  function saveAll() {
    toast("Đã lưu", "Mọi thay đổi đã đồng bộ API.");
  }

  function exportJson() {
    toast("Info", "Sử dụng API backend để export.");
  }

  async function importJsonFile() {
    toast("Info", "Sử dụng API backend để import.");
  }

  function clearAudit() {
    setAudit([]);
  }

  async function runTestAccess(params: { email: string; role: string; module: string; action: string; resource: string; scope: TestScope }) {
    const result = await checkPermission({
      email: params.email,
      roleCode: params.role,
      module: params.module,
      action: params.action,
      resource: params.resource,
    });
    pushAudit("TEST", `Test ${params.email} với ${result.permKey}: ${result.allowed ? "ALLOW" : "DENY"}`);
    return result;
  }

  if (loading) return <div className="p-6">Đang tải RBAC...</div>;

  return (
    <div className="soft text-slate-900 min-h-screen">
      <RbacHeader
        onTest={() => {
          setTestKey((k) => k + 1);
          setTestOpen(true);
        }}
        onImport={async () => {
          await importJsonFile();
        }}
        onExport={exportJson}
        onSave={saveAll}
      />
      <main className="px-4 md:px-8 py-6 space-y-6">
        <section className="grid gap-4 lg:grid-cols-3">
          <RolesPanel roles={visibleRoles} activeRole={activeRole} onSelectRole={setActiveRole} search={roleSearch} onSearch={setRoleSearch} onNewRole={openCreateRoleModal} onEditRole={openEditRoleModal} onDeleteRole={openDeleteRoleModal} onJumpRole={setActiveRole} />
          <PermissionsMatrix activeRole={activeRole} moduleFilter={moduleFilter} onChangeModuleFilter={setModuleFilter} presetSelectOptions={[{ value: "KEEP", label: "Preset: (không đổi)" }, { value: "STRICT", label: "Preset: Nghiêm ngặt" }, { value: "USER", label: "Preset: USER" }, { value: "STAFF", label: "Preset: STAFF" }, { value: "BRANCH_MANAGER", label: "Preset: BRANCH_MANAGER" }, { value: "LECTURER", label: "Preset: LECTURER" }, { value: "SUPPORT", label: "Preset: SUPPORT" }, { value: "OPS", label: "Preset: OPS" }, { value: "FINANCE", label: "Preset: FINANCE" }, { value: "ADMIN", label: "Preset: ADMIN" }]} onApplyPreset={(v) => { if (v !== "KEEP") void applyPresetToActive(v as PresetKey); }} onAll={() => void allPerms()} onNone={() => void nonePerms()} perms={filteredPerms} activePermSet={activePermSet} onTogglePerm={(k, c) => void togglePerm(k, c)} roles={roles} />
        </section>
        <section className="grid gap-4 lg:grid-cols-3">
          <AssignmentsPanel
            rows={userRows}
            keyword={userKeyword}
            onKeywordChange={(v) => {
              setUserKeyword(v);
              setUserPage(1);
            }}
            page={userPage}
            pageSize={PAGE_SIZE}
            totalPages={totalPages}
            onPrevPage={() => setUserPage((p) => Math.max(1, p - 1))}
            onNextPage={() => setUserPage((p) => Math.min(totalPages, p + 1))}
            onEdit={openAssignmentModal}
            onResetUserRole={(id) => void resetUserRole(id)}
          />
          <AuditPanel audit={audit} onClear={clearAudit} />
        </section>
      </main>

      <TestAccessDrawer key={testKey} open={testOpen} onClose={() => setTestOpen(false)} roles={roles} modules={[...MODULES]} actions={[...ACTIONS]} onRun={(input) => runTestAccess(input)} />

      {roleForm && (
        <div className="fixed inset-0 z-40 bg-slate-900/35 flex items-center justify-center p-4">
          <div className="card w-full max-w-lg p-5">
            <div className="text-lg font-extrabold">{roleForm.mode === "create" ? "Tạo role" : `Sửa role ${roleForm.key}`}</div>
            <div className="mt-4 space-y-3">
              <div>
                <div className="text-xs font-bold text-slate-500">Role key</div>
                <input className="input mt-1" value={roleForm.code} onChange={(e) => setRoleForm((prev) => (prev ? { ...prev, code: e.target.value.toUpperCase() } : prev))} disabled={roleForm.mode === "edit"} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500">Scope</div>
                <select className="input mt-1" value={roleForm.scopeType} onChange={(e) => setRoleForm((prev) => (prev ? { ...prev, scopeType: e.target.value as Role["scope"] } : prev))}>
                  <option value="OWN">OWN</option>
                  <option value="BRANCH">BRANCH</option>
                  <option value="COURSE">COURSE</option>
                  <option value="GLOBAL">GLOBAL</option>
                </select>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500">Mô tả</div>
                <textarea className="input mt-1 min-h-[88px]" value={roleForm.description} onChange={(e) => setRoleForm((prev) => (prev ? { ...prev, description: e.target.value } : prev))} />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn" onClick={() => setRoleForm(null)}>Huỷ</button>
              <button className="btn btn-primary" onClick={() => void submitRoleForm()}>Xác nhận</button>
            </div>
          </div>
        </div>
      )}

      {assignmentForm && (
        <div className="fixed inset-0 z-40 bg-slate-900/35 flex items-center justify-center p-4">
          <div className="card w-full max-w-lg p-5">
            <div className="text-lg font-extrabold">Gán role cho user</div>
            <div className="mt-2 text-sm text-slate-600">User: <b>{assignmentForm.userEmail}</b></div>
            <div className="mt-4">
              <div className="text-xs font-bold text-slate-500">Role</div>
              <select className="input mt-1" value={assignmentForm.role} onChange={(e) => setAssignmentForm((prev) => (prev ? { ...prev, role: e.target.value } : prev))}>
                {roles.map((r) => (
                  <option key={r.key} value={r.key}>{r.key}</option>
                ))}
              </select>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn" onClick={() => setAssignmentForm(null)}>Huỷ</button>
              <button className="btn btn-primary" onClick={() => void submitAssignment()}>Lưu role</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-40 bg-slate-900/35 flex items-center justify-center p-4">
          <div className="card w-full max-w-md p-5">
            <div className="text-lg font-extrabold text-red-600">Xoá role {deleteTarget.key}?</div>
            <div className="text-sm text-slate-600 mt-2">Hành động này sẽ xoá role khỏi hệ thống.</div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn" onClick={() => setDeleteTarget(null)}>Huỷ</button>
              <button className="btn" style={{ background: "#dc2626", color: "white" }} onClick={() => void confirmDeleteRole()}>Xoá</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
