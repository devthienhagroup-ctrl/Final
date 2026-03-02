import { useEffect, useRef } from "react";
import { Chart, type ChartConfiguration } from "chart.js/auto";

export function DonutChart() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    chartRef.current?.destroy();

    const cfg: ChartConfiguration<"doughnut"> = {
      type: "doughnut",
      data: {
        labels: ["Facebook", "Google", "Tiktok", "Referral", "Email"],
        datasets: [{ data: [28, 34, 16, 12, 10], borderWidth: 1 }],
      },
      options: { plugins: { legend: { position: "bottom" } }, responsive: true },
    };

    chartRef.current = new Chart(el, cfg);

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, []);

  return <canvas ref={ref} height={170} />;
}