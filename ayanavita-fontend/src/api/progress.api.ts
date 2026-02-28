// src/api/progress.api.ts
import { get, post } from "./http";

export type ProgressStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export type LessonProgress = {
  lessonId: number;
  status: ProgressStatus;
  seconds?: number | null;
  updatedAt?: string;
};

export type CourseProgressRes = {
  courseId: number;
  totalLessons: number;
  completedLessons: number;
  percent: number;
  items: LessonProgress[];
};

export type UpsertProgressBody = {
  lastPositionSec?: number;
  percent?: number;
};

export const progressApi = {
  upsert: (lessonId: number, body: UpsertProgressBody) =>
    post(`/lessons/${lessonId}/progress`, body, { auth: true }),

  markProgress: (lessonId: number, seconds?: number, percent?: number) =>
    post(
      `/lessons/${lessonId}/progress`,
      {
        ...(seconds !== undefined ? { lastPositionSec: seconds } : {}),
        ...(percent !== undefined ? { percent } : {}),
      } as UpsertProgressBody,
      { auth: true }
    ),

  complete: (lessonId: number) => post(`/lessons/${lessonId}/complete`, {}, { auth: true }),

  updateVideoProgress: (lessonId: number, videoId: number, watchedSec: number, completed = false) =>
    post(
      `/lessons/${lessonId}/videos/${videoId}/progress`,
      { watchedSec, completed },
      { auth: true }
    ),

  completeModule: (lessonId: number, moduleId: number) =>
    post(`/lessons/${lessonId}/modules/${moduleId}/complete`, {}, { auth: true }),

  myProgress: () => get<any>(`/me/progress`, { auth: true }),

  courseProgress: (courseId: number) =>
    get<CourseProgressRes>(`/me/courses/${courseId}/progress`, { auth: true }),
};
