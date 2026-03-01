import { useEffect, useRef } from "react";
import { Chart, type ChartConfiguration } from "chart.js/auto";

type BarChartProps = {
  labels: string[];
  values: number[];
};

export function BarChart({ labels, values }: BarChartProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    chartRef.current?.destroy();

    const cfg: ChartConfiguration<"bar"> = {
      type: "bar",
      data: {
        labels,
        datasets: [{ label: "Doanh thu", data: values, borderWidth: 1 }],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          y: {
            ticks: {
              callback: (value: string | number) => {
                const num = typeof value === "string" ? Number(value) : value;
                return num >= 1_000_000 ? `${(num / 1_000_000).toFixed(1)}M` : String(num);
              },
            },
          },
        },
      },
    };

    chartRef.current = new Chart(el, cfg);

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [labels, values]);

  return <canvas ref={ref} height={170} />;
}
