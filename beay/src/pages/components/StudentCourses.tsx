// src/pages/student/components/StudentCourses.tsx

import type { StudentCourse } from "../student/student.types";


type Props = {
  courses: StudentCourse[];
  onFindCourse: () => void;
};

export function StudentCourses(props: Props) {
  return (
    <div className="rounded-[18px] border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(2,6,23,0.06)] p-6 lg:col-span-2">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-extrabold text-slate-500">Khoá học</div>
          <div className="text-lg font-extrabold">Đang tham gia</div>
          <div className="mt-1 text-sm text-slate-600">
            Enrollment ACTIVE mới xem nội dung (đúng rule backend).
          </div>
        </div>
        <button className="btn" onClick={props.onFindCourse}>
          <i className="fa-solid fa-magnifying-glass mr-1" />
          Tìm khoá
        </button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {props.courses.map((c) => (
          <div key={c.title} className="rounded-[18px] border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(2,6,23,0.06)] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-extrabold">{c.title}</div>
                <div className="mt-1 text-sm text-slate-600">
                  {c.teacher} • {c.lessons}
                </div>
              </div>
              <span className="chip">
                {c.active ? (
                  <>
                    <i className="fa-solid fa-circle text-emerald-500 mr-1" />
                    ACTIVE
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-lock text-amber-600 mr-1" />
                    LOCK
                  </>
                )}
              </span>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Tiến độ</span>
                <b>{c.progress}%</b>
              </div>
              <div className="mt-2 h-[10px] rounded-full bg-indigo-50 overflow-hidden border border-slate-200/70">
                <div className="h-full bg-gradient-to-br from-indigo-600 to-violet-600" style={{ width: `${c.progress}%` }} />
              </div>
              <div className="mt-2 text-sm text-slate-600">
                Tiếp theo: <b>{c.next}</b>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                className="btn btn-primary flex-1"
                disabled={!c.active}
                style={!c.active ? { opacity: 0.55, cursor: "not-allowed" } : undefined}
              >
                {c.active ? "Vào học" : "Chờ kích hoạt"}
              </button>
              <button className="btn">Chi tiết</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}