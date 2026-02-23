// src/components/EnrollmentGatePanel.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { ordersApi, type Order } from "../api/orders.api";
import { useEnrollmentGate } from "../hooks/useEnrollmentGate";

import {
  Badge,
  Button,
  Card,
  Hr,
  Muted,
  SubTitle,
  Title,
  Tooltip,
  theme,
} from "../ui/ui";

import { IconInfo, IconRefresh } from "../ui/icons";

export type EnrollmentGatePanelProps = {
  courseId: number;
  adminBypass?: boolean;
  title?: string;
  pollMs?: number;
  showOrdersLink?: boolean;
  onBecameActive?: () => void;
};

type PendingOrderInfo = Pick<Order, "id" | "code" | "status" | "total" | "currency" | "createdAt">;

const PENDING_ORDER_KEY = (courseId: number) => `AYA_PENDING_ORDER_V1:${courseId}`;

function loadPendingOrder(courseId: number): PendingOrderInfo | null {
  try {
    const raw = localStorage.getItem(PENDING_ORDER_KEY(courseId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingOrderInfo;
    if (!parsed?.id || !parsed?.code) return null;
    return parsed;
  } catch {
    return null;
  }
}

function savePendingOrder(courseId: number, order: PendingOrderInfo) {
  try {
    localStorage.setItem(PENDING_ORDER_KEY(courseId), JSON.stringify(order));
  } catch {
    // ignore
  }
}

function clearPendingOrder(courseId: number) {
  try {
    localStorage.removeItem(PENDING_ORDER_KEY(courseId));
  } catch {
    // ignore
  }
}

function findNewestPendingOrderForCourse(orders: Order[], courseId: number): PendingOrderInfo | null {
  const matches = orders
    .filter((o) => o.status === "PENDING" && o.items?.some((it) => it.courseId === courseId))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const o = matches[0];
  if (!o) return null;

  return {
    id: o.id,
    code: o.code,
    status: o.status,
    total: o.total,
    currency: o.currency,
    createdAt: o.createdAt,
  };
}

export function EnrollmentGatePanel({
  courseId,
  adminBypass,
  title = "Trạng thái ghi danh",
  pollMs = 5000,
  showOrdersLink = true,
  onBecameActive,
}: EnrollmentGatePanelProps) {
  const gate = useEnrollmentGate(courseId, { adminBypass, auto: true });

  const [busy, setBusy] = useState(false);
  const [localErr, setLocalErr] = useState<string | null>(null);
  const [lastRefreshAt, setLastRefreshAt] = useState<number>(0);

  const [pendingOrder, setPendingOrder] = useState<PendingOrderInfo | null>(() =>
    loadPendingOrder(courseId)
  );

  const tone = useMemo(() => {
    if (gate.status === "ACTIVE") return "success" as const;
    if (gate.status === "PENDING") return "warning" as const;
    if (gate.status === "CANCELLED") return "danger" as const;
    if (gate.status === "NOT_ENROLLED") return "neutral" as const;
    return "info" as const;
  }, [gate.status]);

  const label = useMemo(() => {
    if (gate.status === "ACTIVE") return "ACTIVE";
    if (gate.status === "PENDING") return "PENDING";
    if (gate.status === "CANCELLED") return "CANCELLED";
    if (gate.status === "NOT_ENROLLED") return "NOT_ENROLLED";
    return "UNKNOWN";
  }, [gate.status]);

  // Khi ACTIVE -> clear pending order cache + callback
  useEffect(() => {
    if (gate.status !== "ACTIVE") return;
    setPendingOrder(null);
    clearPendingOrder(courseId);
    onBecameActive?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gate.status]);

  // Khi PENDING mà chưa có pendingOrder info -> tự fetch /me/orders để lấy order mới nhất cho course
  useEffect(() => {
    if (!Number.isFinite(courseId) || courseId <= 0) return;
    if (gate.loading) return;
    if (gate.status !== "PENDING") return;
    if (pendingOrder?.id) return;

    let alive = true;
    (async () => {
      try {
        const orders = await ordersApi.myOrders();
        const found = findNewestPendingOrderForCourse(orders, courseId);
        if (!alive) return;
        if (found) {
          setPendingOrder(found);
          savePendingOrder(courseId, found);
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, gate.status, gate.loading]);

  // Auto poll khi PENDING (để vừa admin mark-paid là tự ACTIVE)
  useEffect(() => {
    if (!Number.isFinite(courseId) || courseId <= 0) return;
    if (gate.loading) return;
    if (gate.status !== "PENDING") return;

    const intervalMs = Math.max(1500, pollMs);
    const t = window.setInterval(async () => {
      await gate.refresh().catch(() => {});
      setLastRefreshAt(Date.now());
    }, intervalMs);

    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, gate.status, gate.loading, pollMs]);

  async function onOrder() {
    if (!Number.isFinite(courseId) || courseId <= 0) return;
    setBusy(true);
    setLocalErr(null);

    try {
      const order = await ordersApi.create(courseId);

      const po: PendingOrderInfo = {
        id: order.id,
        code: order.code,
        status: order.status,
        total: order.total,
        currency: order.currency,
        createdAt: order.createdAt,
      };

      setPendingOrder(po);
      savePendingOrder(courseId, po);

      // refresh gate để status về PENDING ngay
      await gate.refresh();
      setLastRefreshAt(Date.now());
    } catch (e: any) {
      setLocalErr(e?.message || "Order failed");
    } finally {
      setBusy(false);
    }
  }

  async function onRefresh() {
    setLocalErr(null);
    setBusy(true);

    try {
      await gate.refresh();
      setLastRefreshAt(Date.now());

      // Nếu vẫn PENDING mà chưa có pendingOrder -> thử load lại /me/orders
      if (gate.status === "PENDING" && !pendingOrder?.id) {
        const orders = await ordersApi.myOrders();
        const found = findNewestPendingOrderForCourse(orders, courseId);
        if (found) {
          setPendingOrder(found);
          savePendingOrder(courseId, found);
        }
      }
    } catch (e: any) {
      setLocalErr(e?.message || "Refresh failed");
    } finally {
      setBusy(false);
    }
  }

  const autoCheckSeconds = Math.round(Math.max(1500, pollMs) / 1000);

  return (
    <Card style={{ marginBottom: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 260 }}>
          <Title>{title}</Title>
          <SubTitle>
            <span>courseId={courseId}</span>
            <span style={{ marginLeft: 10 }}>
              <Badge tone={tone}>{label}</Badge>
            </span>
          </SubTitle>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <Button tone="neutral" variant="ghost" onClick={onRefresh} disabled={busy}>
            <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
              <IconRefresh /> Kiểm tra
            </span>
          </Button>

          {showOrdersLink ? (
            <Link to="/me/orders" style={{ textDecoration: "none" }}>
              <Button tone="neutral" variant="ghost">
                My Orders
              </Button>
            </Link>
          ) : null}
        </div>
      </div>

      <Hr />

      {gate.error ? (
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Badge tone="danger">ERROR</Badge>
          <div style={{ fontWeight: 800 }}>{gate.error}</div>
        </div>
      ) : null}

      {localErr ? (
        <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
          <Badge tone="danger">ERROR</Badge>
          <div style={{ fontWeight: 800 }}>{localErr}</div>
        </div>
      ) : null}

      <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
        {gate.loading ? <Muted>Đang tải trạng thái ghi danh…</Muted> : null}

        {gate.reason ? (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ marginTop: 2 }}>
              <IconInfo />
            </div>
            <div style={{ color: theme.colors.muted, lineHeight: 1.6 }}>{gate.reason}</div>
          </div>
        ) : null}

        {gate.status === "PENDING" && pendingOrder ? (
          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <Badge tone="warning">ORDER</Badge>
              <div style={{ fontWeight: 800 }}>
                #{pendingOrder.code} (id={pendingOrder.id})
              </div>
            </div>

            <Muted>
              Tổng tiền:{" "}
              <span style={{ fontWeight: 800 }}>
                {Number(pendingOrder.total || 0).toLocaleString("vi-VN")} {pendingOrder.currency}
              </span>{" "}
              • Tạo lúc: {new Date(pendingOrder.createdAt).toLocaleString("vi-VN")}
            </Muted>

            <Muted>
              Sau khi admin mark-paid, enrollment sẽ chuyển ACTIVE và nội dung sẽ tự mở (UI đang auto-check).
            </Muted>
          </div>
        ) : null}

        {lastRefreshAt ? (
          <Muted>
            Lần kiểm tra gần nhất: {new Date(lastRefreshAt).toLocaleTimeString("vi-VN")}
          </Muted>
        ) : null}
      </div>

      <Hr />

      {/* CTA theo status */}
      {gate.status === "ACTIVE" ? (
        <Badge tone="success">Bạn đã ACTIVE — nội dung được mở.</Badge>
      ) : gate.status === "PENDING" ? (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <Badge tone="warning">Đang chờ admin mark-paid…</Badge>

          <Tooltip content={`Tự kiểm tra mỗi ${autoCheckSeconds}s khi PENDING`}>
            <span>
              <Badge tone="info">Auto-check</Badge>
            </span>
          </Tooltip>

          <Muted>
            Nếu bạn vừa thanh toán, hãy bấm <b>Kiểm tra</b> để cập nhật ngay.
          </Muted>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <Button
            tone="primary"
            onClick={onOrder}
            disabled={busy || !Number.isFinite(courseId) || courseId <= 0}
          >
            Mua / Ghi danh
          </Button>

          <Muted>
            Hệ thống sẽ tạo order → chuyển PENDING → tự mở khi admin mark-paid.
          </Muted>
        </div>
      )}
    </Card>
  );
}
