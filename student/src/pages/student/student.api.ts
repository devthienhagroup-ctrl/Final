import { request } from '../../api/http'
import type { EnrollmentStatus } from './student.types'


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

export type ApiLearningStats = {
  activeCourses: number;
  pendingCourses: number;
  canceledCourses: number;
  totalLessons: number;
  completedLessons: number;
  averageProgress: number;
};

export type ApiCourseReview = {
  id: number;
  stars: number;
  comment?: string | null;
  customerName?: string;
  createdAt?: string;
  updatedAt?: string;
  ratingAvg?: number;
  ratingCount?: number;
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
  courseLessons: (courseId: number, lang = "vi") => request<ApiLesson[]>(`/courses/${courseId}/lessons?lang=${encodeURIComponent(lang)}`),
  courseLessonsOutline: (courseId: number, lang = "vi") => request<ApiLesson[]>(`/courses/${courseId}/lessons-outline?lang=${encodeURIComponent(lang)}`),
  courseProgress: (courseId: number) => request<ApiCourseProgress>(`/me/courses/${courseId}/progress`),
  lessonDetail: (lessonId: number, lang = "vi") => request<ApiLessonDetail>(`/lessons/${lessonId}?lang=${encodeURIComponent(lang)}`),
  updateVideoProgress: (lessonId: number, videoId: number, watchedSec: number, completed = false) =>
    request(`/lessons/${lessonId}/videos/${videoId}/progress`, {
      method: "POST",
      body: { watchedSec, completed },
    }),
  completeModule: (lessonId: number, moduleId: number) =>
    request(`/lessons/${lessonId}/modules/${moduleId}/complete`, { method: "POST" }),
  cancelCourse: (courseId: number) => request<{ id: number; status: EnrollmentStatus }>(`/courses/${courseId}/cancel`, { method: "POST" }),
  myProgress: () => request<Array<{ lessonId: number; lesson?: { courseId?: number; title?: string } }>>(`/me/progress`),
  learningStats: () => request<ApiLearningStats>(`/me/courses/statistics`),
  courseReviews: (courseId: number) => request<ApiCourseReview[]>(`/courses/${courseId}/reviews`),
  submitCourseReview: (courseId: number, body: { stars: number; comment?: string; customerName?: string }) =>
    request<ApiCourseReview>(`/courses/${courseId}/reviews`, { method: "POST", body }),
};
