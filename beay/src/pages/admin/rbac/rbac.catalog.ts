// src/pages/admin/rbac/rbac.catalog.ts
import type { PermDef } from "./rbac.model";

export const MODULES = [
  { key: "role", name: "ROLE & RBAC", desc: "Role/permission/assignments" },
  { key: "spa_services", name: "Tùy chỉnh dịch vụ Spa", desc: "Dịch vụ, liệu trình, giá, chi nhánh" },
  { key: "appointments", name: "Quản lý lịch hẹn", desc: "Quản lý lịch, phân công staff" },
  { key: "booking", name: "Đặt lịch", desc: "Khách đặt lịch, xác nhận/huỷ" },
  { key: "products", name: "Quản lý sản phẩm (thiết bị cứng)", desc: "Sản phẩm, kho, giá" },
  { key: "courses", name: "Quản lý khóa học", desc: "Khoá, bài học, publish" },
  { key: "my_courses", name: "Khóa học của tôi", desc: "Enrollment, tiến độ, chứng chỉ" },
  { key: "cms", name: "CMS", desc: "Landing/pages/sections" },
  { key: "cart", name: "Giỏ hàng", desc: "Thêm/sửa/xoá giỏ" },
  { key: "orders", name: "Đơn hàng", desc: "Order lifecycle, export, mark-paid" },
  { key: "enroll", name: "Đăng ký khóa học", desc: "Enroll/cancel" },
  { key: "payments", name: "Thanh toán", desc: "Gateway, capture, refund, reconcile" },
  { key: "packages", name: "Quản lý gói dịch vụ", desc: "Gói spa/gói membership/gói học" },
  { key: "support", name: "Support/Ticket/Chat", desc: "CSKH, ticket, chat" },
] as const;

export const ACTIONS = [
  { key: "read", desc: "Xem dữ liệu" },
  { key: "write", desc: "Tạo/sửa dữ liệu" },
  { key: "manage", desc: "Quản trị/CRUD nâng cao" },
  { key: "publish", desc: "Xuất bản nội dung" },
  { key: "approve", desc: "Duyệt" },
  { key: "refund", desc: "Hoàn tiền" },
  { key: "export", desc: "Xuất file/báo cáo" },
] as const;

const MODULE_NAME_BY_KEY = Object.fromEntries(MODULES.map((m) => [m.key, m.name])) as Record<string, string>;
const ACTION_DESC_BY_KEY = Object.fromEntries(ACTIONS.map((a) => [a.key, a.desc])) as Record<string, string>;

const PERM_KEYS = [
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
  "spa_services.read",
  "spa_services.write",
  "appointments.read",
  "appointments.write",
  "appointments.approve",
  "booking.approve",
  "products.read",
  "spa_services.manage",
  "appointments.manage",
  "booking.manage",
  "products.write",
  "orders.export",
  "packages.manage",
  "packages.write",
  "packages.read",
  "support.manage",
  "role.read",
  "courses.write",
  "courses.publish",
  "cms.read",
  "orders.manage",
  "cms.write",
  "payments.manage",
  "payments.export",
  "payments.approve",
  "payments.refund",
  "orders.refund",
  "role.manage",
] as const;

export const PERMS: PermDef[] = PERM_KEYS.map((key) => {
  const [module, action] = key.split(".");
  const moduleName = MODULE_NAME_BY_KEY[module] ?? module;
  const actionDesc = ACTION_DESC_BY_KEY[action] ?? action;
  return {
    key,
    module,
    moduleName,
    action,
    desc: `${actionDesc} • ${moduleName}`,
  };
});

// Nếu bạn đang dùng DEFAULT_ROLES ở nơi khác:
export const DEFAULT_ROLES = [
  { key: "USER", name: "User", desc: "Khách / Học viên", scope: "OWN", tier: "basic" },
  { key: "STAFF", name: "Staff (Chuyên viên spa)", desc: "Vận hành spa, lịch hẹn", scope: "BRANCH", tier: "staff" },
  { key: "BRANCH_MANAGER", name: "Branch Manager", desc: "Quản lý chi nhánh", scope: "BRANCH", tier: "admin" },
  { key: "LECTURER", name: "Lecturer (Giảng viên)", desc: "Quản lý khoá học", scope: "COURSE", tier: "staff" },
  { key: "SUPPORT", name: "Support (CSKH)", desc: "Ticket/chat, hỗ trợ mức đọc", scope: "GLOBAL", tier: "staff" },
  { key: "OPS", name: "Ops", desc: "Vận hành tổng, đơn hàng, booking", scope: "GLOBAL", tier: "admin" },
  { key: "FINANCE", name: "Finance", desc: "Thanh toán, refund, đối soát", scope: "GLOBAL", tier: "admin" },
  { key: "ADMIN", name: "Admin", desc: "Toàn quyền hệ thống", scope: "GLOBAL", tier: "root" },
] as const;
