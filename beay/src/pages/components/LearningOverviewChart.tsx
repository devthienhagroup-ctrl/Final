import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

type Props = {
  loading?: boolean;
  activeCourses: number;
  pendingCourses: number;
  canceledCourses: number;
  completedLessons: number;
  remainingLessons: number;
};

export function LearningOverviewChart(props: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const chart = new Chart(canvasRef.current, {
      type: "doughnut",
      data: {
        labels: ["Đã học", "Còn lại", "Chờ kích hoạt", "Đã huỷ"],
        datasets: [
          {
            data: [props.completedLessons, props.remainingLessons, props.pendingCourses, props.canceledCourses],
            backgroundColor: ["#4f46e5", "#a5b4fc", "#f59e0b", "#ef4444"],
            borderWidth: 0,
            hoverOffset: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              boxWidth: 12,
              boxHeight: 12,
              usePointStyle: true,
              pointStyle: "circle",
            },
          },
        },
        cutout: "68%",
      },
    });

    return () => chart.destroy();
  }, [props.completedLessons, props.remainingLessons, props.pendingCourses, props.canceledCourses]);

  return (
    <div className="rounded-[18px] border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(2,6,23,0.06)] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-extrabold text-slate-500">Thống kê học tập</div>
          <div className="text-lg font-extrabold">Tổng quan</div>
          <div className="mt-1 text-sm text-slate-600">Dữ liệu tổng hợp trực tiếp từ API học viên.</div>
        </div>
        <span className="chip">
          <i className="fa-solid fa-chart-pie text-indigo-600 mr-1" />
          {props.activeCourses} đang học
        </span>
      </div>

      {props.loading ? (
        <div className="mt-5 text-sm text-slate-500">Đang tải thống kê...</div>
      ) : (
        <>
          <div className="mt-5 h-[280px]">
            <canvas ref={canvasRef} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
              <div className="text-slate-500">Khoá đang học</div>
              <div className="text-xl font-extrabold text-slate-900">{props.activeCourses}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
              <div className="text-slate-500">Bài hoàn thành</div>
              <div className="text-xl font-extrabold text-slate-900">{props.completedLessons}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

