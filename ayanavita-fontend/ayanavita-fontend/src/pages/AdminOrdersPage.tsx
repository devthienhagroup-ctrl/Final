// src/pages/AdminOrdersPage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ordersApi, type Order, type OrderItem, type OrderStatus } from "../api/orders.api";

import {
  AppShell,
  Badge,
  Button,
  Card,
  Container,
  Hr,
  Muted,
  SubTitle,
  Title,
  Tooltip,
  theme,
} from "../ui/ui";

import { IconCheck, IconInfo, IconRefresh } from "../ui/icons";

function fmtVND(v: number) {
  try {
    return v.toLocaleString("vi-VN") + "đ";
  } catch {
    return String(v) + "đ";
  }
}

function statusTone(s: OrderStatus) {
  if (s === "PAID") return "success" as const;
  if (s === "PENDING") return "warning" as const;
  return "danger" as const;
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={statusTone(status)}>{status}</Badge>;
}

function tryCopy(text: string) {
  try {
    if (navigator?.clipboard?.writeText) return navigator.clipboard.writeText(text);
  } catch {
    // ignore
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return Promise.resolve();
  } catch {
    return Promise.resolve();
  }
}

function ItemsCompact({ items }: { items: OrderItem[] }) {
  if (!items?.length) return <Muted>Không có item.</Muted>;

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {items.map((it) => (
        <div
          key={it.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            padding: "10px 12px",
            borderRadius: 12,
            border: `1px solid ${theme.colors.border}`,
            background: "#fff",
          }}
        >
          <div style={{ display: "grid", gap: 2 }}>
            <div style={{ fontWeight: 900 }}>
              <Link
                to={`/courses/${it.courseId}`}
                style={{ textDecoration: "none", color: theme.colors.text }}
              >
                {it.courseTitle}
              </Link>
            </div>
            <div style={{ fontSize: 12, color: theme.colors.muted }}>
              courseId={it.courseId} • itemId={it.id}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ fontWeight: 900 }}>{fmtVND(it.price)}</div>
            <Link to={`/courses/${it.courseId}`} style={{ textDecoration: "none" }}>
              <Button tone="neutral" variant="ghost">
                Xem khoá học
              </Button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusHintAdmin({ status }: { status: OrderStatus }) {
  if (status === "PENDING") {
    return (
      <div style={{ display: "grid", gap: 6 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Badge tone="warning">PENDING</Badge>
          <div style={{ fontWeight: 900 }}>Có thể mark-paid để kích hoạt Enrollment ACTIVE.</div>
        </div>
        <Muted>
          Khi mark-paid thành công, user sẽ tự chuyển ACTIVE ở UI (EnrollmentGatePanel đang auto-check).
        </Muted>
      </div>
    );
  }
  if (status === "PAID") {
    return (
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <Badge tone="success">PAID</Badge>
        <div style={{ fontWeight: 900 }}>Đã thanh toán. User học được ngay.</div>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      <Badge tone="danger">{status}</Badge>
      <div style={{ fontWeight: 900 }}>Đơn hàng ở trạng thái {status}.</div>
    </div>
  );
}

export function AdminOrdersPage() {
  const [items, setItems] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [status, setStatus] = useState<OrderStatus | "ALL">("ALL");
  const [q, setQ] = useState("");
  const [qCommitted, setQCommitted] = useState("");

  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  // Auto-poll nếu đang xem ALL/PENDING và có pending (tối đa 2 phút)
  const pollRef = useRef<number | null>(null);
  const pollStartedAt = useRef<number>(0);

  const hasPending = useMemo(() => items.some((o) => o.status === "PENDING"), [items]);
  const allowAutoPoll = useMemo(() => status === "ALL" || status === "PENDING", [status]);

  const counts = useMemo(() => {
    const c = { ALL: items.length, PENDING: 0, PAID: 0, CANCELLED: 0 };
    for (const o of items) {
      if (o.status === "PENDING") c.PENDING += 1;
      else if (o.status === "PAID") c.PAID += 1;
      else if (o.status === "CANCELLED") c.CANCELLED += 1;
    }
    return c;
  }, [items]);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = await ordersApi.list({
        status,
        q: qCommitted.trim() || undefined,
      });
      setItems([...data].sort((a, b) => b.id - a.id));
    } catch (e: any) {
      setErr(e?.message || "Load orders failed");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function refreshFast() {
    setErr(null);
    setInfo(null);
    try {
      await load();
      setInfo("Đã cập nhật danh sách orders.");
    } catch (e: any) {
      setErr(e?.message || "Refresh failed");
    } finally {
      window.setTimeout(() => setInfo(null), 2000);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, qCommitted]);

  useEffect(() => {
    if (!allowAutoPoll || !hasPending) {
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = null;
      return;
    }
    if (pollRef.current) return;

    pollStartedAt.current = Date.now();
    pollRef.current = window.setInterval(() => {
      const elapsed = Date.now() - pollStartedAt.current;
      if (elapsed > 120_000) {
        if (pollRef.current) window.clearInterval(pollRef.current);
        pollRef.current = null;
        return;
      }
      load().catch(() => {});
    }, 7000);

    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowAutoPoll, hasPending]);

  async function onMarkPaid(orderId: number, code: string) {
    const ok = window.confirm(`Mark PAID cho order #${orderId} (${code})?`);
    if (!ok) return;

    setBusyId(orderId);
    setErr(null);
    setInfo(null);

    try {
      await ordersApi.markPaid(orderId);
      await load();
      setInfo(`Đã mark-paid order ${code}.`);
    } catch (e: any) {
      setErr(e?.message || "Mark paid failed");
    } finally {
      setBusyId(null);
      window.setTimeout(() => setInfo(null), 2500);
    }
  }

  const filtered = useMemo(() => {
    // server đã filter theo status/qCommitted, nhưng vẫn filter nhẹ theo q đang gõ để UX tốt hơn
    const qs = q.trim().toLowerCase();
    if (!qs) return items;
    const parts = qs.split(/\s+/).filter(Boolean);

    return items.filter((o) => {
      const blob = [
        o.id,
        o.code,
        o.status,
        o.user?.email,
        o.user?.name,
        o.total,
        o.currency,
        o.createdAt,
        ...(o.items || []).map((it) => `${it.courseTitle} ${it.courseId}`),
      ]
        .map((x) => String(x ?? "").toLowerCase())
        .join(" | ");

      return parts.every((p) => blob.includes(p));
    });
  }, [items, q]);

  return (
    <AppShell>
      <Container>
        {/* Header + Filters */}
        <Card style={{ marginBottom: 12 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div>
              <Title>Admin — Orders</Title>
              <SubTitle>Quản lý đơn hàng, mark-paid để kích hoạt Enrollment ACTIVE.</SubTitle>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <Link to="/me/orders" style={{ textDecoration: "none" }}>
                <Button tone="neutral" variant="ghost">
                  My Orders
                </Button>
              </Link>

              <Link to="/courses" style={{ textDecoration: "none" }}>
                <Button tone="neutral" variant="ghost">
                  Courses
                </Button>
              </Link>

              <Button
                tone="neutral"
                variant="ghost"
                onClick={() => void refreshFast()}
                disabled={loading || busyId !== null}
                leftIcon={<IconRefresh />}
              >
                Reload
              </Button>
            </div>
          </div>

          <Hr />

          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Muted>Status</Muted>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OrderStatus | "ALL")}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: `1px solid ${theme.colors.border}`,
                    background: "#fff",
                  }}
                >
                  <option value="ALL">ALL</option>
                  <option value="PENDING">PENDING</option>
                  <option value="PAID">PAID</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </label>

              <div style={{ flex: "1 1 420px", minWidth: 240 }}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search (code / user email / course title...)"
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: `1px solid ${theme.colors.border}`,
                      background: "#fff",
                      color: theme.colors.text,
                      outline: "none",
                      minWidth: 220,
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setQCommitted(q);
                    }}
                  />

                  <Button tone="primary" onClick={() => setQCommitted(q)} disabled={loading || busyId !== null}>
                    Search
                  </Button>

                  <Button
                    tone="neutral"
                    variant="ghost"
                    onClick={() => {
                      setQ("");
                      setQCommitted("");
                    }}
                    disabled={loading || busyId !== null}
                  >
                    Clear
                  </Button>
                </div>

                {/* ✅ FIX: Muted không nhận style => bọc div */}
                <div style={{ marginTop: 6 }}>
                  <Muted>
                    Server filter theo <b>status</b> + <b>q</b>. Enter hoặc “Search” để áp dụng q.
                  </Muted>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <Muted>
                ALL: <b>{counts.ALL}</b>
              </Muted>
              <Muted>
                PENDING: <b>{counts.PENDING}</b>
              </Muted>
              <Muted>
                PAID: <b>{counts.PAID}</b>
              </Muted>
              <Muted>
                CANCELLED: <b>{counts.CANCELLED}</b>
              </Muted>

              {allowAutoPoll && hasPending ? (
                <Tooltip content="Có PENDING: trang sẽ auto-reload định kỳ trong 2 phút để bắt trạng thái mới.">
                  <span>
                    <Badge tone="info">Auto-check</Badge>
                  </span>
                </Tooltip>
              ) : null}
            </div>
          </div>
        </Card>

        {/* Alerts */}
        {loading ? (
          <Card style={{ marginBottom: 12 }}>
            <Title>Đang tải…</Title>
            <SubTitle>Đang lấy danh sách orders.</SubTitle>
          </Card>
        ) : null}

        {err ? (
          <Card style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Badge tone="danger">
                <IconInfo /> ERROR
              </Badge>
              <div style={{ fontWeight: 900 }}>{err}</div>
            </div>
          </Card>
        ) : null}

        {info ? (
          <Card style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Badge tone="info">
                <IconInfo /> INFO
              </Badge>
              <div style={{ fontWeight: 900 }}>{info}</div>
            </div>
          </Card>
        ) : null}

        {/* Empty */}
        {!loading && filtered.length === 0 ? (
          <Card>
            <Title>Không có orders</Title>
            <SubTitle>Thử đổi status hoặc search theo code/email.</SubTitle>
          </Card>
        ) : null}

        {/* List */}
        <div style={{ display: "grid", gap: 12 }}>
          {filtered.map((o) => {
            const isOpen = expanded[o.id] ?? false;
            const created = o.createdAt ? new Date(o.createdAt).toLocaleString("vi-VN") : "-";
            const updated = o.updatedAt ? new Date(o.updatedAt).toLocaleString("vi-VN") : "-";
            const canMarkPaid = o.status === "PENDING";
            const isBusy = busyId === o.id;

            return (
              <Card key={o.id}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "grid", gap: 4 }}>
                    <Title>
                      #{o.id} — {o.code}
                    </Title>
                    <SubTitle>
                      User: <b>{o.user?.email || "—"}</b>
                      {o.user?.name ? <span> • {o.user.name}</span> : null}
                      <span style={{ marginLeft: 10, color: theme.colors.faint, fontSize: 12 }}>
                        {created} • updated {updated}
                      </span>
                    </SubTitle>
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <StatusBadge status={o.status} />

                    <Button
                      tone="neutral"
                      variant="ghost"
                      onClick={() => void tryCopy(o.code).then(() => setInfo(`Đã copy code: ${o.code}`))}
                      disabled={loading || busyId !== null}
                    >
                      Copy code
                    </Button>

                    {canMarkPaid ? (
                      <Button
                        tone="success"
                        onClick={() => void onMarkPaid(o.id, o.code)}
                        disabled={loading || busyId !== null}
                        leftIcon={<IconCheck />}
                      >
                        {isBusy ? "Marking..." : "Mark paid"}
                      </Button>
                    ) : null}

                    <Button
                      tone="neutral"
                      variant="ghost"
                      onClick={() => setExpanded((p) => ({ ...p, [o.id]: !isOpen }))}
                      disabled={loading}
                    >
                      {isOpen ? "Thu gọn" : "Chi tiết"}
                    </Button>
                  </div>
                </div>

                <Hr />

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                  <div>
                    Tổng: <b>{fmtVND(o.total)}</b>{" "}
                    <span style={{ color: theme.colors.muted, fontSize: 12 }}>({o.currency})</span>
                  </div>
                  <div style={{ color: theme.colors.muted }}>
                    Subtotal: <b>{fmtVND(o.subtotal)}</b>
                  </div>
                  <div style={{ color: theme.colors.muted }}>
                    Discount: <b>{fmtVND(o.discount)}</b>
                  </div>
                  <div style={{ color: theme.colors.muted }}>
                    Items: <b>{o.items?.length || 0}</b>
                  </div>
                </div>

                <div style={{ marginTop: 10 }}>
                  <StatusHintAdmin status={o.status} />
                </div>

                {isOpen ? (
                  <>
                    <Hr />
                    <div style={{ display: "grid", gap: 10 }}>
                      <div style={{ fontWeight: 900 }}>Khoá học trong đơn</div>
                      <ItemsCompact items={o.items || []} />

                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {o.items?.[0]?.courseId ? (
                          <Link to={`/courses/${o.items[0].courseId}`} style={{ textDecoration: "none" }}>
                            <Button tone="primary" variant="ghost">
                              Mở course đầu tiên
                            </Button>
                          </Link>
                        ) : null}

                        <Link to="/me/orders" style={{ textDecoration: "none" }}>
                          <Button tone="neutral" variant="ghost">
                            Xem My Orders (User)
                          </Button>
                        </Link>
                      </div>

                      {canMarkPaid ? (
                        <Muted>
                          Tip: Sau khi mark-paid, user ở LessonDetailPage sẽ tự ACTIVE trong vài giây (auto-check).
                        </Muted>
                      ) : null}
                    </div>
                  </>
                ) : null}
              </Card>
            );
          })}
        </div>
      </Container>
    </AppShell>
  );
}
