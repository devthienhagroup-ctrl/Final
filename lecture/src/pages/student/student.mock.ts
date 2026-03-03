import type { StudentCourse, StudyPlanItem } from "./student.types";

export const MOCK_STUDENT_COURSES: StudentCourse[] = [
  {
    id: 1,
    courseId: 1,
    status: "ACTIVE",
    title: "Flutter LMS App",
    teacher: "Giảng viên A",
    price: 1990000,
    lessons: 24,
    progress: 78,
    completedLessons: 19,
    nextLessonTitle: "Bài 08 • GetX",
    active: true,
  },
  {
    id: 2,
    courseId: 2,
    status: "ACTIVE",
    title: "NestJS + Prisma (LMS API)",
    teacher: "Giảng viên B",
    price: 1590000,
    lessons: 18,
    progress: 52,
    completedLessons: 9,
    nextLessonTitle: "Bài 05 • Guards",
    active: true,
  },
  {
    id: 3,
    courseId: 3,
    status: "PENDING",
    title: "Marketing bán khoá",
    teacher: "Giảng viên C",
    price: 990000,
    lessons: 12,
    progress: 0,
    completedLessons: 0,
    nextLessonTitle: "Bài 01 • Funnel",
    active: false,
  },
];

export const DEFAULT_PLAN: StudyPlanItem[] = [
  { id: "mon", day: "Thứ 2", task: "Flutter • Bài 08", time: "14 phút", done: false },
  { id: "wed", day: "Thứ 4", task: "NestJS • Bài 05", time: "18 phút", done: false },
  { id: "fri", day: "Thứ 6", task: "Flutter • Quiz", time: "10 phút", done: false },
];
