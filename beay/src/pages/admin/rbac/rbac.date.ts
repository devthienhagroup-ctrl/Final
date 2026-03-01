import type { Assignment } from "./rbac.model";

export function parseDate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function fmtDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function addCadence(start: Date, unit: Assignment["cadence"]["unit"], value: number) {
  const d = new Date(start.getTime());
  const v = Number(value || 1);
  if (unit === "day") d.setDate(d.getDate() + v);
  if (unit === "week") d.setDate(d.getDate() + v * 7);
  if (unit === "month") d.setMonth(d.getMonth() + v);
  if (unit === "year") d.setFullYear(d.getFullYear() + v);
  return d;
}

export function expiryStatus(expiresAt: string) {
  const today = new Date();
  const ex = parseDate(expiresAt);
  const diff = Math.floor((ex.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { tone: "bad" as const, text: "Hết hạn", days: diff };
  if (diff <= 7) return { tone: "warn" as const, text: `Sắp hết hạn (${diff} ngày)`, days: diff };
  return { tone: "ok" as const, text: `Còn hạn (${diff} ngày)`, days: diff };
}