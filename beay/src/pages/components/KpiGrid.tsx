// src/pages/instructor/components/KpiGrid.tsx
type Props = {
  kpis: {
    managedCourses: number;
    publishedCourses: number;
    students: number;
    draftLessons: number;
    ratingAvg: number;
  };
};

function Card(props: { title: string; value: string; note: string; icon: string }) {
  return (
    <div className="rounded-[18px] border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(2,6,23,0.06)] p-5">
      <div className="text-xs font-extrabold text-slate-500">{props.title}</div>
      <div className="mt-2 text-3xl font-extrabold">{props.value}</div>
      <div className="mt-2 text-sm text-slate-600">
        <i className={props.icon} /> {props.note}
      </div>
    </div>
  );
}

export function KpiGrid({ kpis }: Props) {
  return (
    <section className="grid gap-4 md:grid-cols-4">
      <Card
        title="Khoá đang quản lý"
        value={String(kpis.managedCourses)}
        note={`${kpis.publishedCourses} đang bán`}
        icon="fa-solid fa-circle text-emerald-500 mr-1"
      />
      <Card
        title="Học viên"
        value={new Intl.NumberFormat("vi-VN").format(kpis.students)}
        note="+6.8% tháng"
        icon="fa-solid fa-arrow-trend-up text-emerald-600 mr-1"
      />
      <Card
        title="Bài học (Draft)"
        value={String(kpis.draftLessons)}
        note="Cần publish"
        icon="fa-solid fa-pen mr-1 text-amber-600"
      />
      <Card
        title="Đánh giá trung bình"
        value={String(kpis.ratingAvg)}
        note="Top instructor"
        icon="fa-solid fa-star text-amber-500 mr-1"
      />
    </section>
  );
}