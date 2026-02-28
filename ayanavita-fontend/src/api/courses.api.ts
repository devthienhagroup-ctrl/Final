// src/api/courses.api.ts
import { get, post } from "./http";

export type Course = {
  id: number;
  title: string;
  slug: string;
  description: string;
  thumbnail: string | null;
  price: number;
  published: boolean;
  ratingAvg?: number;
  ratingCount?: number;
  _count?: { lessons: number };
};

export type Lesson = {
  id: number;
  title: string;
  content: string | null; // thường outline sẽ null
  videoUrl: string | null;
  order: number;
};

export type CourseReview = {
  id: number;
  stars: number;
  comment: string | null;
  customerName: string;
  createdAt: string;
  updatedAt: string;
};

export const coursesApi = {
  list: () => get<Course[]>("/courses", { auth: true }),
  detail: (id: number) => get<Course>(`/courses/${id}`, { auth: true }),
  lessons: (courseId: number) => get<Lesson[]>(`/courses/${courseId}/lessons`, { auth: true }),
  lessonsOutline: (courseId: number) => get<Lesson[]>(`/courses/${courseId}/lessons-outline`, { auth: true }),
  reviews: (courseId: number) => get<CourseReview[]>(`/courses/${courseId}/reviews`, { auth: true }),
  submitReview: (courseId: number, body: { stars: number; comment?: string; customerName?: string }) =>
    post<CourseReview & { ratingAvg: number; ratingCount: number }>(`/courses/${courseId}/reviews`, body, { auth: true }),
};
