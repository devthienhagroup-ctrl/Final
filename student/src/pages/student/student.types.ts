export type EnrollmentStatus = "ACTIVE" | "PENDING" | "CANCELED" | "CANCELLED";

export type StudentCourse = {
  id: number;
  courseId: number;
  status: EnrollmentStatus;
  title: string;
  teacher: string;
  price: number;
  lessons: number;
  progress: number; // 0-100
  completedLessons: number;
  nextLessonTitle: string;
  nextLessonId?: number;
  active: boolean;
  canAccess: boolean;
  blockedReason?: string | null;
  blockedMessage?: string | null;
  upgradePlan?: {
    id: number;
    code: string;
    name: string;
    price: number;
  } | null;
};

export type StudyPlanItem = {
  id: string;
  day: string;
  task: string;
  time: string;
  done: boolean;
};

