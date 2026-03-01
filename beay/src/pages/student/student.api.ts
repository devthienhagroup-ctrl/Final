import type { EnrollmentStatus } from "./student.types";

const API_BASE = (import.meta.env.VITE_API_BASE || "http://localhost:8090").replace(/\/+$/, "");
const ACCESS_TOKEN_KEY = "aya_admin_token";

function joinUrl(path: string) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);

  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(joinUrl(path), {
    ...init,
    headers,
    credentials: "include",
  });

  const text = await response.text();
  if (!response.ok) throw new Error(text || `HTTP ${response.status}`);
  return text ? (JSON.parse(text) as T) : ({} as T);
}

export type ApiLesson = {
  id: number;
  title: string;
  localizedTitle?: string;
  description?: string | null;
  localizedDescription?: string | null;
  order?: number;
  progress?: { status?: string; percent?: number } | null;
};

export type ApiCourseProgress = {
  courseId: number;
  totalLessons: number;
  completedLessons: number;
  percent: number;
  items?: Array<{ lessonId: number; status: string; seconds?: number }>;
};

export type ApiCourseDetail = {
  id: number;
  topicId?: number | null;
  topic?: { id: number; name: string } | null;
  title: string;
  shortDescription?: string | null;
  description?: string | null;
  time?: string | null;
  slug?: string | null;
  thumbnail?: string | null;
  price: number;
  published?: boolean;
  objectives?: string[];
  targetAudience?: string[];
  benefits?: string[];
  ratingAvg?: number;
  ratingCount?: number;
  enrollmentCount?: number;
  videoCount?: number;
  _count?: { lessons?: number };
  createdAt?: string;
  updatedAt?: string;
};

export type ApiMyCourse = {
  id: number;
  courseId: number;
  status: EnrollmentStatus;
  course: {
    id: number;
    title: string;
    price: number;
    _count?: {
      lessons?: number;
    };
  };
  progress?: ApiCourseProgress;
};

export type ApiLessonVideo = {
  id: number;
  title: string;
  localizedTitle?: string;
  description?: string | null;
  localizedDescription?: string | null;
  playbackUrl?: string;
  durationSec?: number;
  progress?: { watchedSec: number; durationSec: number; completed: boolean };
};

export type ApiLessonModule = {
  id: number;
  title: string;
  localizedTitle?: string;
  description?: string | null;
  localizedDescription?: string | null;
  videos: ApiLessonVideo[];
  progress?: { watchedSec: number; durationSec: number; percent: number; completed: boolean };
};

export type ApiLessonDetail = {
  id: number;
  courseId: number;
  title: string;
  localizedTitle?: string;
  description?: string | null;
  localizedDescription?: string | null;
  modules?: ApiLessonModule[];
};

export const studentApi = {
  myCourses: (lang = "vi") => request<ApiMyCourse[]>(`/me/courses?lang=${encodeURIComponent(lang)}`),
  courseDetail: (courseId: number, lang = "vi") => request<ApiCourseDetail>(`/courses/${courseId}?lang=${encodeURIComponent(lang)}`),
  courseLessons: (courseId: number) => request<ApiLesson[]>(`/courses/${courseId}/lessons`),
  courseLessonsOutline: (courseId: number, lang = "vi") => request<ApiLesson[]>(`/courses/${courseId}/lessons-outline?lang=${encodeURIComponent(lang)}`),
  courseProgress: (courseId: number) => request<ApiCourseProgress>(`/me/courses/${courseId}/progress`),
  lessonDetail: (lessonId: number, lang = "vi") => request<ApiLessonDetail>(`/lessons/${lessonId}?lang=${encodeURIComponent(lang)}`),
  updateVideoProgress: (lessonId: number, videoId: number, watchedSec: number, completed = false) =>
    request(`/lessons/${lessonId}/videos/${videoId}/progress`, {
      method: "POST",
      body: JSON.stringify({ watchedSec, completed }),
    }),
  completeModule: (lessonId: number, moduleId: number) =>
    request(`/lessons/${lessonId}/modules/${moduleId}/complete`, { method: "POST" }),
  cancelCourse: (courseId: number) => request<{ id: number; status: EnrollmentStatus }>(`/courses/${courseId}/cancel`, { method: "POST" }),
  myProgress: () => request<Array<{ lessonId: number; lesson?: { courseId?: number; title?: string } }>>(`/me/progress`),
};
