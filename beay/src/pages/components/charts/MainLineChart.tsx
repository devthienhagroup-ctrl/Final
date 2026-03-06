import { useEffect, useRef } from "react";
import { Chart, type ChartConfiguration } from "chart.js/auto";

export type MainChartMode = "revenue" | "orders";

type MainLineChartProps = {
  mode: MainChartMode;
  labels: string[];
  courseRevenueData: number[];
  productRevenueData: number[];
  packageRevenueData: number[];
  orderData: number[];
};

export function MainLineChart({
  mode,
  labels,
  courseRevenueData,
  productRevenueData,
  packageRevenueData,
  orderData,
}: MainLineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    chartRef.current?.destroy();
    chartRef.current = null;

    const datasets =
      mode === "revenue"
        ? [
            {
              label: "Khóa học",
              data: courseRevenueData,
              borderColor: "#2563eb",
              backgroundColor: "rgba(37, 99, 235, 0.12)",
              borderWidth: 2,
              tension: 0.35,
              pointRadius: 2,
              fill: false,
            },
            {
              label: "Sản phẩm thành công",
              data: productRevenueData,
              borderColor: "#16a34a",
              backgroundColor: "rgba(22, 163, 74, 0.12)",
              borderWidth: 2,
              tension: 0.35,
              pointRadius: 2,
              fill: false,
            },
            {
              label: "Gói dịch vụ",
              data: packageRevenueData,
              borderColor: "#f59e0b",
              backgroundColor: "rgba(245, 158, 11, 0.12)",
              borderWidth: 2,
              tension: 0.35,
              pointRadius: 2,
              fill: false,
            },
          ]
        : [
            {
              label: "Đơn hàng",
              data: orderData,
              borderWidth: 2,
              tension: 0.35,
              pointRadius: 2,
              fill: true,
            },
          ];

    const cfg: ChartConfiguration<"line"> = {
      type: "line",
      data: {
        labels,
        datasets,
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: mode === "revenue",
            position: "bottom",
          },
        },
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
  }, [courseRevenueData, labels, mode, orderData, packageRevenueData, productRevenueData]);

  return <canvas ref={canvasRef} height={120} />;
}
