// src/pages/student/student.storage.ts
import type { StudyPlanItem } from "./student.types";

type UnknownRecord = Record<string, unknown>;

function isRecord(v: unknown): v is UnknownRecord {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function toStringSafe(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function toBooleanSafe(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function parsePlanItem(v: unknown): StudyPlanItem | null {
  if (!isRecord(v)) return null;

  const id = toStringSafe(v.id, "");
  const day = toStringSafe(v.day, "");
  const task = toStringSafe(v.task, "");
  const time = toStringSafe(v.time, "");
  const done = toBooleanSafe(v.done, false);

  // validate tối thiểu: cần id + day + task + time
  if (!id || !day || !task || !time) return null;

  return { id, day, task, time, done };
}

export function loadPlan(key: string, fallback: StudyPlanItem[]): StudyPlanItem[] {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return fallback;

    const items = parsed
      .map(parsePlanItem)
      .filter((x): x is StudyPlanItem => x !== null);

    return items.length ? items : fallback;
  } catch {
    return fallback;
  }
}

export function savePlan(key: string, plan: StudyPlanItem[]) {
  localStorage.setItem(key, JSON.stringify(plan));
}