// src/pages/admin/AdminRbacPage.tsx
import { useMemo, useState } from "react";
import { useToast } from "../../ui/toast";

import { MODULES, PERMS, DEFAULT_ROLES, ACTIONS } from "./rbac/rbac.catalog";
import type {
  Assignment,
  AuditItem,
  Role,
  RolePermMap,
  TestScope,
} from "./rbac/rbac.model";
import { presetMap, type PresetKey } from "./rbac/rbac.presets";
import {
  loadAssignments,
  loadAudit,
  loadRolePerms,
  loadRoles,
  nowISO,
  saveAssignments,
  saveAudit,
  saveRolePerms,
  saveRoles,
} from "./rbac/rbac.storage";
import { addCadence, fmtDate, parseDate } from "./rbac/rbac.date";

import { RbacHeader } from "./rbac/ui/RbacHeader";
import { RolesPanel } from "./rbac/ui/RolesPanel";
import { PermissionsMatrix } from "./rbac/ui/PermissionsMatrix";
import { AssignmentsPanel } from "./rbac/ui/AssignmentsPanel";
import { AuditPanel } from "./rbac/ui/AuditPanel";
import { TestAccessDrawer } from "./rbac/ui/TestAccessDrawer";

/** helpers */
function omitKey<T extends Record<string, unknown>>(obj: T, key: string): T {
  const copy: Record<string, unknown> = { ...obj };
  delete copy[key];
  return copy as T;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function isRoleArray(v: unknown): v is Role[] {
  return Array.isArray(v) && v.every((x) => isRecord(x) && typeof x.key === "string");
}
function isRolePermMap(v: unknown): v is RolePermMap {
  if (!isRecord(v)) return false;
  for (const k of Object.keys(v)) {
    const arr = (v as Record<string, unknown>)[k];
    if (!Array.isArray(arr) || !arr.every((x) => typeof x === "string")) return false;
  }
  return true;
}
function isAssignmentArray(v: unknown): v is Assignment[] {
  return (
    Array.isArray(v) &&
    v.every(
      (x) =>
        isRecord(x) &&
        typeof x.id === "number" &&
        typeof x.user === "string" &&
        typeof x.role === "string" &&
        isRecord(x.scope) &&
        typeof x.scope.type === "string" &&
        isRecord(x.cadence) &&
        typeof x.cadence.unit === "string" &&
        typeof x.cadence.value === "number" &&
        typeof x.startAt === "string" &&
        typeof x.expiresAt === "string"
    )
  );
}

export function AdminRbacPage() {
  const { toast } = useToast();

  const [roles, setRoles] = useState<Role[]>(() => loadRoles());
  const [rolePerms, setRolePerms] = useState<RolePermMap>(() =>
    loadRolePerms(loadRoles().map((r) => r.key))
  );
  const [assignments, setAssignments] = useState<Assignment[]>(() =>
    loadAssignments()
  );
  const [audit, setAudit] = useState<AuditItem[]>(() => loadAudit());

  const [activeRole, setActiveRole] = useState<string>("ADMIN");
  const [roleSearch, setRoleSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("ALL");

  // Drawer test access
  const [testOpen, setTestOpen] = useState(false);
  const [testKey, setTestKey] = useState(0); // remount to reset form

  const activePermSet = useMemo(
    () => new Set(rolePerms[activeRole] ?? []),
    [rolePerms, activeRole]
  );

  const visibleRoles = useMemo(() => {
    const kw = roleSearch.trim().toLowerCase();
    return roles.filter(
      (r) =>
        !kw ||
        (r.key + " " + r.name + " " + r.desc).toLowerCase().includes(kw)
    );
  }, [roles, roleSearch]);

  const filteredPerms = useMemo(() => {
    return moduleFilter === "ALL"
      ? PERMS
      : PERMS.filter((p) => p.module === moduleFilter);
  }, [moduleFilter]);

  function pushAudit(type: AuditItem["type"], msg: string) {
    const item: AuditItem = { at: nowISO(), type, msg };
    const next = [item, ...audit].slice(0, 200);
    setAudit(next);
    saveAudit(next);
  }

  function ensureRoleKeyExists(key: string) {
    setRolePerms((prev) => {
      if (prev[key]) return prev;
      const next = { ...prev, [key]: [] };
      saveRolePerms(next);
      return next;
    });
  }

  // ===== Role actions =====
  function createRole() {
    const key = (prompt("Nhập key role (VD: MANAGER):", "MANAGER") || "")
      .trim()
      .toUpperCase();
    if (!key) return;
    if (roles.some((r) => r.key === key)) {
      toast("Trùng role", "Role đã tồn tại.");
      return;
    }

    const name = prompt("Tên hiển thị:", key) || key;
    const desc = prompt("Mô tả:", "Vai trò mới") || "Vai trò mới";
    const scope = (prompt("Scope (OWN/BRANCH/COURSE/GLOBAL):", "GLOBAL") ||
      "GLOBAL") as Role["scope"];
    const tier = (prompt("Tier (basic/staff/admin/root/custom):", "custom") ||
      "custom") as Role["tier"];

    const nextRoles: Role[] = [...roles, { key, name, desc, scope, tier }];
    setRoles(nextRoles);
    saveRoles(nextRoles);

    const nextPerms: RolePermMap = { ...rolePerms, [key]: [] };
    setRolePerms(nextPerms);
    saveRolePerms(nextPerms);

    setActiveRole(key);
    pushAudit("ROLE", `Tạo role ${key}`);
    toast("Đã tạo role", key);
  }

  function editRole(key: string) {
    const r = roles.find((x) => x.key === key);
    if (!r) return;

    const name = prompt("Tên role:", r.name) ?? r.name;
    const desc = prompt("Mô tả role:", r.desc) ?? r.desc;
    const scope = (prompt("Scope (OWN/BRANCH/COURSE/GLOBAL):", r.scope) ??
      r.scope) as Role["scope"];
    const tier = (prompt("Tier (basic/staff/admin/root/custom):", r.tier) ??
      r.tier) as Role["tier"];

    const next = roles.map((x) =>
      x.key === key ? { ...x, name, desc, scope, tier } : x
    );
    setRoles(next);
    saveRoles(next);
    pushAudit("ROLE", `Sửa role ${key}`);
  }

  function deleteRole(key: string) {
    const systemKeys = new Set(DEFAULT_ROLES.map((r) => r.key));
    if (systemKeys.has(key)) {
      toast("Không xoá được", "Role hệ thống v1 không cho xoá.");
      return;
    }
    if (!confirm("Xoá role " + key + " ?")) return;

    const nextRoles = roles.filter((r) => r.key !== key);
    setRoles(nextRoles);
    saveRoles(nextRoles);

    const nextPerms = omitKey(rolePerms as Record<string, unknown>, key) as RolePermMap;
    setRolePerms(nextPerms);
    saveRolePerms(nextPerms);

    const nextAssign = assignments.filter((a) => a.role !== key);
    setAssignments(nextAssign);
    saveAssignments(nextAssign);

    if (activeRole === key) setActiveRole("ADMIN");
    pushAudit("ROLE", `Xoá role ${key}`);
  }

  // ===== Perm toggle =====
  function togglePerm(permKey: string, checked: boolean) {
    const cur = new Set(rolePerms[activeRole] ?? []);
    if (checked) cur.add(permKey);
    else cur.delete(permKey);

    const next: RolePermMap = { ...rolePerms, [activeRole]: Array.from(cur) };
    setRolePerms(next);
    saveRolePerms(next);

    pushAudit("PERM", `${activeRole} ${checked ? "+" : "-"} ${permKey}`);
  }

  function applyPresetToActive(preset: PresetKey) {
    const p = presetMap();
    const set = p[preset];
    const next: RolePermMap = { ...rolePerms, [activeRole]: Array.from(set) };
    setRolePerms(next);
    saveRolePerms(next);
    pushAudit("PERM", `Áp preset ${preset} cho ${activeRole}`);
    toast("Áp preset", `${preset} → ${activeRole}`);
  }

  function allPerms() {
    const next: RolePermMap = { ...rolePerms, [activeRole]: PERMS.map((x) => x.key) };
    setRolePerms(next);
    saveRolePerms(next);
    pushAudit("PERM", `${activeRole} bật ALL`);
    toast("All permissions", "Đã bật toàn quyền cho " + activeRole);
  }

  function nonePerms() {
    const next: RolePermMap = { ...rolePerms, [activeRole]: [] };
    setRolePerms(next);
    saveRolePerms(next);
    pushAudit("PERM", `${activeRole} tắt ALL`);
    toast("Clear permissions", "Đã tắt hết quyền cho " + activeRole);
  }

  // ===== Assignments =====
  function addAssignment() {
    const email = prompt("Nhập email user:", "new.user@ayanavita.vn");
    if (!email) return;

    const role = prompt(
      "Role key (USER/STAFF/BRANCH_MANAGER/LECTURER/SUPPORT/OPS/FINANCE/ADMIN):",
      "USER"
    );
    if (!role) return;

    if (!roles.some((r) => r.key === role)) {
      toast("Role không tồn tại", "Hãy tạo role trước.");
      return;
    }
    ensureRoleKeyExists(role);

    const roleScope = roles.find((r) => r.key === role)?.scope ?? "OWN";
    const scopeType = (prompt("Scope type (OWN/BRANCH/COURSE/GLOBAL):", roleScope) ||
      roleScope) as Assignment["scope"]["type"];
    const scopeId =
      scopeType === "BRANCH" || scopeType === "COURSE"
        ? prompt("Scope id (VD branchId/courseId):", "1") || "1"
        : null;

    const unit = (prompt("Chu kỳ unit (day/week/month/year):", "month") ||
      "month") as Assignment["cadence"]["unit"];
    const value = Number(prompt("Chu kỳ value:", "1") || "1");
    const startAt = prompt("Ngày bắt đầu (YYYY-MM-DD):", fmtDate(new Date())) || fmtDate(new Date());
    const expiresAt = fmtDate(addCadence(parseDate(startAt), unit, value));

    const id = assignments.length ? Math.max(...assignments.map((x) => x.id)) + 1 : 1;
    const next: Assignment = {
      id,
      user: email,
      role,
      scope: { type: scopeType, id: scopeId },
      cadence: { unit, value },
      startAt,
      expiresAt,
    };

    const list = [next, ...assignments];
    setAssignments(list);
    saveAssignments(list);
    pushAudit("ASSIGN", `Gán ${role} cho ${email} (${scopeType}${scopeId ? ":" + scopeId : ""})`);
    toast("Đã gán role", `${email} → ${role} (hết hạn: ${expiresAt})`);
  }

  function clearAssignments() {
    if (!confirm("Xoá toàn bộ assignments?")) return;
    setAssignments([]);
    saveAssignments([]);
    pushAudit("ASSIGN", "Xoá toàn bộ assignments");
    toast("Đã xoá", "Assignments đã bị xoá hết.");
  }

  function deleteAssignment(id: number) {
    const list = assignments.filter((x) => x.id !== id);
    setAssignments(list);
    saveAssignments(list);
    pushAudit("ASSIGN", "Xoá assignment #" + id);
  }

  function renewAssignment(id: number) {
    const a = assignments.find((x) => x.id === id);
    if (!a) return;

    const start = parseDate(a.startAt);
    const ex = addCadence(start, a.cadence.unit, a.cadence.value);
    const expiresAt = fmtDate(ex);

    const list = assignments.map((x) => (x.id === id ? { ...x, expiresAt } : x));
    setAssignments(list);
    saveAssignments(list);

    pushAudit("ASSIGN", `Gia hạn ${a.role} cho ${a.user} đến ${expiresAt}`);
    toast("Gia hạn", `${a.user} • ${a.role} → ${expiresAt}`);
  }

  // ===== Save / Export / Import =====
  function saveAll() {
    saveRoles(roles);
    saveRolePerms(rolePerms);
    saveAssignments(assignments);
    pushAudit("SYSTEM", "Lưu cấu hình RBAC");
    toast("Đã lưu", "Cấu hình được lưu localStorage.");
    // API note: POST /admin/rbac/snapshot (roles, rolePerms, assignments)
  }

  function exportJson() {
    const payload = {
      version: "ayanavita-rbac-v1",
      exportedAt: nowISO(),
      roles,
      rolePerms,
      assignments,
      modules: MODULES,
      actions: ACTIONS,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ayanavita-rbac-v1.json";
    a.click();
    URL.revokeObjectURL(a.href);
    toast("Export JSON", "Đã tải cấu hình RBAC.");
  }

  async function importJsonFile(file: File) {
    try {
      const txt = await file.text();
      const parsed: unknown = JSON.parse(txt);

      if (!isRecord(parsed)) throw new Error("invalid");

      const nextRoles = isRoleArray(parsed.roles) ? parsed.roles : roles;
      const nextPerms = isRolePermMap(parsed.rolePerms) ? parsed.rolePerms : rolePerms;
      const nextAssign = isAssignmentArray(parsed.assignments) ? parsed.assignments : assignments;

      setRoles(nextRoles);
      setRolePerms(nextPerms);
      setAssignments(nextAssign);

      saveRoles(nextRoles);
      saveRolePerms(nextPerms);
      saveAssignments(nextAssign);

      if (!nextRoles.some((r) => r.key === activeRole)) setActiveRole("ADMIN");

      pushAudit("SYSTEM", "Import JSON RBAC");
      toast("Import OK", "Đã nạp cấu hình từ file.");
    } catch {
      toast("Import lỗi", "File JSON không hợp lệ.");
    }
  }

  function clearAudit() {
    setAudit([]);
    saveAudit([]);
    toast("Đã xoá log", "Audit log đã được dọn sạch.");
  }

  // ===== Test access =====
  function isRoleActiveForUser(email: string, roleKey: string) {
    if (roleKey === "ADMIN") return true;
    const today = new Date();
    const list = assignments.filter((a) => a.user === email && a.role === roleKey);
    if (!list.length) return false;
    return list.some((a) => parseDate(a.expiresAt) >= today);
  }

  function can(roleKey: string, permKey: string) {
    if (roleKey === "ADMIN") return true;
    return new Set(rolePerms[roleKey] ?? []).has(permKey);
  }

  function runTestAccess(params: {
    email: string;
    role: string;
    module: string;
    action: string;
    resource: string;
    scope: TestScope;
  }) {
    const permKey = `${params.module}.${params.action}`;
    const active = isRoleActiveForUser(params.email, params.role);
    const allowed = active && can(params.role, permKey);

    pushAudit(
      "TEST",
      `${params.email} (${params.role}) → ${permKey} = ${allowed ? "ALLOW" : "DENY"}`
    );

    return {
      permKey,
      active,
      allowed,
      reason: !active ? "ROLE EXPIRED/NOT ASSIGNED" : allowed ? "OK" : "NO PERMISSION",
    };
  }

  // ===== UI =====
  const checkpointText =
    "Roles: USER, STAFF, BRANCH_MANAGER, LECTURER, SUPPORT, OPS, FINANCE, ADMIN • Role expiry theo day/week/month/year • Preset quyền theo đúng bảng đã duyệt.";

  return (
    <div className="soft text-slate-900 min-h-screen">
      <RbacHeader
        onTest={() => {
          setTestKey((k) => k + 1);
          setTestOpen(true);
        }}
        onImport={async () => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "application/json";
          input.onchange = async () => {
            const f = input.files?.[0];
            if (f) await importJsonFile(f);
          };
          input.click();
        }}
        onExport={exportJson}
        onSave={saveAll}
      />

      <main className="px-4 md:px-8 py-6 space-y-6">
        <section className="card p-6">
          <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
            <div>
              <div className="text-xs font-extrabold text-slate-500">Checkpoint</div>
              <div className="text-lg font-extrabold">Đã chốt bảng role v1</div>
              <div className="mt-1 text-sm text-slate-600">{checkpointText}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="chip">
                <i className="fa-solid fa-shield-halved text-indigo-600 mr-1" />
                RBAC
              </span>
              <span className="chip">
                <i className="fa-solid fa-clock text-amber-600 mr-1" />
                Expiry
              </span>
              <span className="chip">
                <i className="fa-solid fa-scroll text-emerald-600 mr-1" />
                Audit
              </span>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <RolesPanel
            roles={visibleRoles}
            activeRole={activeRole}
            onSelectRole={(k) => setActiveRole(k)}
            search={roleSearch}
            onSearch={setRoleSearch}
            onNewRole={createRole}
            onEditRole={editRole}
            onDeleteRole={deleteRole}
            onJumpRole={(k) => setActiveRole(k)}
          />

          <PermissionsMatrix
            activeRole={activeRole}
            moduleFilter={moduleFilter}
            onChangeModuleFilter={setModuleFilter}
            presetSelectOptions={[
              { value: "KEEP", label: "Preset: (không đổi)" },
              { value: "STRICT", label: "Preset: Nghiêm ngặt" },
              { value: "USER", label: "Preset: USER" },
              { value: "STAFF", label: "Preset: STAFF" },
              { value: "BRANCH_MANAGER", label: "Preset: BRANCH_MANAGER" },
              { value: "LECTURER", label: "Preset: LECTURER" },
              { value: "SUPPORT", label: "Preset: SUPPORT" },
              { value: "OPS", label: "Preset: OPS" },
              { value: "FINANCE", label: "Preset: FINANCE" },
              { value: "ADMIN", label: "Preset: ADMIN" },
            ]}
            onApplyPreset={(v) => {
              if (v === "KEEP") return;
              applyPresetToActive(v as PresetKey);
            }}
            onAll={allPerms}
            onNone={nonePerms}
            perms={filteredPerms}
            activePermSet={activePermSet}
            onTogglePerm={togglePerm}
            roles={roles}
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <AssignmentsPanel
            assignments={assignments}
            onAdd={addAssignment}
            onClear={clearAssignments}
            onRenew={renewAssignment}
            onDelete={deleteAssignment}
          />
          <AuditPanel audit={audit} onClear={clearAudit} />
        </section>

        <footer className="py-6 text-center text-sm text-slate-500">
          © 2025 AYANAVITA • RBAC v1 (React)
        </footer>
      </main>

      <TestAccessDrawer
        key={testKey}
        open={testOpen}
        onClose={() => setTestOpen(false)}
        roles={roles}
        modules={MODULES}
        actions={ACTIONS}
        onRun={(input) => runTestAccess(input)}
      />
    </div>
  );
}