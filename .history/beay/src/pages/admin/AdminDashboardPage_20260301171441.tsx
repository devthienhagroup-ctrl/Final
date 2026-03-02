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
import { BarChart } from "../components/charts/DonutChart";
import { DonutChart } from "../components/charts/BarChart";


const LS = {
  theme: "aya_theme",
  range: "aya_admin_range",
  checklist: "aya_admin_checklist",
} as const;

function fmtVND(n: number) {
  return "₫ " + new Intl.NumberFormat("vi-VN").format(n);
}

export function AdminDashboardPage() {
  const { toast } = useToast();

  const [theme, setTheme] = useLocalStorage<"light" | "dark">(LS.theme, "light");
  const [rangeDays, setRangeDays] = useLocalStorage<number>(LS.range, 30);
  const [checks, setChecks] = useLocalStorage<Record<string, boolean>>(LS.checklist, {});

  const [chartMode, setChartMode] = React.useState<MainChartMode>("revenue");
  const [search, setSearch] = React.useState("");

  useEffect(() => {
    toast("AYANAVITA Admin", "Đã chuyển Admin Dashboard sang React (step 1).");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dataTopCourses: TopCourse[] = useMemo(
    () => [
      { name: "Flutter LMS App", revenue: 98200000, orders: 312, trend: "+18%", icon: "mobile-screen", tone: "cyan" },
      { name: "NestJS + Prisma (LMS API)", revenue: 74400000, orders: 221, trend: "+11%", icon: "layer-group", tone: "indigo" },
      { name: "React UI Systems", revenue: 55800000, orders: 188, trend: "+7%", icon: "cubes", tone: "amber" },
      { name: "Marketing bán khoá", revenue: 42400000, orders: 140, trend: "+5%", icon: "bullhorn", tone: "emerald" },
    ],
    []
  );

  const dataOrders: OrderMini[] = useMemo(
    () => [
      { code: "#OD-12941", student: "Minh Anh", course: "Flutter LMS App", total: 799000, status: "PAID", date: "2025-12-18" },
      { code: "#OD-12940", student: "Tuấn Kiệt", course: "NestJS + Prisma", total: 599000, status: "PAID", date: "2025-12-18" },
      { code: "#OD-12939", student: "Hoài Phương", course: "React UI Systems", total: 399000, status: "PENDING", date: "2025-12-17" },
      { code: "#OD-12938", student: "Thanh Tùng", course: "Marketing bán khoá", total: 499000, status: "REFUND", date: "2025-12-16" },
      { code: "#OD-12937", student: "Ngọc Mai", course: "Flutter LMS App", total: 799000, status: "PAID", date: "2025-12-16" },
      { code: "#OD-12936", student: "Đức Huy", course: "React UI Systems", total: 399000, status: "PAID", date: "2025-12-15" },
    ],
    []
  );

  const dataStudents: StudentProgress[] = useMemo(
    () => [
      { name: "Minh Anh", course: "Flutter LMS App", progress: 78 },
      { name: "Tuấn Kiệt", course: "NestJS + Prisma", progress: 52 },
      { name: "Hoài Phương", course: "React UI Systems", progress: 31 },
      { name: "Ngọc Mai", course: "Flutter LMS App", progress: 65 },
      { name: "Đức Huy", course: "React UI Systems", progress: 44 },
      { name: "Thanh Tùng", course: "Marketing bán khoá", progress: 22 },
    ],
    []
  );

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

  const kpis = useMemo(() => {
    const v = Number(rangeDays);
    const revenue = v === 7 ? 68400000 : v === 30 ? 248400000 : 612900000;
    const ordersN = v === 7 ? 356 : v === 30 ? 1284 : 3120;
    const studentsN = v === 7 ? 820 : v === 30 ? 3420 : 8890;
    const completion = v === 7 ? 44 : v === 30 ? 46 : 49;
    return { revenue, ordersN, studentsN, completion };
  }, [rangeDays]);

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
      onConnectPay={() => toast("Thanh toán", "Prototype: sẽ map sang Payment Settings.")}
      onCreateCourse={() => toast("Tạo khóa học", "Prototype: điều hướng sang Instructor dashboard.")}
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
      {/* KPIs */}
      <section className="grid gap-4 md:grid-cols-4">
        <KpiCard title="Doanh thu" value={fmtVND(kpis.revenue)} hint="+12.4% so với kỳ trước" icon="sack-dollar" tone="emerald" />
        <KpiCard title="Đơn hàng" value={new Intl.NumberFormat("vi-VN").format(kpis.ordersN)} hint="+8.1% so với kỳ trước" icon="bag-shopping" tone="amber" />
        <KpiCard title="Học viên mới" value={new Intl.NumberFormat("vi-VN").format(kpis.studentsN)} hint="+21.0% so với kỳ trước" icon="users" tone="cyan" />
        <KpiCard title="Tỷ lệ hoàn thành" value={`${kpis.completion}%`} hint="Mục tiêu: 55%" icon="graduation-cap" tone="indigo" />
      </section>

      {/* Chart + Top courses */}
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
            <MainLineChart mode={chartMode} />
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
          onManage={() => toast("Quản lý", "Prototype: điều hướng sang Instructor dashboard.")}
          onIdea={() => toast("Chiến dịch", "Prototype: tạo campaign (upsell/bundle/voucher).")}
        />
      </section>

      {/* Orders + Students */}
      <section className="grid gap-4 lg:grid-cols-3">
        <OrdersMiniTable
          items={filteredOrders}
          onOpenOrders={() => toast("Orders", "Prototype: điều hướng sang Admin Orders.")}
        />
        <StudentsProgressCard
          items={filteredStudents}
          onOpenPortal={() => toast("Student Portal", "Prototype: điều hướng sang Student portal.")}
          onImport={() => toast("Import học viên", "Prototype: CSV validate + tạo user/enrollment.")}
          onMessage={() => toast("Nhắn học viên", "Prototype: broadcast theo cohort/khóa học.")}
        />
      </section>

      {/* Analytics + Checklist */}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="card p-6">
          <div className="text-xs font-semibold text-slate-500">Phân tích</div>
          <div className="text-lg font-extrabold">Kênh bán</div>
          <div className="mt-1 text-sm text-slate-600">Tỉ trọng theo nguồn traffic.</div>
          <div className="mt-5">
            <DonutChart />
          </div>
        </div>

        <div className="card p-6">
          <div className="text-xs font-semibold text-slate-500">Chất lượng</div>
          <div className="text-lg font-extrabold">Tỉ lệ rời bỏ</div>
          <div className="mt-1 text-sm text-slate-600">Drop-off theo tuần.</div>
          <div className="mt-5">
            <BarChart />
          </div>
        </div>

        <ChecklistCard
          items={checklistItems}
          value={checks}
          onChange={setChecks}
          onSave={() => toast("Đã lưu cấu hình (prototype)", "Checklist đã được lưu trong trình duyệt.")}
        />
      </section>

      <footer className="py-6 text-center text-sm text-slate-500">
        © 2025 AYANAVITA Admin Dashboard (React) • Ready for NestJS APIs.
      </footer>
    </AdminShell>
  );
}