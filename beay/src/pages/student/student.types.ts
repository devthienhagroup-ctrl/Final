// src/pages/student/student.types.ts
export type StudentCourse = {
  title: string;
  teacher: string;
  progress: number; // 0-100
  lessons: string; // "24 bài"
  next: string; // "Bài 08 • GetX"
  active: boolean; // Enrollment ACTIVE?
};

export type StudyPlanItem = {
  id: string;
  day: string;
  task: string;
  time: string;
  done: boolean;
};