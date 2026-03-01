type Props = {
  name: string;
  streakDays: number;
  activeCourses: number;
  totalProgress: number;
  certificates: number;
  nextCourseTitle: string;
  nextLessonTitle: string;
  nextPercent: number;
  onEnterLesson: () => void;
  onBookmark: () => void;
};

export function StudentHero(props: Props) {
  return (
    <section className="rounded-[18px] border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(2,6,23,0.06)] p-6">
      <div className="flex items-start justify-between gap-6 flex-col lg:flex-row">
        <div className="flex-1">
          <div className="text-xs font-extrabold text-slate-500">Chào bạn</div>
          <div className="text-2xl md:text-3xl font-extrabold">{props.name}</div>
          <div className="mt-2 text-slate-600">Mục tiêu tuần này: <b>hoàn thành 3 bài học</b> • Chuỗi học: <b>{props.streakDays} ngày</b>.</div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="p-4 rounded-2xl bg-slate-50 ring-1 ring-slate-200">
              <div className="text-xs font-extrabold text-slate-500">Khoá đang học</div>
              <div className="mt-1 text-2xl font-extrabold">{props.activeCourses}</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 ring-1 ring-slate-200">
              <div className="text-xs font-extrabold text-slate-500">Tiến độ tổng</div>
              <div className="mt-1 text-2xl font-extrabold">{props.totalProgress}%</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 ring-1 ring-slate-200">
              <div className="text-xs font-extrabold text-slate-500">Chứng chỉ</div>
              <div className="mt-1 text-2xl font-extrabold">{props.certificates}</div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[420px] rounded-[18px] border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(2,6,23,0.06)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-extrabold text-slate-500">Bài học tiếp theo</div>
              <div className="text-lg font-extrabold mt-1">{props.nextCourseTitle}</div>
              <div className="text-sm text-slate-600 mt-1">{props.nextLessonTitle}</div>
            </div>
            <span className="chip"><i className="fa-solid fa-stopwatch text-amber-600 mr-1" /> In progress</span>
          </div>

          <div className="mt-3 h-[10px] rounded-full bg-indigo-50 overflow-hidden border border-slate-200/70">
            <div className="h-full bg-gradient-to-br from-indigo-600 to-violet-600" style={{ width: `${props.nextPercent}%` }} />
          </div>

          <div className="mt-3 flex gap-2">
            <button className="btn btn-primary flex-1" onClick={props.onEnterLesson}><i className="fa-solid fa-play mr-1" />Vào học</button>
            <button className="btn" onClick={props.onBookmark}><i className="fa-regular fa-bookmark mr-1" />Lưu</button>
          </div>
        </div>
      </div>
    </section>
  );
}
