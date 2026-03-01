import { useEffect, useRef } from "react";
import { Chart, type ChartConfiguration } from "chart.js/auto";

export type MainChartMode = "revenue" | "orders";

const labels = Array.from({ length: 12 }).map((_, i) => `W${i + 1}`);
const revenueData = [14, 18, 16, 22, 20, 28, 26, 30, 34, 32, 38, 42].map((v) => v * 1_000_000);
const orderData = [48, 55, 52, 61, 58, 72, 70, 81, 86, 84, 95, 104];

export function MainLineChart({ mode }: { mode: MainChartMode }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    chartRef.current?.destroy();
    chartRef.current = null;

    const cfg: ChartConfiguration<"line"> = {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: mode === "revenue" ? "Doanh thu" : "Đơn hàng",
            data: mode === "revenue" ? revenueData : orderData,
            borderWidth: 2,
            tension: 0.35,
            pointRadius: 2,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            ticks: {
              callback: (value: string | number) => {
                const num = typeof value === "string" ? Number(value) : value;

                if (mode === "revenue") {
                  return num >= 1_000_000 ? `${num / 1_000_000}M` : String(num);
                }
                return String(num);
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
  }, [mode]);

  return <canvas ref={canvasRef} height={120} />;
}