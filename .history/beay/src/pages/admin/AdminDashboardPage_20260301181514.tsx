import React, { useEffect, useMemo } from "react";
import { useLocalStorage } from "../../ui/useLocalStorage";
import { useToast } from "../../ui/toast";
import { OrdersMiniTable, type OrderMini } from "../components/OrdersMiniTable";
import { StudentsProgressCard, type StudentProgress } from "../components/StudentsProgressCard";
import { ChecklistCard, type ChecklistItem } from "../components/ChecklistCard";
import { KpiCard } from "../components/KpiCard";
import { AdminShell } from "../components/AdminShell";
import { MainLineChart, type MainChartMode } from "../components/charts/MainLineChart";
import { TopCoursesCard, type TopCourse } from "../components/TopCoursesCard";
import { DonutChart } from "../components/charts/DonutChart";
import { BarChart } from "../components/charts/BarChart";
import { getDashboardStats, type DashboardStatsResponse } from "./dashboard.api";

const LS = {
  theme: "aya_theme",
  range: "aya_admin_range",
  checklist: "aya_admin_checklist",
} as const;

function fmtVND(n: number) {
  return "₫ " + new Intl.NumberFormat("vi-VN").format(n);
}

function trendLabel(value: number) {
  if (value > 0) return `+${value}% so với kỳ trước`;
  if (value < 0) return `${value}% so với kỳ trước`;
  return "Không đổi so với kỳ trước";
}

export function AdminDashboardPage() {
  const { toast } = useToast();

  const [theme, setTheme] = useLocalStorage<"light" | "dark">(LS.theme, "light");
  const [rangeDays, setRangeDays] = useLocalStorage<number>(LS.range, 30);
  const [checks, setChecks] = useLocalStorage<Record<string, boolean>>(LS.checklist, {});

  const [chartMode, setChartMode] = React.useState<MainChartMode>("revenue");
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [stats, setStats] = React.useState<DashboardStatsResponse | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const res = await getDashboardStats(rangeDays);
        if (!mounted) return;
        setStats(res);
      } catch {
        toast("Dashboard", "Không tải được dữ liệu thống kê, đang hiển thị dữ liệu rỗng.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [rangeDays, toast]);

  const checklistItems: ChecklistItem[] = useMemo(
    () => [
      { key: "cat", label: "Tạo danh mục khóa học" },
      { key: "price", label: "Cấu hình giá & voucher" },
      { key: "email", label: "Thiết lập email thông báo" },
      { key: "pay", label: "Kết nối thanh toán" },
      { key: "import", label: "Import học viên" },
      { key: "cert", label: "Bật chứng chỉ hoàn thành" },
    ],
    []
  );

  const dataTopCourses: TopCourse[] = useMemo(() => {
    const tones: TopCourse["tone"][] = ["cyan", "indigo", "amber", "emerald"];
    const icons: TopCourse["icon"][] = ["mobile-screen", "layer-group", "cubes", "bullhorn"];
    return (stats?.topCourses ?? []).map((c, i) => ({ ...c, tone: tones[i % tones.length], icon: icons[i % icons.length] }));
  }, [stats?.topCourses]);

  const dataOrders: OrderMini[] = useMemo(
    () =>
      (stats?.recentOrders ?? []).map((o) => ({
        ...o,
        status: o.status === "PAID" ? "PAID" : o.status === "PENDING" ? "PENDING" : "REFUND",
      })),
    [stats?.recentOrders]
  );

  const dataStudents: StudentProgress[] = useMemo(() => stats?.studentProgress ?? [], [stats?.studentProgress]);

  const filteredTopCourses = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return dataTopCourses;
    return dataTopCourses.filter((c) => c.name.toLowerCase().includes(q));
  }, [dataTopCourses, search]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return dataOrders;
    return dataOrders.filter((o) => (o.code + " " + o.student + " " + o.course).toLowerCase().includes(q));
  }, [dataOrders, search]);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return dataStudents;
    return dataStudents.filter((s) => (s.name + " " + s.course).toLowerCase().includes(q));
  }, [dataStudents, search]);

  const paymentChart = useMemo(() => {
    const labels = (stats?.revenueByPayment ?? []).map((i) => (i.method === "SEPAY" ? "Chuyển khoản" : "COD"));
    const values = (stats?.revenueByPayment ?? []).map((i) => i.revenue);
    return { labels, values };
  }, [stats?.revenueByPayment]);

  const categoryChart = useMemo(() => {
    const labels = (stats?.revenueByProductCategory ?? []).map((i) => i.category);
    const values = (stats?.revenueByProductCategory ?? []).map((i) => i.revenue);
    return { labels, values };
  }, [stats?.revenueByProductCategory]);

  const kpis = stats?.kpis ?? {
    revenue: 0,
    orders: 0,
    students: 0,
    completionRate: 0,
    revenueChangePct: 0,
    ordersChangePct: 0,
  };

  return (
    <AdminShell
      theme={theme}
      onToggleTheme={() => {
        setTheme(theme === "dark" ? "light" : "dark");
        toast("Đổi theme", `Đã chuyển sang ${theme === "dark" ? "Light" : "Dark"} mode.`);
      }}
      rangeDays={rangeDays}
      onRangeChange={(v) => {
        setRangeDays(v);
        toast("Đã đổi khoảng thời gian", `Đang xem: ${v} ngày`);
      }}
      search={search}
      onSearchChange={setSearch}
      onHotkey={(k) => {
        if (k === "revenue") setChartMode("revenue");
        if (k === "orders") setChartMode("orders");
      }}
      onConnectPay={() => toast("Thanh toán", "Đi tới phần cài đặt thanh toán.")}
      onCreateCourse={() => toast("Tạo khóa học", "Điều hướng sang trang tạo khóa học.")}
      onExportMiniOrders={() => {
        const header = ["code", "student", "course", "total", "status", "date"];
        const csv =
          [header.join(",")]
            .concat(
              dataOrders.map((o) =>
                [o.code, o.student, o.course, o.total, o.status, o.date]
                  .map((x) => String(x).replaceAll('"', '""'))
                  .map((x) => `"${x}"`)
                  .join(",")
              )
            )
            .join("\n") + "\n";

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "ayanavita-orders-mini.csv";
        a.click();
        URL.revokeObjectURL(a.href);

        toast("Xuất CSV", "Đã tải file đơn hàng (mini).");
      }}
    >
      {loading && <div className="mb-4 text-sm text-slate-500">Đang tải dữ liệu dashboard...</div>}
      <section className="grid gap-4 md:grid-cols-4">
        <KpiCard title="Doanh thu" value={fmtVND(kpis.revenue)} hint={trendLabel(kpis.revenueChangePct)} icon="sack-dollar" tone="emerald" />
        <KpiCard title="Đơn hàng" value={new Intl.NumberFormat("vi-VN").format(kpis.orders)} hint={trendLabel(kpis.ordersChangePct)} icon="bag-shopping" tone="amber" />
        <KpiCard title="Học viên mới" value={new Intl.NumberFormat("vi-VN").format(kpis.students)} hint="Theo số user đăng ký trong kỳ" icon="users" tone="cyan" />
        <KpiCard title="Tỷ lệ hoàn thành" value={`${kpis.completionRate}%`} hint="Tỷ lệ hoàn thành bài học" icon="graduation-cap" tone="indigo" />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-slate-500">Báo cáo</div>
              <div className="text-lg font-extrabold">Doanh thu & Đơn hàng</div>
              <div className="mt-1 text-sm text-slate-600">Lọc theo 7/30/90 ngày, chuyển mode nhanh.</div>
            </div>
            <div className="flex gap-2">
              <button className={`btn ${chartMode === "revenue" ? "btn-primary" : ""}`} onClick={() => setChartMode("revenue")}>Doanh thu</button>
              <button className={`btn ${chartMode === "orders" ? "btn-primary" : ""}`} onClick={() => setChartMode("orders")}>Đơn hàng</button>
            </div>
          </div>

          <div className="mt-5">
            <MainLineChart
              mode={chartMode}
              labels={stats?.lineChart.labels ?? []}
              revenueData={stats?.lineChart.revenue ?? []}
              orderData={stats?.lineChart.orders ?? []}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <div>
              Mẹo: <span className="kbd">r</span> doanh thu • <span className="kbd">o</span> đơn hàng
            </div>
            <div>Mode: {chartMode === "revenue" ? "Doanh thu" : "Đơn hàng"}</div>
          </div>
        </div>

        <TopCoursesCard
          items={filteredTopCourses}
          onManage={() => toast("Quản lý", "Điều hướng sang Instructor dashboard.")}
          onIdea={() => toast("Chiến dịch", "Tạo campaign upsell/bundle/voucher.")}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <OrdersMiniTable items={filteredOrders} onOpenOrders={() => toast("Orders", "Điều hướng sang Admin Orders.")} />
        <StudentsProgressCard
          items={filteredStudents}
          onOpenPortal={() => toast("Student Portal", "Điều hướng sang Student portal.")}
          onImport={() => toast("Import học viên", "CSV validate + tạo user/enrollment.")}
          onMessage={() => toast("Nhắn học viên", "Broadcast theo cohort/khóa học.")}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="card p-6">
          <div className="text-xs font-semibold text-slate-500">Phân tích</div>
          <div className="text-lg font-extrabold">Doanh thu theo phương thức thanh toán</div>
          <div className="mt-1 text-sm text-slate-600">Tỉ trọng doanh thu theo COD / chuyển khoản.</div>
          <div className="mt-5">
            <DonutChart labels={paymentChart.labels} values={paymentChart.values} />
          </div>
        </div>

        <div className="card p-6">
          <div className="text-xs font-semibold text-slate-500">Chất lượng</div>
          <div className="text-lg font-extrabold">Doanh thu theo danh mục sản phẩm</div>
          <div className="mt-1 text-sm text-slate-600">Top danh mục có doanh thu cao nhất.</div>
          <div className="mt-5">
            <BarChart labels={categoryChart.labels} values={categoryChart.values} />
          </div>
        </div>

        <ChecklistCard
          items={checklistItems}
          value={checks}
          onChange={setChecks}
          onSave={() => toast("Đã lưu cấu hình", "Checklist đã được lưu trong trình duyệt.")}
        />
      </section>

      <footer className="py-6 text-center text-sm text-slate-500">© 2025 AYANAVITA Admin Dashboard • Integrated with NestJS APIs.</footer>
    </AdminShell>
  );
}
