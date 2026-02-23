// src/pages/MyOrdersPage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ordersApi, type MyOrder, type OrderItem, type OrderStatus } from "../api/orders.api";

import { AppShell, Badge, Button, Card, Container, Hr, Muted, SubTitle, Title, Tooltip, theme } from "../ui/ui";
import { IconInfo, IconRefresh, IconSearch } from "../ui/icons";

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

function normalizeText(x: unknown) {
  return String(x ?? "").trim().toLowerCase();
}

function containsAny(haystack: string, needles: string[]) {
  if (!needles.length) return true;
  for (const n of needles) if (haystack.includes(n)) return true;
  return false;
}

function orderMatchesQuery(o: MyOrder, q: string) {
  const qs = normalizeText(q);
  if (!qs) return true;
  const parts = qs.split(/\s+/).filter(Boolean);

  const blob = [
    o.code,
    o.status,
    o.currency,
    o.total,
    o.createdAt,
    o.updatedAt,
    ...(o.items || []).map((it) => `${it.courseTitle} ${it.courseId} ${it.price}`),
  ]
    .map((x) => normalizeText(x))
    .join(" | ");

  return containsAny(blob, parts);
}

function tryCopy(text: string) {
  try {
    if (navigator?.clipboard?.writeText) return navigator.clipboard.writeText(text);
  } catch {
    // ignore
  }
  // fallback
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

function OrderItems({ items }: { items: OrderItem[] }) {
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
              <Link to={`/courses/${it.courseId}`} style={{ textDecoration: "none", color: theme.colors.text }}>
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

function StatusHint({ status }: { status: OrderStatus }) {
  if (status === "PENDING") {
    return (
      <div style={{ display: "grid", gap: 6 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Badge tone="warning">PENDING</Badge>
          <div style={{ fontWeight: 900 }}>Chờ admin mark-paid để kích hoạt Enrollment ACTIVE.</div>
        </div>
        <Muted>
          Ngay khi admin mark-paid, hệ thống sẽ tự mở nội dung (Enrollment ACTIVE). Bạn có thể bấm “Kiểm tra” để cập nhật nhanh.
        </Muted>
      </div>
    );
  }
  if (status === "PAID") {
    return (
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <Badge tone="success">PAID</Badge>
        <div style={{ fontWeight: 900 }}>Đã thanh toán. Bạn có thể vào học ngay.</div>
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

export function MyOrdersPage() {
  const [items, setItems] = useState<MyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [status, setStatus] = useState<OrderStatus | "ALL">("ALL");
  const [q, setQ] = useState("");

  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const pollRef = useRef<number | null>(null);
  const pollStartedAt = useRef<number>(0);

  const hasPending = useMemo(() => items.some((o) => o.status === "PENDING"), [items]);

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
      const data = await ordersApi.myOrders();
      setItems([...data].sort((a, b) => b.id - a.id));
    } catch (e: any) {
      setErr(e?.message || "Load my orders failed");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function refreshFast() {
    setBusy(true);
    setErr(null);
    setInfo(null);
    try {
      await load();
      setInfo("Đã cập nhật danh sách đơn hàng.");
    } catch (e: any) {
      setErr(e?.message || "Refresh failed");
    } finally {
      setBusy(false);
      window.setTimeout(() => setInfo(null), 2000);
    }
  }

  // init load
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // auto-poll khi còn PENDING (tối đa 2 phút) để user không phải bấm reload liên tục
  useEffect(() => {
    if (!hasPending) {
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
    }, 6000);

    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPending]);

  const filtered = useMemo(() => {
    const byStatus = status === "ALL" ? items : items.filter((o) => o.status === status);
    return byStatus.filter((o) => orderMatchesQuery(o, q));
  }, [items, status, q]);

  return (
    <AppShell>
      <Container>
        {/* Header */}
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
              <Title>Đơn hàng của tôi</Title>
              <SubTitle>Theo dõi trạng thái thanh toán và kích hoạt Enrollment.</SubTitle>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <Link to="/courses" style={{ textDecoration: "none" }}>
                <Button tone="neutral" variant="ghost">
                  Courses
                </Button>
              </Link>

              <Link to="/me/courses" style={{ textDecoration: "none" }}>
                <Button tone="neutral" variant="ghost">
                  My Courses
                </Button>
              </Link>

              <Button
                tone="neutral"
                variant="ghost"
                onClick={() => void refreshFast()}
                disabled={loading || busy}
                leftIcon={<IconRefresh />}
              >
                Kiểm tra
              </Button>
            </div>
          </div>

          <Hr />

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

            <div style={{ flex: "1 1 320px", minWidth: 220 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    flex: 1,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: `1px solid ${theme.colors.border}`,
                    background: "#fff",
                  }}
                >
                  <IconSearch />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Tìm theo code / tên khoá học…"
                    style={{
                      width: "100%",
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      color: theme.colors.text,
                    }}
                  />
                </div>

                <Button tone="neutral" variant="ghost" onClick={() => setQ("")} disabled={!q}>
                  Clear
                </Button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
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

              {hasPending ? (
                <Tooltip content="Khi có PENDING, trang sẽ tự kiểm tra định kỳ trong 2 phút.">
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
            <SubTitle>Đang lấy danh sách đơn hàng.</SubTitle>
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
            <Title>Chưa có đơn hàng</Title>
            <SubTitle>Vào Courses để mua/ghi danh khoá học.</SubTitle>
            <Hr />
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link to="/courses" style={{ textDecoration: "none" }}>
                <Button tone="primary">Đi tới Courses</Button>
              </Link>
              <Link to="/me/courses" style={{ textDecoration: "none" }}>
                <Button tone="neutral" variant="ghost">
                  Đi tới My Courses
                </Button>
              </Link>
            </div>
          </Card>
        ) : null}

        {/* List */}
        <div style={{ display: "grid", gap: 12 }}>
          {filtered.map((o) => {
            const isOpen = expanded[o.id] ?? false;
            const created = o.createdAt ? new Date(o.createdAt).toLocaleString("vi-VN") : "-";
            const updated = o.updatedAt ? new Date(o.updatedAt).toLocaleString("vi-VN") : "-";

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
                      Tổng: <b>{fmtVND(o.total)}</b> • Tạo: {created} • Cập nhật: {updated}
                    </SubTitle>
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <StatusBadge status={o.status} />

                    <Button
                      tone="neutral"
                      variant="ghost"
                      onClick={() => void tryCopy(o.code).then(() => setInfo(`Đã copy code: ${o.code}`))}
                    >
                      Copy code
                    </Button>

                    <Button
                      tone="neutral"
                      variant="ghost"
                      onClick={() => setExpanded((p) => ({ ...p, [o.id]: !isOpen }))}
                    >
                      {isOpen ? "Thu gọn" : "Xem chi tiết"}
                    </Button>
                  </div>
                </div>

                <Hr />

                <StatusHint status={o.status} />

                {o.status === "PENDING" ? (
                  <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <Button
                      tone="primary"
                      onClick={() => void refreshFast()}
                      disabled={loading || busy}
                      leftIcon={<IconRefresh />}
                    >
                      Tôi đã thanh toán / Kiểm tra
                    </Button>
                    <Muted>
                      Nếu bạn vừa chuyển khoản/QR, bấm để cập nhật trạng thái. Trang cũng sẽ tự kiểm tra định kỳ khi còn PENDING.
                    </Muted>
                  </div>
                ) : null}

                {isOpen ? (
                  <>
                    <Hr />
                    <div style={{ display: "grid", gap: 10 }}>
                      <div style={{ fontWeight: 900 }}>Khoá học trong đơn</div>
                      <OrderItems items={o.items || []} />

                      {o.status === "PAID" ? (
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <Link to="/me/courses" style={{ textDecoration: "none" }}>
                            <Button tone="success">Đi tới My Courses</Button>
                          </Link>
                          <Link to="/courses" style={{ textDecoration: "none" }}>
                            <Button tone="neutral" variant="ghost">
                              Xem thêm Courses
                            </Button>
                          </Link>
                        </div>
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
