// src/pages/instructor/instructor.types.ts
export type CourseStatus = "PUBLISHED" | "DRAFT";

export type Course = {
  id: number;
  title: string;
  status: CourseStatus;
  lessons: number;
  drafts: number;
  students: number;
};