// src/pages/instructor/instructor.mock.ts
import type { Course } from "./instructor.types";

export const MOCK_COURSES: Course[] = [
  { id: 1, title: "Flutter LMS App", status: "PUBLISHED", lessons: 24, drafts: 2, students: 620 },
  { id: 2, title: "NestJS + Prisma (LMS API)", status: "PUBLISHED", lessons: 18, drafts: 3, students: 410 },
  { id: 3, title: "React UI Systems", status: "DRAFT", lessons: 12, drafts: 4, students: 0 },
  { id: 4, title: "Marketing bán khoá", status: "PUBLISHED", lessons: 14, drafts: 0, students: 216 },
];