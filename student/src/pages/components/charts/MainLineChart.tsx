import { useEffect, useRef } from "react";
import { Chart, type ChartConfiguration } from "chart.js/auto";

export type MainChartMode = "revenue" | "orders";

type MainLineChartProps = {
  mode: MainChartMode;
  labels: string[];
  revenueData: number[];
  orderData: number[];
};

export function MainLineChart({ mode, labels, revenueData, orderData }: MainLineChartProps) {
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
                  return num >= 1_000_000 ? `${(num / 1_000_000).toFixed(1)}M` : String(num);
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
  }, [labels, mode, orderData, revenueData]);

  return <canvas ref={canvasRef} height={120} />;
}
