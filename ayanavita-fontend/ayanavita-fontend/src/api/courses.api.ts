// src/api/courses.api.ts
import { get } from "./http";

export type Course = {
  id: number;
  title: string;
  slug: string;
  description: string;
  thumbnail: string | null;
  price: number;
  published: boolean;
  _count?: { lessons: number };
};

export type Lesson = {
  id: number;
  title: string;
  content: string | null; // thường outline sẽ null
  videoUrl: string | null;
  order: number;
  // nếu BE có courseId/slug/published... có thể bổ sung sau
};

export const coursesApi = {
  // GET /courses
  list: () => get<Course[]>("/courses", { auth: true }),

  // GET /courses/:id
  detail: (id: number) => get<Course>(`/courses/${id}`, { auth: true }),

  // GET /courses/:courseId/lessons  (gated theo Enrollment ACTIVE)
  lessons: (courseId: number) => get<Lesson[]>(`/courses/${courseId}/lessons`, { auth: true }),

  // GET /courses/:courseId/lessons-outline (fallback khi bị gate)
  lessonsOutline: (courseId: number) =>
    get<Lesson[]>(`/courses/${courseId}/lessons-outline`, { auth: true }),
};
