import { useEffect, useRef } from "react";
import { Chart, type ChartConfiguration } from "chart.js/auto";

type DonutChartProps = {
  labels: string[];
  values: number[];
};

export function DonutChart({ labels, values }: DonutChartProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    chartRef.current?.destroy();

    const cfg: ChartConfiguration<"doughnut"> = {
      type: "doughnut",
      data: {
        labels,
        datasets: [{ data: values, borderWidth: 1 }],
      },
      options: { plugins: { legend: { position: "bottom" } }, responsive: true },
    };

    chartRef.current = new Chart(el, cfg);

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [labels, values]);

  return <canvas ref={ref} height={170} />;
}
