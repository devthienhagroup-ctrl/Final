// src/pages/student/student.mock.ts
import type { StudentCourse, StudyPlanItem } from "./student.types";

export const MOCK_STUDENT_COURSES: StudentCourse[] = [
  { title: "Flutter LMS App", teacher: "Giảng viên A", progress: 78, lessons: "24 bài", next: "Bài 08 • GetX", active: true },
  { title: "NestJS + Prisma (LMS API)", teacher: "Giảng viên B", progress: 52, lessons: "18 bài", next: "Bài 05 • Guards", active: true },
  { title: "Marketing bán khoá", teacher: "Giảng viên C", progress: 0, lessons: "12 bài", next: "Bài 01 • Funnel", active: false },
];

export const DEFAULT_PLAN: StudyPlanItem[] = [
  { id: "mon", day: "Thứ 2", task: "Flutter • Bài 08", time: "14 phút", done: false },
  { id: "wed", day: "Thứ 4", task: "NestJS • Bài 05", time: "18 phút", done: false },
  { id: "fri", day: "Thứ 6", task: "Flutter • Quiz", time: "10 phút", done: false },
];