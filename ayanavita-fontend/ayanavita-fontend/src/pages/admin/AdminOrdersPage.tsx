import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ordersApi, type Order, type OrderStatus, type OrderItem } from "../../api/orders.api";

function fmtVND(v: number) {
  try {
    return v.toLocaleString("vi-VN") + "đ";
  } catch {
    return String(v) + "đ";
  }
}

function StatusPill({ status }: { status: OrderStatus }) {
  const style: React.CSSProperties = useMemo(() => {
    const base: React.CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 10px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 800,
      border: "1px solid #ddd",
      background: "#fff",
    };
    if (status === "PAID") return { ...base, borderColor: "#16a34a" };
    if (status === "PENDING") return { ...base, borderColor: "#f59e0b" };
    return { ...base, borderColor: "#ef4444" };
  }, [status]);

  return <span style={style}>{status}</span>;
}

export function AdminOrdersPage() {
  const [items, setItems] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [status, setStatus] = useState<OrderStatus | "ALL">("ALL");
  const [q, setQ] = useState("");
  const qDebounceRef = useRef<number | null>(null);

  async function load(next?: { status?: OrderStatus | "ALL"; q?: string }) {
    setLoading(true);
    setErr(null);
    try {
      const data = await ordersApi.list({
        status: next?.status ?? status,
        q: (next?.q ?? q).trim() || undefined,
      });
      setItems(data);
    } catch (e: any) {
      setErr(e?.message || "Load orders failed");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply filter immediately
  useEffect(() => {
    load({ status });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Debounced search
  useEffect(() => {
    if (qDebounceRef.current) window.clearTimeout(qDebounceRef.current);
    qDebounceRef.current = window.setTimeout(() => {
      load({ q });
    }, 350);

    return () => {
      if (qDebounceRef.current) window.clearTimeout(qDebounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function onMarkPaid(orderId: number) {
    setErr(null);
    setInfo(null);
    setActing(orderId);
    try {
      await ordersApi.markPaid(orderId);
      setInfo(`Đã mark-paid order #${orderId}. Enrollment ACTIVE sẽ được kích hoạt theo items.`);
      await load();
    } catch (e: any) {
      setErr(e?.message || "Mark paid failed");
    } finally {
      setActing(null);
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin: "24px auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <h2>Admin Orders</h2>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Link to="/courses">Courses</Link>
          <button onClick={() => load()} disabled={loading}>Reload</button>
        </div>
      </div>

      <div
        style={{
          marginTop: 12,
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          padding: 12,
          background: "#fff",
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus | "ALL")}>
            <option value="ALL">ALL</option>
            <option value="PENDING">PENDING</option>
            <option value="PAID">PAID</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </label>

        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          Search
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="code / email / courseTitle / id"
            style={{ minWidth: 280 }}
          />
        </label>

        <div style={{ fontSize: 12, opacity: 0.75 }}>
          Tip: bấm <b>Mark paid</b> để kích hoạt Enrollment ACTIVE cho user.
        </div>
      </div>

      {loading && <div style={{ padding: 12 }}>Loading...</div>}
      {err && <div style={{ padding: 12, color: "crimson" }}>{err}</div>}
      {info && <div style={{ padding: 12 }}>{info}</div>}

      <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
        {items.length === 0 && !loading ? (
          <div style={{ padding: 12, opacity: 0.8 }}>No orders</div>
        ) : (
          items.map((o) => (
            <div
              key={o.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 14,
                padding: 14,
                background: "#fff",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div style={{ fontWeight: 900 }}>
                  #{o.id} — {o.code}
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  {o.user?.email ? <span style={{ fontSize: 13, opacity: 0.85 }}>{o.user.email}</span> : null}
                  <StatusPill status={o.status} />
                </div>
              </div>

              <div style={{ marginTop: 8, display: "flex", gap: 14, flexWrap: "wrap" }}>
                <div>
                  Tổng: <b>{fmtVND(o.total)}</b>
                </div>
                <div style={{ opacity: 0.75, fontSize: 13 }}>
                  {o.createdAt ? new Date(o.createdAt).toLocaleString() : "-"}
                </div>
              </div>

              <div style={{ marginTop: 10 }}>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>Items</div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {o.items.map((it: OrderItem) => (
                    <li key={it.id} style={{ marginBottom: 4 }}>
                      <span style={{ fontWeight: 700 }}>{it.courseTitle}</span> — {fmtVND(it.price)} (courseId: {it.courseId})
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={() => onMarkPaid(o.id)}
                  disabled={o.status === "PAID" || acting === o.id}
                  title={o.status === "PAID" ? "Already paid" : "Mark paid"}
                >
                  {acting === o.id ? "Processing..." : "Mark paid"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
