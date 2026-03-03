import type { Assignment, AuditItem, Role, RolePermMap } from "./rbac.model";
import { DEFAULT_ROLES } from "./rbac.catalog";
import { presetMap } from "./rbac.presets";

export const LS = {
  roles: "aya_roles_v1",
  perms: "aya_role_perms_v1",
  assigns: "aya_role_assigns_v1",
  audit: "aya_audit_v1",
} as const;

export function nowISO() {
  return new Date().toISOString().slice(0, 19);
}

export function safeJsonParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadRoles(): Role[] {
  const v = safeJsonParse<Role[] | null>(localStorage.getItem(LS.roles), null);
  if (Array.isArray(v) && v.length) return v;
  return DEFAULT_ROLES.slice();
}

export function saveRoles(roles: Role[]) {
  localStorage.setItem(LS.roles, JSON.stringify(roles));
}

export function loadRolePerms(roleKeys: string[]): RolePermMap {
  const raw = safeJsonParse<Record<string, string[]> | null>(localStorage.getItem(LS.perms), null);
  if (raw && typeof raw === "object") {
    // ensure keys
    for (const k of roleKeys) raw[k] ??= [];
    return raw;
  }

  // init from presets
  const p = presetMap();
  const init: RolePermMap = {
    USER: Array.from(p.USER),
    STAFF: Array.from(p.STAFF),
    BRANCH_MANAGER: Array.from(p.BRANCH_MANAGER),
    LECTURER: Array.from(p.LECTURER),
    SUPPORT: Array.from(p.SUPPORT),
    OPS: Array.from(p.OPS),
    FINANCE: Array.from(p.FINANCE),
    ADMIN: Array.from(p.ADMIN),
  };
  for (const k of roleKeys) init[k] ??= [];
  return init;
}

export function saveRolePerms(map: RolePermMap) {
  localStorage.setItem(LS.perms, JSON.stringify(map));
}

export function loadAssignments(): Assignment[] {
  const v = safeJsonParse<Assignment[] | null>(localStorage.getItem(LS.assigns), null);
  if (Array.isArray(v)) return v;

  // seed demo
  const seed: Assignment[] = [
    { id: 1, user: "admin@ayanavita.vn", role: "ADMIN", scope: { type: "GLOBAL", id: null }, cadence: { unit: "year", value: 1 }, startAt: "2025-01-01", expiresAt: "2026-01-01" },
    { id: 2, user: "branch.manager@ayanavita.vn", role: "BRANCH_MANAGER", scope: { type: "BRANCH", id: "1" }, cadence: { unit: "year", value: 1 }, startAt: "2025-06-01", expiresAt: "2026-06-01" },
    { id: 3, user: "spa.staff@ayanavita.vn", role: "STAFF", scope: { type: "BRANCH", id: "1" }, cadence: { unit: "month", value: 3 }, startAt: "2025-11-01", expiresAt: "2026-02-01" },
    { id: 4, user: "lecturer@ayanavita.vn", role: "LECTURER", scope: { type: "COURSE", id: "101" }, cadence: { unit: "year", value: 1 }, startAt: "2025-06-01", expiresAt: "2026-06-01" },
    { id: 5, user: "support@ayanavita.vn", role: "SUPPORT", scope: { type: "GLOBAL", id: null }, cadence: { unit: "month", value: 6 }, startAt: "2025-12-01", expiresAt: "2026-06-01" },
    { id: 6, user: "user@ayanavita.vn", role: "USER", scope: { type: "OWN", id: null }, cadence: { unit: "month", value: 1 }, startAt: "2025-12-01", expiresAt: "2026-01-01" },
  ];
  localStorage.setItem(LS.assigns, JSON.stringify(seed));
  return seed;
}

export function saveAssignments(list: Assignment[]) {
  localStorage.setItem(LS.assigns, JSON.stringify(list));
}

export function loadAudit(): AuditItem[] {
  return safeJsonParse<AuditItem[]>(localStorage.getItem(LS.audit), []);
}

export function saveAudit(list: AuditItem[]) {
  localStorage.setItem(LS.audit, JSON.stringify(list));
}