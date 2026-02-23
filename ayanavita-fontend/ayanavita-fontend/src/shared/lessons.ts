// src/shared/lessons.ts
export type LessonStatusUI = "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED";

export type LessonLike = {
  id: number;
  title: string;
  order?: number | null;
  published?: boolean;
  courseId?: number;
};

export type ProgressItemsLike =
  | Array<{
      lessonId?: number;
      status?: string;
      updatedAt?: string;
      progress?: { status?: string; updatedAt?: string; lastOpenedAt?: string };
    }>
  | undefined;

export type CourseProgressLike = {
  percent?: number;
  completedLessons?: number;
  totalLessons?: number;
  items?: ProgressItemsLike;
};

export type LessonRow = {
  lesson: LessonLike;
  status: LessonStatusUI;
  unlocked: boolean;
  lockedReason?: string;
  updatedAt?: string;
};

export function sortLessons<T extends LessonLike>(ls: T[]): T[] {
  return [...ls].sort((a, b) => {
    const ao = a.order ?? 0;
    const bo = b.order ?? 0;
    if (ao !== bo) return ao - bo;
    return a.id - b.id;
  });
}

export function buildProgressMap(progress: CourseProgressLike | null | undefined) {
  const rawItems: any[] = (progress as any)?.items ?? [];
  const pMap = new Map<number, { status?: string; updatedAt?: string }>();

  for (const it of rawItems) {
    const lessonId = Number(it?.lessonId);
    if (!Number.isFinite(lessonId)) continue;

    const status = it?.status ?? it?.progress?.status ?? undefined;
    const updatedAt =
      it?.updatedAt ?? it?.progress?.updatedAt ?? it?.progress?.lastOpenedAt ?? undefined;

    pMap.set(lessonId, { status, updatedAt });
  }

  return pMap;
}

export function toStatusUI(s?: string): LessonStatusUI {
  if (s === "COMPLETED") return "COMPLETED";
  if (s === "IN_PROGRESS") return "IN_PROGRESS";
  return "NOT_STARTED";
}

export function buildSequentialRows(
  lessons: LessonLike[] | null | undefined,
  progress: CourseProgressLike | null | undefined,
  lockedReasonText = "Hoàn thành bài trước để mở khoá"
): LessonRow[] {
  const sorted = sortLessons(lessons ?? []);
  const pMap = buildProgressMap(progress);

  const getStatus = (lessonId: number): LessonStatusUI => {
    const it = pMap.get(lessonId);
    return toStatusUI(it?.status);
  };

  const out: LessonRow[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const l = sorted[i];
    const status = getStatus(l.id);

    if (i === 0) {
      out.push({
        lesson: l,
        status,
        unlocked: true,
        updatedAt: pMap.get(l.id)?.updatedAt,
      });
      continue;
    }

    const prev = sorted[i - 1];
    const prevStatus = getStatus(prev.id);
    const unlocked = prevStatus === "COMPLETED";

    out.push({
      lesson: l,
      status,
      unlocked,
      lockedReason: unlocked ? undefined : lockedReasonText,
      updatedAt: pMap.get(l.id)?.updatedAt,
    });
  }

  return out;
}

export function pickContinueLessonId(rows: LessonRow[]): number {
  if (!rows.length) return 0;

  const inProg = rows
    .filter((r) => r.unlocked && r.status === "IN_PROGRESS")
    .sort((a, b) => {
      const at = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bt = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bt - at;
    });

  if (inProg.length) return inProg[0].lesson.id;

  const firstNotDone = rows.find((r) => r.unlocked && r.status !== "COMPLETED");
  if (firstNotDone) return firstNotDone.lesson.id;

  return rows[rows.length - 1].lesson.id;
}

export function statusOf(rows: LessonRow[], lessonId: number): LessonStatusUI {
  return rows.find((r) => r.lesson.id === lessonId)?.status ?? "NOT_STARTED";
}

export function getLessonNavFromRows(rows: LessonRow[], lessonId: number) {
  if (!rows.length) return { prevId: 0, nextId: 0, currIdx: -1, unlocked: true };

  const idx = rows.findIndex((r) => r.lesson.id === lessonId);
  if (idx < 0) return { prevId: 0, nextId: 0, currIdx: -1, unlocked: true };

  const prevId = idx > 0 ? rows[idx - 1].lesson.id : 0;

  // next chỉ khi nextRow unlocked
  const nextRow = idx < rows.length - 1 ? rows[idx + 1] : null;
  const nextId = nextRow && nextRow.unlocked ? nextRow.lesson.id : 0;

  const unlocked = rows[idx].unlocked;

  return { prevId, nextId, currIdx: idx, unlocked };
}
