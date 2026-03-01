// src/pages/admin/rbac/rbac.model.ts
export type ScopeType = "OWN" | "BRANCH" | "COURSE" | "GLOBAL";
export type RoleTier = "basic" | "staff" | "admin" | "root" | "custom";

export type Role = {
  key: string;
  name: string;
  desc: string;
  scope: ScopeType;
  tier: RoleTier;
};

export type ModuleDef = { key: string; name: string; desc: string };
export type ActionDef = { key: string; desc: string };

export type PermDef = {
  module: string;
  moduleName: string;
  action: string;
  key: string;
  desc: string;
};

export type RolePermMap = Record<string, string[]>;

export type Assignment = {
  id: number;
  user: string;
  role: string;
  scope: { type: ScopeType; id: string | null };
  cadence: { unit: "day" | "week" | "month" | "year"; value: number };
  startAt: string;
  expiresAt: string;
};

export type AuditItem = {
  at: string;
  type: "SYSTEM" | "ROLE" | "PERM" | "ASSIGN" | "TEST";
  msg: string;
};

export type TestScope = ScopeType;