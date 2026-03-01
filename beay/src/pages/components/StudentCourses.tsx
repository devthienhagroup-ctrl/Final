import type { StudentCourse } from "../student/student.types";

type Props = {
  courses: StudentCourse[];
  loading?: boolean;
  onFindCourse: () => void;
  onContinue: (course: StudentCourse) => void;
  onDetail: (course: StudentCourse) => void;
  onCancel: (course: StudentCourse) => void;
};

export function StudentCourses(props: Props) {
  return (
    <div className="rounded-[18px] border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(2,6,23,0.06)] p-6 lg:col-span-2">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-extrabold text-slate-500">Khoá học</div>
          <div className="text-lg font-extrabold">Đang tham gia</div>
          <div className="mt-1 text-sm text-slate-600">Dữ liệu thật từ API enrollments/progress.</div>
        </div>
        <button className="btn" onClick={props.onFindCourse}>
          <i className="fa-solid fa-magnifying-glass mr-1" />
          Tìm khoá
        </button>
      </div>

      {props.loading && <div className="mt-4 text-sm text-slate-500">Đang tải khoá học...</div>}

      {!props.loading && props.courses.length === 0 && (
        <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">Bạn chưa ghi danh khoá học nào.</div>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {props.courses.map((c) => (
          <div key={c.id} className="rounded-[18px] border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(2,6,23,0.06)] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-extrabold">{c.title}</div>
                <div className="mt-1 text-sm text-slate-600">
                  {c.teacher} • {c.lessons} bài
                </div>
              </div>
              <span className="chip">
                {c.active ? (
                  <>
                    <i className="fa-solid fa-circle text-emerald-500 mr-1" />
                    {c.status}
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-lock text-amber-600 mr-1" />
                    {c.status}
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
                Hoàn thành: <b>{c.completedLessons}/{c.lessons}</b>
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Tiếp theo: <b>{c.nextLessonTitle}</b>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button className="btn btn-primary flex-1" disabled={!c.active} style={!c.active ? { opacity: 0.55, cursor: "not-allowed" } : undefined} onClick={() => props.onContinue(c)}>
                {c.active ? "Tiếp tục" : "Chờ kích hoạt"}
              </button>
              <button className="btn" onClick={() => props.onDetail(c)}>Chi tiết</button>
              <button className="btn" disabled={!c.active} onClick={() => props.onCancel(c)}>Huỷ</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
