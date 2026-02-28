import { get, post } from "./http";

export type LessonVideoItem = {
  id: number;
  title: string;
  localizedTitle?: string;
  playbackUrl?: string;
  durationSec?: number;
  progress?: { watchedSec: number; durationSec: number; completed: boolean };
};

export type LessonModuleItem = {
  id: number;
  title: string;
  localizedTitle?: string;
  videos: LessonVideoItem[];
  progress?: { watchedSec: number; durationSec: number; percent: number; completed: boolean };
};

export type LessonDetail = {
  id: number;
  courseId: number;
  title: string;
  localizedTitle?: string;
  slug?: string | null;
  order?: number | null;
  published?: boolean;
  content?: string | null;
  modules?: LessonModuleItem[];
  createdAt?: string;
  updatedAt?: string;
};

export const lessonsApi = {
  detail(id: number, lang?: string) {
    const q = lang ? `?lang=${encodeURIComponent(lang)}` : "";
    return get<LessonDetail>(`/lessons/${id}${q}`, { auth: true });
  },

  touchProgress(id: number) {
    return post<{ ok: boolean }>(`/lessons/${id}/progress`, {}, { auth: true });
  },

  complete(id: number) {
    return post<{ ok: boolean }>(`/lessons/${id}/complete`, {}, { auth: true });
  },
};
