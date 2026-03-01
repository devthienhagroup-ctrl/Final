// src/pages/instructor/components/CourseCard.tsx
import type { Course } from "../instructor.types";

type Props = {
  course: Course;
  onAddLesson: () => void;
  onManage: () => void;
};

export function CourseCard({ course: c, onAddLesson, onManage }: Props) {
  const isPublished = c.status === "PUBLISHED";
  return (
    <div className="rounded-[18px] border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(2,6,23,0.06)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-extrabold">{c.title}</div>
          <div className="mt-1 text-sm text-slate-600">
            {c.lessons} bài • {c.students} học viên
          </div>
        </div>
        <span className="rounded-full border border-slate-200/70 bg-white px-3 py-1 text-xs font-extrabold">
          {isPublished ? (
            <>
              <i className="fa-solid fa-circle text-emerald-500 mr-1" />
              ĐANG BÁN
            </>
          ) : (
            <>
              <i className="fa-solid fa-pen text-amber-600 mr-1" />
              DRAFT
            </>
          )}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
        <div className="p-3 rounded-2xl bg-slate-50 ring-1 ring-slate-200">
          <div className="text-xs font-extrabold text-slate-500">Bài</div>
          <div className="font-extrabold">{c.lessons}</div>
        </div>
        <div className="p-3 rounded-2xl bg-slate-50 ring-1 ring-slate-200">
          <div className="text-xs font-extrabold text-slate-500">Draft</div>
          <div className="font-extrabold">{c.drafts}</div>
        </div>
        <div className="p-3 rounded-2xl bg-slate-50 ring-1 ring-slate-200">
          <div className="text-xs font-extrabold text-slate-500">Students</div>
          <div className="font-extrabold">{c.students}</div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button className="btn btn-primary flex-1" onClick={onAddLesson}>
          <i className="fa-solid fa-plus mr-1" />
          Thêm bài học
        </button>
        <button className="btn" onClick={onManage}>
          <i className="fa-solid fa-gear mr-1" />
          Quản lý
        </button>
      </div>
    </div>
  );
}