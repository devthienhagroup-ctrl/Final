import { useEffect, useRef } from "react";
import { Chart, type ChartConfiguration } from "chart.js/auto";

export function BarChart() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    chartRef.current?.destroy();

    const cfg: ChartConfiguration<"bar"> = {
      type: "bar",
      data: {
        labels: ["W1", "W2", "W3", "W4", "W5", "W6"],
        datasets: [{ label: "Drop-off (%)", data: [12, 14, 11, 16, 13, 15], borderWidth: 1 }],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          y: {
            ticks: {
              callback: (value: string | number) => `${value}%`,
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
  }, []);

  return <canvas ref={ref} height={170} />;
}