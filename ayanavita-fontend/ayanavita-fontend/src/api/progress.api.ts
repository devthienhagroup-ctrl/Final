// src/api/progress.api.ts
import { get, post } from "./http";

/**
 * Nên thống nhất status có NOT_STARTED để UI dùng luôn
 * - Backend thực tế thường chỉ lưu record khi có hoạt động,
 *   nên lesson chưa học => progress = null => NOT_STARTED.
 */
export type ProgressStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

/**
 * FE-friendly view of lesson progress
 * - seconds: map từ lastPositionSec (backend)
 */
export type LessonProgress = {
  lessonId: number;
  status: ProgressStatus;
  seconds?: number | null;
  updatedAt?: string;
};

/**
 * Course progress response (FE-friendly)
 * - items: danh sách progress theo lessonId
 */
export type CourseProgressRes = {
  courseId: number;
  totalLessons: number;
  completedLessons: number;
  percent: number; // 0..100
  items?: LessonProgress[];
};

/**
 * Backend raw types (để không mismatch khi backend trả progress object lồng)
 */
export type ProgressRecord = {
  lessonId: number;
  status: Exclude<ProgressStatus, "NOT_STARTED">; // record đã tồn tại thì thường IN_PROGRESS/COMPLETED
  percent?: number | null;
  lastPositionSec?: number | null;
  lastOpenedAt?: string | null;
  completedAt?: string | null;
  updatedAt?: string | null;
};

export type BackendCourseProgressItem = {
  lessonId: number;
  title: string;
  order?: number | null;
  published?: boolean;
  progress: ProgressRecord | null;
};

export type BackendCourseProgressRes = {
  courseId: number;
  totalLessons: number;
  completedLessons: number;
  percent: number; // 0..100
  items: BackendCourseProgressItem[];
};

/**
 * Backend Progress DTO:
 * POST /lessons/:id/progress
 * body: { lastPositionSec?: number; percent?: number }
 */
export type UpsertProgressBody = {
  lastPositionSec?: number;
  percent?: number;
};

function toLessonProgressList(raw: BackendCourseProgressRes): LessonProgress[] {
  const items = raw?.items || [];
  return items.map((it) => {
    // Nếu progress null => NOT_STARTED
    if (!it.progress) {
      return {
        lessonId: it.lessonId,
        status: "NOT_STARTED",
        seconds: null,
        updatedAt: undefined,
      };
    }

    return {
      lessonId: it.lessonId,
      status: (it.progress.status ?? "IN_PROGRESS") as ProgressStatus,
      seconds: it.progress.lastPositionSec ?? null,
      updatedAt: it.progress.updatedAt ?? undefined,
    };
  });
}

export const progressApi = {
  /**
   * Upsert progress (idempotent)
   * POST /lessons/:id/progress
   */
  upsert: (lessonId: number, body: UpsertProgressBody) =>
    post<{ ok: boolean }>(`/lessons/${lessonId}/progress`, body, { auth: true }),

  /**
   * Backward-compatible helper:
   * - seconds (FE) -> lastPositionSec (BE)
   */
  markProgress: (lessonId: number, seconds?: number, percent?: number) =>
    post<{ ok: boolean }>(
      `/lessons/${lessonId}/progress`,
      {
        ...(seconds !== undefined ? { lastPositionSec: seconds } : {}),
        ...(percent !== undefined ? { percent } : {}),
      } as UpsertProgressBody,
      { auth: true }
    ),

  /**
   * Shortcut complete
   * POST /lessons/:id/complete
   */
  complete: (lessonId: number) =>
    post<{ ok: boolean }>(`/lessons/${lessonId}/complete`, {}, { auth: true }),

  /**
   * GET /me/progress
   * Backend trả array lessonProgress (kèm lesson) => để any cho linh hoạt
   */
  myProgress: () => get<any>(`/me/progress`, { auth: true }),

  /**
   * GET /me/courses/:courseId/progress
   * Trả về FE-friendly CourseProgressRes (items = LessonProgress[])
   * bằng cách map từ backend raw response.
   */
  courseProgress: async (courseId: number): Promise<CourseProgressRes> => {
    const raw = await get<BackendCourseProgressRes>(`/me/courses/${courseId}/progress`, {
      auth: true,
    });

    return {
      courseId: raw.courseId,
      totalLessons: raw.totalLessons,
      completedLessons: raw.completedLessons,
      percent: raw.percent,
      items: toLessonProgressList(raw),
    };
  },

  /**
   * Nếu UI nào đó cần raw (title/order/published + progress lồng)
   */
  courseProgressRaw: (courseId: number) =>
    get<BackendCourseProgressRes>(`/me/courses/${courseId}/progress`, { auth: true }),
};
