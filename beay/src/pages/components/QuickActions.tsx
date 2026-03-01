// src/pages/instructor/components/QuickActions.tsx
type Props = {
  onPublish: () => void;
  onPreview: () => void;
  onCoupon: () => void;
  onSyllabus: () => void;
};

export function QuickActions(props: Props) {
  return (
    <div className="rounded-[18px] border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(2,6,23,0.06)] p-6">
      <div className="text-xs font-extrabold text-slate-500">Tác vụ nhanh</div>
      <div className="text-lg font-extrabold">Xuất bản & QA</div>
      <div className="mt-2 text-sm text-slate-600">Bổ sung: checklist + preview + tạo coupon.</div>

      <div className="mt-4 space-y-3">
        <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 ring-1 ring-slate-200">
          <input type="checkbox" defaultChecked className="h-4 w-4" />
          <span className="text-sm font-extrabold">Mô tả + mục tiêu khoá</span>
        </label>
        <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 ring-1 ring-slate-200">
          <input type="checkbox" defaultChecked className="h-4 w-4" />
          <span className="text-sm font-extrabold">Giá + ưu đãi</span>
        </label>
        <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 ring-1 ring-slate-200">
          <input type="checkbox" className="h-4 w-4" />
          <span className="text-sm font-extrabold">Preview bài học</span>
        </label>
        <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 ring-1 ring-slate-200">
          <input type="checkbox" className="h-4 w-4" />
          <span className="text-sm font-extrabold">Bật chứng chỉ</span>
        </label>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button className="btn btn-primary" onClick={props.onPublish}>
          <i className="fa-solid fa-cloud-arrow-up mr-1" />
          Publish
        </button>
        <button className="btn btn-accent" onClick={props.onPreview}>
          <i className="fa-solid fa-eye mr-1" />
          Preview
        </button>
        <button className="btn" onClick={props.onCoupon}>
          <i className="fa-solid fa-ticket mr-1" />
          Coupon
        </button>
        <button className="btn" onClick={props.onSyllabus}>
          <i className="fa-solid fa-list-check mr-1" />
          Syllabus
        </button>
      </div>

      <div className="mt-4 p-4 rounded-2xl bg-slate-50 ring-1 ring-slate-200 text-sm text-slate-600">
        Khi tách React: quyền <b>lessons.write</b> / <b>lessons.publish</b> kiểm soát nút Publish.
      </div>
    </div>
  );
}