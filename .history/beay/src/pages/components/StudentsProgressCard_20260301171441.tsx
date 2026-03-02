
export type StudentProgress = {
  name: string;
  course: string;
  progress: number;
};

export function StudentsProgressCard(props: {
  items: StudentProgress[];
  onOpenPortal: () => void;
  onImport: () => void;
  onMessage: () => void;
}) {
  return (
    <div className="card p-6" id="students">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-slate-500">Học viên</div>
          <div className="text-lg font-extrabold">Tiến độ học tập</div>
          <div className="mt-1 text-sm text-slate-600">Top 6 đang học.</div>
        </div>
        <button className="btn" onClick={props.onOpenPortal}>Xem portal</button>
      </div>

      <div className="mt-5 space-y-4">
        {props.items.map((s) => (
          <div key={s.name + s.course}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-extrabold">{s.name}</div>
                <div className="text-xs text-slate-500">{s.course}</div>
              </div>
              <div className="chip">{s.progress}%</div>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-100 ring-1 ring-slate-200 overflow-hidden">
              <div className="h-full bg-indigo-600" style={{ width: `${s.progress}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 p-4 rounded-2xl bg-slate-50 ring-1 ring-slate-200">
        <div className="text-xs font-extrabold text-slate-500">Hành động nhanh</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button className="btn" onClick={props.onImport}><i className="fa-solid fa-upload mr-1" />Import</button>
          <button className="btn" onClick={props.onMessage}><i className="fa-solid fa-paper-plane mr-1" />Nhắn</button>
        </div>
      </div>
    </div>
  );
}