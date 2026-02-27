import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../state/auth.store";
import { ordersApi, type Order, type OrderItem, type OrderStatus } from "../../api/orders.api";
import "./AdminSpaPage.css";
import "./AdminOrdersPage.css";

function fmtVND(v: number) {
  try {
    return v.toLocaleString("vi-VN") + "đ";
  } catch {
    return String(v) + "đ";
  }
}

function StatusPill({ status }: { status: OrderStatus }) {
  return <span className={`orders-status-pill orders-status-${status.toLowerCase()}`}>{status}</span>;
}

export function AdminOrdersPage() {
  const lang = (window.localStorage.getItem('lang-admin') as "en-US"|"vi"|"de"|null) || "en-US";
  const { user } = useAuth();
  const [items, setItems] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [status, setStatus] = useState<OrderStatus | "ALL">("ALL");
  const [q, setQ] = useState("");
  const qDebounceRef = useRef<number | null>(null);

  const displayName = useMemo(() => {
    if (!user?.email) return "Admin User";
    const baseName = user.email.split("@")[0]?.replace(/[._-]+/g, " ").trim();
    return baseName ? baseName.replace(/\b\w/g, (char) => char.toUpperCase()) : user.email;
  }, [user?.email]);
  const roleLabel = user?.role === "ADMIN" ? "Administrator" : user?.role ?? "User";
  const avatarLetter = (displayName[0] || "A").toUpperCase();

  const stats = useMemo(() => {
    const pending = items.filter((order) => order.status === "PENDING").length;
    const paid = items.filter((order) => order.status === "PAID").length;
    const cancelled = items.filter((order) => order.status === "CANCELLED").length;
    const revenue = items.filter((order) => order.status === "PAID").reduce((sum, order) => sum + order.total, 0);
    return { total: items.length, pending, paid, cancelled, revenue };
  }, [items]);

  async function load(next?: { status?: OrderStatus | "ALL"; q?: string }) {
    setLoading(true);
    setErr(null);
    try {
      const data = await ordersApi.list({
        status: next?.status ?? status,
        q: (next?.q ?? q).trim() || undefined,
        lang,
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

  useEffect(() => {
    load({ status });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

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
    <div className="admin-page orders-page">
      <header className="admin-header">
        <div>
          <p className="admin-header-kicker">ADMIN / ORDERS</p>
          <h1>Quản lý đơn hàng</h1>
          <p>Theo dõi trạng thái thanh toán và kích hoạt enrollment cho học viên.</p>
        </div>

        <div className="admin-user-badge">
          <span className="admin-user-avatar">{avatarLetter}</span>
          <span className="admin-user-meta">
            <strong>{displayName}</strong>
            <span>{roleLabel}</span>
          </span>
        </div>
      </header>

      <section className="admin-overview orders-overview">
        <article className="overview-card">
          <span>Tổng đơn</span>
          <strong>{stats.total}</strong>
          <small>Đơn theo bộ lọc hiện tại</small>
          <i className="fa-solid fa-cart-shopping overview-icon" aria-hidden="true" />
        </article>
        <article className="overview-card">
          <span>Đang chờ</span>
          <strong>{stats.pending}</strong>
          <small>PENDING</small>
          <i className="fa-solid fa-clock overview-icon" aria-hidden="true" />
        </article>
        <article className="overview-card">
          <span>Đã thanh toán</span>
          <strong>{stats.paid}</strong>
          <small>PAID</small>
          <i className="fa-solid fa-circle-check overview-icon" aria-hidden="true" />
        </article>
        <article className="overview-card">
          <span>Doanh thu</span>
          <strong>{fmtVND(stats.revenue)}</strong>
          <small>Chỉ tính đơn đã thanh toán</small>
          <i className="fa-solid fa-money-bill-wave overview-icon" aria-hidden="true" />
        </article>
      </section>

      <section className="admin-card admin-card-glow">
        <div className="orders-toolbar">
          <div className="orders-links">
            <Link className="admin-btn admin-btn-ghost" to="/courses">
              <i className="fa-solid fa-graduation-cap" aria-hidden="true" />
              Courses
            </Link>
            <Link className="admin-btn admin-btn-ghost" to="/admin/spa">
              <i className="fa-solid fa-spa" aria-hidden="true" />
              Admin Spa
            </Link>
            <button className="admin-btn admin-btn-primary" onClick={() => load()} disabled={loading}>
              <i className="fa-solid fa-rotate" aria-hidden="true" />
              Reload
            </button>
          </div>

          <div className="orders-filters">
            <label className="admin-field">
              <span className="admin-label">Status</span>
              <select className="admin-input orders-select" value={status} onChange={(e) => setStatus(e.target.value as OrderStatus | "ALL")}>
                <option value="ALL">ALL</option>
                <option value="PENDING">PENDING</option>
                <option value="PAID">PAID</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </label>

            <label className="admin-field orders-search-field">
              <span className="admin-label">Search</span>
              <input
                className="admin-input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="code / email / courseTitle / id"
              />
            </label>
          </div>
        </div>

        <p className="admin-helper orders-tip">
          Tip: bấm <b>Mark paid</b> để kích hoạt Enrollment ACTIVE cho user.
        </p>
      </section>

      {loading && <div className="orders-state">Loading...</div>}
      {err && <div className="orders-state orders-error">{err}</div>}
      {info && <div className="orders-state orders-info">{info}</div>}

      <div className="orders-list">
        {items.length === 0 && !loading ? (
          <div className="orders-empty">No orders</div>
        ) : (
          items.map((o) => (
            <article key={o.id} className="admin-card order-card">
              <div className="order-card-head">
                <div className="order-title">
                  <strong>#{o.id}</strong>
                  <span>{o.code}</span>
                </div>
                <div className="order-meta">
                  {o.user?.email ? <span className="order-email">{o.user.email}</span> : null}
                  <StatusPill status={o.status} />
                </div>
              </div>

              <div className="order-summary">
                <div>
                  Tổng: <b>{fmtVND(o.total)}</b>
                </div>
                <div className="order-time">{o.createdAt ? new Date(o.createdAt).toLocaleString() : "-"}</div>
              </div>

              <div className="order-items">
                <h4 className="admin-subtitle">
                  <i className="fa-solid fa-list-check" aria-hidden="true" />
                  Items
                </h4>
                <ul>
                  {o.items.map((it: OrderItem) => (
                    <li key={it.id}>
                      <span>{it.courseTitle}</span> — {fmtVND(it.price)} (courseId: {it.courseId})
                    </li>
                  ))}
                </ul>
              </div>

              <div className="admin-row">
                <button
                  className="admin-btn admin-btn-save mb-3"
                  onClick={() => onMarkPaid(o.id)}
                  disabled={o.status === "PAID" || acting === o.id}
                  title={o.status === "PAID" ? "Already paid" : "Mark paid"}
                >
                  <i className="fa-solid fa-money-check-dollar" aria-hidden="true" />
                  {acting === o.id ? "Processing..." : "Mark paid"}
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
