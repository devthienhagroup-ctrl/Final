// src/pages/student/components/SupportPanel.tsx
type Props = {
  onFaq: () => void;
  onTicket: () => void;
  onChat: () => void;
};

export function SupportPanel(props: Props) {
  return (
    <div className="rounded-[18px] border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(2,6,23,0.06)] p-6">
      <div className="text-xs font-extrabold text-slate-500">Hỗ trợ</div>
      <div className="text-lg font-extrabold">Cần trợ giúp?</div>
      <div className="mt-2 text-sm text-slate-600">FAQ • Ticket • Chat CSKH.</div>

      <div className="mt-4 space-y-2">
        <button className="btn w-full text-left" onClick={props.onFaq}>
          <i className="fa-solid fa-circle-question mr-2 text-indigo-600" />
          Hướng dẫn học
        </button>
        <button className="btn w-full text-left" onClick={props.onTicket}>
          <i className="fa-solid fa-ticket mr-2 text-amber-600" />
          Tạo yêu cầu hỗ trợ
        </button>
        <button className="btn w-full text-left" onClick={props.onChat}>
          <i className="fa-solid fa-comments mr-2 text-emerald-600" />
          Chat CSKH
        </button>
      </div>

      <div className="mt-4 p-4 rounded-2xl bg-slate-50 ring-1 ring-slate-200 text-sm text-slate-600">
        Khi tách React: map sang API Progress/Enrollments + Support module.
      </div>
    </div>
  );
}