type Props = {
  completedCourses: number;
  bestCourseName: string;
  inProgressCourseName: string;
  inProgressPercent: number;
  onDownloadAll: () => void;
  onPdf: () => void;
  onShare: () => void;
  onReq: () => void;
};

export function CertificatesPanel(props: Props) {
  return (
    <div className="rounded-[18px] border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(2,6,23,0.06)] p-6 lg:col-span-2">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-extrabold text-slate-500">Chứng chỉ</div>
          <div className="text-lg font-extrabold">Đã đạt: {props.completedCourses}</div>
          <div className="mt-1 text-sm text-slate-600">Kích hoạt khi hoàn thành 100% khoá học.</div>
        </div>
        <button className="btn" onClick={props.onDownloadAll}><i className="fa-solid fa-download mr-1" />Tải tất cả</button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-[18px] border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(2,6,23,0.06)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-extrabold text-slate-500">Khoá xuất sắc</div>
              <div className="text-lg font-extrabold mt-1">{props.bestCourseName}</div>
              <div className="text-sm text-slate-600 mt-1">Đã sẵn sàng xuất chứng chỉ.</div>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-amber-100 flex items-center justify-center"><i className="fa-solid fa-award text-amber-700" /></div>
          </div>

          <div className="mt-3 flex gap-2">
            <button className="btn btn-primary flex-1" onClick={props.onPdf}>Tải PDF</button>
            <button className="btn" onClick={props.onShare}>Chia sẻ</button>
          </div>
        </div>

        <div className="rounded-[18px] border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(2,6,23,0.06)] p-4">
          <div className="text-xs font-extrabold text-slate-500">Đang tiến hành</div>
          <div className="text-lg font-extrabold mt-1">{props.inProgressCourseName}</div>
          <div className="mt-2 h-[10px] rounded-full bg-indigo-50 overflow-hidden border border-slate-200/70"><div className="h-full bg-gradient-to-br from-indigo-600 to-violet-600" style={{ width: `${props.inProgressPercent}%` }} /></div>
          <div className="mt-3 text-sm text-slate-600">Đạt 100% để mở chứng chỉ.</div>
          <button className="mt-3 w-full btn" onClick={props.onReq}>Xem yêu cầu</button>
        </div>
      </div>
    </div>
  );
}
