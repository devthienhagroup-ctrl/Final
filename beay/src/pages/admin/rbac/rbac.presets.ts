import { PERMS } from "./rbac.catalog";

export type PresetKey =
  | "USER"
  | "STAFF"
  | "BRANCH_MANAGER"
  | "LECTURER"
  | "SUPPORT"
  | "OPS"
  | "FINANCE"
  | "ADMIN"
  | "STRICT";

export function presetMap(): Record<PresetKey, Set<string>> {
  const ALL = new Set(PERMS.map((p) => p.key));

  const USER = new Set([
    "booking.read",
    "booking.write",
    "cart.manage",
    "orders.read",
    "payments.read",
    "courses.read",
    "my_courses.read",
    "enroll.read",
    "enroll.write",
    "support.read",
    "support.write",
  ]);

  const STAFF = new Set([
    "spa_services.read",
    "spa_services.write",
    "appointments.read",
    "appointments.write",
    "appointments.approve",
    "booking.read",
    "booking.approve",
    "products.read",
    "orders.read",
    "support.read",
    "support.write",
  ]);

  const BRANCH_MANAGER = new Set([
    "spa_services.read",
    "spa_services.write",
    "spa_services.manage",
    "appointments.read",
    "appointments.write",
    "appointments.approve",
    "appointments.manage",
    "booking.read",
    "booking.approve",
    "booking.manage",
    "products.read",
    "products.write",
    "orders.read",
    "orders.export",
    "packages.read",
    "packages.write",
    "packages.manage",
    "support.read",
    "support.write",
    "support.manage",
    "role.read",
  ]);

  const LECTURER = new Set([
    "courses.read",
    "courses.write",
    "courses.publish",
    "my_courses.read",
    "enroll.read",
    "support.read",
    "support.write",
    "cms.read",
  ]);

  const SUPPORT = new Set([
    "support.read",
    "support.write",
    "support.manage",
    "orders.read",
    "booking.read",
    "appointments.read",
    "courses.read",
    "my_courses.read",
  ]);

  const OPS = new Set([
    "orders.read",
    "orders.manage",
    "orders.export",
    "booking.read",
    "booking.approve",
    "booking.manage",
    "appointments.read",
    "appointments.manage",
    "packages.read",
    "packages.write",
    "packages.manage",
    "products.read",
    "products.write",
    "cms.read",
    "role.read",
    "support.read",
    "support.manage",
  ]);

  const FINANCE = new Set([
    "payments.read",
    "payments.manage",
    "payments.export",
    "payments.approve",
    "payments.refund",
    "orders.read",
    "orders.export",
    "orders.refund",
    "packages.read",
    "role.read",
  ]);

  const ADMIN = ALL;

  const STRICT = new Set([
    "courses.read",
    "my_courses.read",
    "booking.read",
    "booking.write",
    "cart.manage",
    "orders.read",
    "payments.read",
    "enroll.read",
    "enroll.write",
    "support.read",
    "support.write",
  ]);

  return { USER, STAFF, BRANCH_MANAGER, LECTURER, SUPPORT, OPS, FINANCE, ADMIN, STRICT };
}