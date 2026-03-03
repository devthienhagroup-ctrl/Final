import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../ui/toast";
import { useLocalStorage } from "../../ui/useLocalStorage";
import {
  OrdersFilters,
  type OrdersFilterState,
} from "../components/orders/OrdersFilters";
import { OrdersTable } from "../components/orders/OrdersTable";
import { OrderDrawer } from "../components/orders/OrderDrawer";
import { CreateManualOrderModal } from "../components/orders/CreateManualOrderModal";
import { OrdersHeader } from "../components/orders/OrdersHeader";
import { OrdersSummary } from "../components/orders/OrdersSummary";

export type OrderStatus = "PAID" | "PENDING" | "REFUND" | "CANCEL";
export type OrderChannel = "FB" | "GG" | "TT" | "REF" | "EMAIL" | "MANUAL";

export type Order = {
  id: number;
  code: string;
  student: string;
  email: string;
  course: string;
  channel: OrderChannel;
  total: number;
  status: OrderStatus;
  date: string; // YYYY-MM-DD
};

const LS = { filters: "aya_orders_filters" } as const;

function money(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

export function AdminOrdersPage() {
  const nav = useNavigate();
  const { toast } = useToast();

  // ===== Fake dataset (sau này thay bằng API list) =====
  const [data, setData] = useState<Order[]>(() => [
    {
      id: 1,
      code: "#OD-12941",
      student: "Minh Anh",
      email: "minhanh@gmail.com",
      course: "Flutter LMS App",
      channel: "FB",
      total: 799000,
      status: "PAID",
      date: "2025-12-18",
    },
    {
      id: 2,
      code: "#OD-12940",
      student: "Tuấn Kiệt",
      email: "tuankiet@gmail.com",
      course: "NestJS + Prisma (LMS API)",
      channel: "GG",
      total: 599000,
      status: "PAID",
      date: "2025-12-18",
    },
    {
      id: 3,
      code: "#OD-12939",
      student: "Hoài Phương",
      email: "hoaiphuong@gmail.com",
      course: "React UI Systems",
      channel: "TT",
      total: 399000,
      status: "PENDING",
      date: "2025-12-17",
    },
    {
      id: 4,
      code: "#OD-12938",
      student: "Thanh Tùng",
      email: "thanhtung@gmail.com",
      course: "Marketing bán khoá",
      channel: "REF",
      total: 499000,
      status: "REFUND",
      date: "2025-12-16",
    },
    {
      id: 5,
      code: "#OD-12937",
      student: "Ngọc Mai",
      email: "ngocmai@gmail.com",
      course: "Flutter LMS App",
      channel: "FB",
      total: 799000,
      status: "PAID",
      date: "2025-12-16",
    },
    {
      id: 6,
      code: "#OD-12936",
      student: "Đức Huy",
      email: "duchuy@gmail.com",
      course: "React UI Systems",
      channel: "EMAIL",
      total: 399000,
      status: "PAID",
      date: "2025-12-15",
    },
    {
      id: 7,
      code: "#OD-12935",
      student: "Bảo Vy",
      email: "baovy@gmail.com",
      course: "NestJS + Prisma (LMS API)",
      channel: "GG",
      total: 599000,
      status: "PENDING",
      date: "2025-12-14",
    },
    {
      id: 8,
      code: "#OD-12934",
      student: "Khánh Linh",
      email: "khanhlinh@gmail.com",
      course: "Marketing bán khoá",
      channel: "TT",
      total: 499000,
      status: "CANCEL",
      date: "2025-12-13",
    },
    {
      id: 9,
      code: "#OD-12933",
      student: "Gia Hân",
      email: "giahan@gmail.com",
      course: "Flutter LMS App",
      channel: "FB",
      total: 799000,
      status: "PAID",
      date: "2025-12-12",
    },
    {
      id: 10,
      code: "#OD-12932",
      student: "Nhật Minh",
      email: "nhatminh@gmail.com",
      course: "React UI Systems",
      channel: "GG",
      total: 399000,
      status: "PENDING",
      date: "2025-12-11",
    },
  ]);

  // ===== Filter persist =====
  const [savedFilters, setSavedFilters] = useLocalStorage<OrdersFilterState>(
    LS.filters,
    {
      q: "",
      status: "PAID",
      channel: "ALL",
      sort: "date_desc",
    }
  );

  const [filtersDraft, setFiltersDraft] = useState<OrdersFilterState>(
    savedFilters
  );

  // ===== Paging =====
  const pageSize = 7;
  const [page, setPage] = useState(1);

  // ===== UI states =====
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [drawerOrder, setDrawerOrder] = useState<Order | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // ===== Derived: filtered + sorted =====
  const filtered = useMemo(() => {
    const q = savedFilters.q.trim().toLowerCase();
    const st = savedFilters.status;
    const ch = savedFilters.channel;

    let list = data.filter((o) => {
      const hay = (
        o.code +
        " " +
        o.student +
        " " +
        o.course +
        " " +
        o.email
      ).toLowerCase();
      const okQ = !q || hay.includes(q);
      const okS = st === "ALL" || o.status === st;
      const okC = ch === "ALL" || o.channel === ch;
      return okQ && okS && okC;
    });

    const sort = savedFilters.sort;
    const byDateAsc = (a: Order, b: Order) => a.date.localeCompare(b.date);
    const byDateDesc = (a: Order, b: Order) => b.date.localeCompare(a.date);
    const byTotalAsc = (a: Order, b: Order) => a.total - b.total;
    const byTotalDesc = (a: Order, b: Order) => b.total - a.total;

    list = list.sort(
      sort === "date_asc"
        ? byDateAsc
        : sort === "total_desc"
        ? byTotalDesc
        : sort === "total_asc"
        ? byTotalAsc
        : byDateDesc
    );

    return list;
  }, [data, savedFilters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  // Clamp page nếu totalPages thay đổi (VD lọc ít đi)
  const safePage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage]);

  // ===== Summary =====
  const summary = useMemo(() => {
    const totalOrders = filtered.length;
    const revenue = filtered
      .filter((x) => x.status === "PAID")
      .reduce((a, b) => a + b.total, 0);
    const refund = filtered
      .filter((x) => x.status === "REFUND")
      .reduce((a, b) => a + b.total, 0);
    const paid = filtered.filter((x) => x.status === "PAID").length;
    const paidRate = totalOrders ? Math.round((paid / totalOrders) * 100) : 0;
    return { totalOrders, revenue, refund, paidRate };
  }, [filtered]);

  // ===== Keyboard shortcuts =====
  useEffect(() => {
    let gPressed = false;

    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || "").toUpperCase();
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      if (e.key === "/" && !typing) {
        e.preventDefault();
        const el = document.getElementById(
          "ordersSearch"
        ) as HTMLInputElement | null;
        el?.focus();
        return;
      }

      if (e.key.toLowerCase() === "g") {
        gPressed = true;
        window.setTimeout(() => (gPressed = false), 800);
      }
      if (gPressed && e.key.toLowerCase() === "d") {
        nav("/admin/dashboard");
      }

      if (e.key === "Escape") {
        setDrawerOrder(null);
        setCreateOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [nav]);

  // ===== Actions =====
  const applyFilters = () => {
    // commit draft -> saved
    setSavedFilters(filtersDraft);

    // reset paging + selection (thay cho useEffect([savedFilters]))
    setPage(1);
    setSelectedIds([]);

    // API: GET /admin/orders?q=&status=&channel=&sort=&page=&pageSize=
    // Khi nối backend: gọi ordersApi.list(filtersDraft) -> setData(result.items), setPage/total...
  };

  const resetFilters = () => {
    const v: OrdersFilterState = {
      q: "",
      status: "PAID",
      channel: "ALL",
      sort: "date_desc",
    };

    setFiltersDraft(v);
    setSavedFilters(v);

    // reset paging + selection
    setPage(1);
    setSelectedIds([]);

    toast("Đã reset filter", "Trở về mặc định.");
  };

  const exportCSV = () => {
    const header = [
      "code",
      "student",
      "email",
      "course",
      "channel",
      "total",
      "status",
      "date",
    ];

    const csv =
      [header.join(",")]
        .concat(
          filtered.map((o) =>
            [o.code, o.student, o.email, o.course, o.channel, o.total, o.status, o.date]
              .map((x) => String(x).replaceAll('"', '""'))
              .map((x) => `"${x}"`)
              .join(",")
          )
        )
        .join("\n") + "\n";

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ayanavita-orders.csv";
    a.click();
    URL.revokeObjectURL(a.href);

    toast("Xuất CSV", "Đã tải file theo filter hiện tại.");
    // API: server-side export (tuỳ chọn) GET /admin/orders/export?...
  };

  const bulkUpdate = (toStatus: OrderStatus) => {
    if (!selectedIds.length) {
      toast("Chưa chọn đơn", "Tick checkbox trước khi bulk.");
      return;
    }

    setData((prev) =>
      prev.map((o) =>
        selectedIds.includes(o.id) ? { ...o, status: toStatus } : o
      )
    );

    toast("Bulk update", `Đã cập nhật ${selectedIds.length} đơn → ${toStatus}`);

    // API:
    // - Mark PAID: ADMIN POST /orders/:id/mark-paid (kích hoạt enrollment ACTIVE)
    // - Refund: POST /orders/:id/refund (và revoke enrollment)
    // - Cancel: POST /orders/:id/cancel
  };

  const openOrder = (id: number) => {
    const o = data.find((x) => x.id === id) || null;
    setDrawerOrder(o);
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast("Đã copy", code);
    } catch {
      toast("Không copy được", "Trình duyệt chặn clipboard.");
    }
  };

  const createManual = (payload: {
    student: string;
    email: string;
    course: string;
    total: number;
    status: OrderStatus;
  }) => {
    const id = Math.max(...data.map((x) => x.id)) + 1;
    const code = "#OD-" + String(12900 + id);

    const newOrder: Order = {
      id,
      code,
      student: payload.student || "Khách mới",
      email: payload.email || "unknown@email",
      course: payload.course,
      total: payload.total,
      status: payload.status,
      channel: "MANUAL",
      date: "2025-12-19",
    };

    setData((prev) => [newOrder, ...prev]);
    setCreateOpen(false);
    toast("Tạo đơn thành công", `${code} • ${money(payload.total)}`);

    // API: POST /admin/orders/manual (hoặc /admin/orders) body {student,email,courseId,total,status}
    // trả về order -> prepend vào list
  };

  const drawerAction = (action: "paid" | "refund" | "cancel" | "invoice") => {
    if (!drawerOrder) return;

    if (action === "paid")
      toast("Mark PAID", "React/Nest: ADMIN POST /orders/:id/mark-paid");
    if (action === "refund")
      toast("Refund", "Sẽ có endpoint refund + revoke enrollment");
    if (action === "cancel") toast("Cancel", "Sẽ có endpoint cancel");
    if (action === "invoice") toast("Invoice", "Prototype: export hoá đơn");

    // API mapping:
    // paid:   POST /orders/:id/mark-paid
    // refund: POST /orders/:id/refund
    // cancel: POST /orders/:id/cancel
    // invoice: GET /orders/:id/invoice.pdf (tuỳ chọn)
  };

  return (
    <div className="soft text-slate-900 min-h-screen">
      <div className="min-h-screen">
        <OrdersHeader
          onGoDashboard={() => nav("/admin/dashboard")}
          onGoRBAC={() => nav("/admin/rbac")}
          onPrint={() => window.print()}
          onExport={exportCSV}
          onCreateManual={() => setCreateOpen(true)}
        />

        <main className="px-4 md:px-8 py-6 space-y-6">
          <section className="card p-5">
            <OrdersFilters
              value={filtersDraft}
              onChange={setFiltersDraft}
              onApply={applyFilters}
              onReset={resetFilters}
            />
            <div className="mt-5">
              <OrdersSummary
                totalOrders={summary.totalOrders}
                revenue={summary.revenue}
                paidRate={summary.paidRate}
                refund={summary.refund}
              />
            </div>
          </section>

          <section className="card p-5">
            <OrdersTable
              items={pageItems}
              page={safePage}
              total={filtered.length}
              showing={pageItems.length}
              totalPages={totalPages}
              selectedIds={selectedIds}
              onToggleAll={(checked) => {
                setSelectedIds(checked ? pageItems.map((x) => x.id) : []);
              }}
              onToggleOne={(id, checked) => {
                setSelectedIds((prev) =>
                  checked
                    ? Array.from(new Set([...prev, id]))
                    : prev.filter((x) => x !== id)
                );
              }}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
              onOpen={openOrder}
              onCopy={copyCode}
              onBulkPaid={() => bulkUpdate("PAID")}
              onBulkRefund={() => bulkUpdate("REFUND")}
              onBulkCancel={() => bulkUpdate("CANCEL")}
            />
          </section>
        </main>

        <OrderDrawer
          open={!!drawerOrder}
          order={drawerOrder}
          onClose={() => setDrawerOrder(null)}
          onAction={drawerAction}
        />

        <CreateManualOrderModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreate={createManual}
        />
      </div>
    </div>
  );
}