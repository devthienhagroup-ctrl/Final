// src/api/lessons.api.ts
import { get, post } from "./http";

export type LessonDetail = {
  id: number;
  courseId: number;
  title: string;
  slug?: string | null;
  order?: number | null;
  published?: boolean;
  content?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export const lessonsApi = {
  // GET /lessons/:id (GATED)
  detail(id: number) {
    return get<LessonDetail>(`/lessons/${id}`, { auth: true });
  },

  // POST /lessons/:id/progress (touch IN_PROGRESS)
  touchProgress(id: number) {
    return post<{ ok: boolean }>(`/lessons/${id}/progress`, {}, { auth: true });
  },

  // POST /lessons/:id/complete
  complete(id: number) {
    return post<{ ok: boolean }>(`/lessons/${id}/complete`, {}, { auth: true });
  },
};
