// src/pages/instructor/components/CoursesGrid.tsx
import type { Course } from "../instructor.types";
import { CourseCard } from "./CourseCard";

type Props = {
  courses: Course[];
  onAddLesson: (courseId: number) => void;
  onManageCourse: (courseId: number) => void;
};

export function CoursesGrid(props: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {props.courses.map((c) => (
        <CourseCard
          key={c.id}
          course={c}
          onAddLesson={() => props.onAddLesson(c.id)}
          onManage={() => props.onManageCourse(c.id)}
        />
      ))}
      {!props.courses.length && (
        <div className="text-sm text-slate-600 p-3">Không có khoá học phù hợp.</div>
      )}
    </div>
  );
}