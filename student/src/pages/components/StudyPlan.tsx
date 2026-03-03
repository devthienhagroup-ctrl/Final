// src/pages/student/components/StudyPlan.tsx

import type { StudyPlanItem } from "../student/student.types";


type Props = {
  plan: StudyPlanItem[];
  streakDays: number;
  onToggle: (id: string, done: boolean) => void;
  onRemind: () => void;
};

export function StudyPlan(props: Props) {
  return (
    <div className="rounded-[18px] border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(2,6,23,0.06)] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-extrabold text-slate-500">Lịch học</div>
          <div className="text-lg font-extrabold">Tuần này</div>
          <div className="mt-1 text-sm text-slate-600">Bổ sung: tick hoàn thành task (local).</div>
        </div>
        <span className="chip">
          <i className="fa-solid fa-fire text-rose-500 mr-1" />
          Streak
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {props.plan.map((p) => (
          <label
            key={p.id}
            className="p-3 rounded-2xl bg-slate-50 ring-1 ring-slate-200 flex items-center justify-between cursor-pointer"
          >
            <div>
              <div className="font-extrabold flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={p.done}
                  onChange={(e) => props.onToggle(p.id, e.target.checked)}
                />
                {p.day}
              </div>
              <div className="text-sm text-slate-600 ml-6">{p.task}</div>
            </div>
            <span className="chip">
              <i className="fa-solid fa-stopwatch text-amber-600 mr-1" />
              {p.time}
            </span>
          </label>
        ))}
      </div>

      <button className="mt-4 w-full btn btn-primary" onClick={props.onRemind}>
        <i className="fa-solid fa-bell mr-1" />
        Bật nhắc học
      </button>

      <div className="mt-3 text-xs text-slate-500">
        Streak hiện tại: <b>{props.streakDays} ngày</b> (base 5 + số task done).
      </div>
    </div>
  );
}