// AdminOrdersDemo.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/http";

type StatusKey = "all" | "processing" | "paid" | "cancelled" | "expired";

type StatusDef = { key: StatusKey; label: string };

type OrderItem = {
    name: string;
    sku: string;
    image: string;
    qty: number;
    price: number;
};

type ShippingInfo = {
    receiverName: string;
    phone: string;
    addressLine: string; // số nhà/đường + phường/xã
    district: string;
    city: string;
    method: "COD" | "Chuyển khoản" | "Ví điện tử";
    carrier: string; // hãng vận chuyển (demo)
    trackingCode: string | null;
    note: string;
    expectedDelivery: string; // yyyy-mm-dd (demo)
};

type Order = {
    id: number;
    code: string;
    status: Exclude<StatusKey, "all">;
    createdAt: string; // yyyy-mm-dd
    customer: { name: string; email: string };
    branch: string;
    confirmedBy: string | null;
    payment: { method: string; paidAt: string | null; ref: string | null };
    items: OrderItem[];
    pricing: { subtotal: number; shipping: number; discount: number; total: number };
    note: string;

    // ✅ Added shipping info
    shippingInfo: ShippingInfo;
};


type ApiOrder = {
    id: number;
    code: string;
    status: string;
    createdAt: string;
    receiverName: string;
    receiverEmail?: string | null;
    receiverPhone: string;
    shippingAddress: string;
    district: string;
    city: string;
    paymentMethod: string;
    paymentCode: string | null;
    paidAt: string | null;
    shippingUnit: string | null;
    trackingCode: string | null;
    expectedDelivery: string | null;
    note: string | null;
    subtotal: number | string;
    shippingFee: number | string;
    discount: number | string;
    total: number | string;
    details: Array<{ productName: string; productSku: string; quantity: number; unitPrice: number | string }>;
};

function toNum(v: number | string | null | undefined) {
    const n = Number(v ?? 0);
    return Number.isFinite(n) ? n : 0;
}

function toUiStatus(status: string): Exclude<StatusKey, "all"> {
    switch ((status || "").toUpperCase()) {
        case "PAID":
            return "paid";
        case "CANCELLED":
            return "cancelled";
        case "EXPIRED":
            return "expired";
        default:
            return "processing";
    }
}

function mapOrder(row: ApiOrder): Order {
    return {
        id: row.id,
        code: row.code,
        status: toUiStatus(row.status),
        createdAt: String(row.createdAt || "").slice(0, 10),
        customer: { name: row.receiverName || "-", email: row.receiverEmail || "-" },
        branch: "Online",
        confirmedBy: null,
        payment: {
            method: row.paymentMethod === "SEPAY" ? "Chuyển khoản" : row.paymentMethod || "COD",
            paidAt: row.paidAt ? String(row.paidAt).slice(0, 10) : null,
            ref: row.paymentCode,
        },
        items: (row.details || []).map((it, idx) => ({
            name: it.productName,
            sku: it.productSku,
            image: `https://picsum.photos/seed/admin-order-${row.id}-${idx}/96/96`,
            qty: Number(it.quantity || 1),
            price: toNum(it.unitPrice),
        })),
        pricing: {
            subtotal: toNum(row.subtotal),
            shipping: toNum(row.shippingFee),
            discount: toNum(row.discount),
            total: toNum(row.total),
        },
        note: row.note || "-",
        shippingInfo: {
            receiverName: row.receiverName || "-",
            phone: row.receiverPhone || "-",
            addressLine: row.shippingAddress || "-",
            district: row.district || "-",
            city: row.city || "-",
            method: row.paymentMethod === "SEPAY" ? "Chuyển khoản" : "COD",
            carrier: row.shippingUnit || "-",
            trackingCode: row.trackingCode || null,
            note: row.note || "-",
            expectedDelivery: row.expectedDelivery ? String(row.expectedDelivery).slice(0, 10) : String(row.createdAt || "").slice(0, 10),
        },
    };
}
const STATUS: Record<StatusKey, StatusDef> = {
    all: { key: "all", label: "Tất cả" },
    processing: { key: "processing", label: "Chờ xử lý" },
    paid: { key: "paid", label: "Đã thanh toán" },
    cancelled: { key: "cancelled", label: "Đã hủy" },
    expired: { key: "expired", label: "Hết hạn" },
};

const CSS = `
:root {
  --bg: #ffffff;
  --text: #0f172a;1
  --muted: #64748b;
  --border: rgba(15, 23, 42, 0.08);
  --shadow: 0 20px 45px rgba(2, 6, 23, 0.12);
  --shadow-soft: 0 12px 28px rgba(2, 6, 23, 0.08);
  --radius: 18px;
  --radius-sm: 12px;

  --grad: linear-gradient(135deg, #7c3aed, #06b6d4);
  --grad-2: linear-gradient(135deg, #22c55e, #06b6d4);
  --grad-warm: linear-gradient(135deg, #f97316, #ec4899);

  --ok: #16a34a;
  --warn: #f59e0b;
  --danger: #ef4444;
  --paid: #2563eb;

  --chip-bg: rgba(2, 6, 23, 0.04);

  --focus: 0 0 0 4px rgba(124, 58, 237, 0.18);
}

* { box-sizing: border-box; }
html, body { height: 100%; }

body {
  margin: 0;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial,
    "Apple Color Emoji", "Segoe UI Emoji";
  background-color: var(--bg);
  background-image: radial-gradient(1200px 600px at 20% -10%, rgba(124, 58, 237, 0.08), transparent 60%),
    radial-gradient(1200px 600px at 90% 0%, rgba(6, 182, 212, 0.08), transparent 55%);
  background-repeat: no-repeat;
  background-attachment: fixed;
  color: var(--text);
}

.app { display: grid; grid-template-columns: 1fr; min-height: 100%; }

.topbar {
  position: sticky;
  top: 0;
  z-index: 5;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--border);
}

.topbar-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 18px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.brand { display: flex; align-items: center; gap: 12px; }

.logo {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: var(--grad);
  box-shadow: 0 14px 28px rgba(124, 58, 237, 0.22);
  display: grid;
  place-items: center;
  color: white;
  font-weight: 900;
  letter-spacing: 0.5px;
}

.brand h1 { font-size: 16px; margin: 0; line-height: 1.1; }
.brand p { margin: 2px 0 0 0; font-size: 12px; color: var(--muted); }

.top-actions { display: flex; align-items: center; gap: 10px; }

.pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 10px 20px rgba(2, 6, 23, 0.06);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  cursor: pointer;
  user-select: none;
}

.pill:hover { transform: translateY(-1px); box-shadow: 0 14px 28px rgba(2, 6, 23, 0.08); }
.pill:active { transform: translateY(0); }

.pill .dot { width: 9px; height: 9px; border-radius: 999px; background: var(--grad-2); }

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 18px;
  padding-bottom: 36px;
}

.page-title {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
  margin-top: 14px;
  margin-bottom: 18px;
}

.page-title h2 { margin: 0; font-size: 22px; letter-spacing: -0.02em; }
.page-title .hint { margin: 0; color: var(--muted); font-size: 13px; }

.stats {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.card {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: var(--shadow-soft);
}

.stat {
  grid-column: span 3;
  padding: 14px 14px 12px 14px;
  overflow: hidden;
  position: relative;
  transform: translateZ(0);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.stat:hover { transform: translateY(-2px); box-shadow: 0 18px 40px rgba(2, 6, 23, 0.11); }

.stat .bg {
  position: absolute;
  inset: -1px;
  opacity: 0.12;
  background: var(--grad);
  pointer-events: none;
}
.stat:nth-child(2) .bg { background: var(--grad-2); }
.stat:nth-child(3) .bg { background: var(--grad-warm); }
.stat:nth-child(4) .bg { background: linear-gradient(135deg, #2563eb, #7c3aed); }

.stat .row {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.stat .label { margin: 0 0 6px 0; font-size: 12px; color: var(--muted); }
.stat .value { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.03em; }

.badge-mini {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.85);
  font-size: 12px;
  color: rgba(15, 23, 42, 0.85);
  white-space: nowrap;
}
.badge-mini .spark { width: 10px; height: 10px; border-radius: 999px; background: var(--grad); }

.panel { padding: 14px; }

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.panel-head h3 { margin: 0; font-size: 14px; }
.panel-head .right { display: flex; align-items: center; gap: 10px; color: var(--muted); font-size: 12px; }

.filters {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  gap: 10px;
  align-items: end;
}

label { display: block; font-size: 12px; color: var(--muted); margin: 0 0 6px 2px; }

.input {
  width: 100%;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.9);
  padding: 10px 12px;
  outline: none;
  transition: box-shadow 0.15s ease, border-color 0.15s ease;
}
.input:focus { box-shadow: var(--focus); border-color: rgba(124, 58, 237, 0.45); }

.actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px; }

.btn {
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.9);
  color: var(--text);
  border-radius: 14px;
  padding: 10px 12px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  user-select: none;
}
.btn:hover { transform: translateY(-1px); box-shadow: 0 14px 28px rgba(2, 6, 23, 0.08); }
.btn:active { transform: translateY(0); }

.btn.primary {
  border: none;
  color: white;
  background: var(--grad);
  box-shadow: 0 16px 32px rgba(124, 58, 237, 0.18);
}
.btn.ghost { background: rgba(2, 6, 23, 0.02); }

/* Tabs + right tools */
.tabs {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 10px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: var(--shadow-soft);
  margin: 14px 0 12px 0;
}

.tabs-left { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.tabs-right { margin-left: auto; display: flex; align-items: center; gap: 10px; }

.tab {
  padding: 10px 12px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: rgba(2, 6, 23, 0.02);
  color: rgba(15, 23, 42, 0.86);
  font-size: 13px;
  cursor: pointer;
  user-select: none;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.tab:hover { transform: translateY(-1px); box-shadow: 0 14px 28px rgba(2, 6, 23, 0.08); }
.tab.active {
  background: rgba(124, 58, 237, 0.12);
  border-color: rgba(124, 58, 237, 0.35);
  box-shadow: 0 14px 30px rgba(124, 58, 237, 0.12);
}

.count {
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--border);
  font-size: 12px;
  color: rgba(15, 23, 42, 0.82);
}

.select {
  border-radius: 999px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.92);
  padding: 10px 12px;
  font-size: 13px;
  outline: none;
  transition: box-shadow 0.15s ease, border-color 0.15s ease;
  cursor: pointer;
}
.select:focus { box-shadow: var(--focus); border-color: rgba(124, 58, 237, 0.45); }

.mini-label {
  font-size: 12px;
  color: var(--muted);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.table-wrap { overflow: hidden; }
table { width: 100%; border-collapse: separate; border-spacing: 0; }

thead th {
  text-align: left;
  font-size: 12px;
  color: var(--muted);
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.9);
}

tbody td {
  padding: 14px 14px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  font-size: 13px;
  vertical-align: middle;
}

tbody tr { transition: background 0.15s ease; }
tbody tr:nth-child(odd) { background: rgba(2, 6, 23, 0.012); }
tbody tr:nth-child(even) { background: rgba(255, 255, 255, 0.9); }
tbody tr:hover { background: rgba(124, 58, 237, 0.05); }

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New",
    monospace;
  font-size: 12px;
}

.sub { color: var(--muted); font-size: 12px; margin-top: 4px; }

.status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 999px;
  padding: 8px 10px;
  font-size: 12px;
  border: 1px solid var(--border);
  background: var(--chip-bg);
  white-space: nowrap;
}
.status .s-dot { width: 9px; height: 9px; border-radius: 999px; background: rgba(15, 23, 42, 0.25); }
.status.processing .s-dot { background: var(--warn); }
.status.paid .s-dot { background: var(--paid); }
.status.cancelled .s-dot { background: var(--danger); }
.status.expired .s-dot { background: #94a3b8; }

.money { font-weight: 800; letter-spacing: -0.01em; }

.table-actions { display: flex; justify-content: flex-end; gap: 8px; }

.icon-btn {
  width: 38px;
  height: 38px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.icon-btn:hover { transform: translateY(-1px); box-shadow: 0 14px 28px rgba(2, 6, 23, 0.08); }
.icon-btn:active { transform: translateY(0); }

/* Pagination */
.pager {
  margin-top: 12px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: var(--shadow-soft);
}
.pager-left { color: var(--muted); font-size: 12px; }

.pager-right { display: flex; align-items: center; gap: 8px; }

.page-btn {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.95);
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  user-select: none;
}
.page-btn:hover { transform: translateY(-1px); box-shadow: 0 14px 28px rgba(2, 6, 23, 0.08); }
.page-btn:active { transform: translateY(0); }

.page-num {
  min-width: 44px;
  height: 40px;
  padding: 0 12px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: rgba(2, 6, 23, 0.02);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 800;
}

.loading {
  display: none;
  align-items: center;
  gap: 10px;
  color: var(--muted);
  font-size: 12px;
}
.loading.show { display: inline-flex; }

.spinner {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  border: 2px solid rgba(15, 23, 42, 0.15);
  border-top-color: rgba(124, 58, 237, 0.8);
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.35);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
  z-index: 30;
}
.overlay.show { opacity: 1; pointer-events: auto; }

.drawer {
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  width: min(45%, 560px);
  max-width: 92vw;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-left: 1px solid var(--border);
  box-shadow: var(--shadow);
  transform: translateX(102%);
  transition: transform 0.26s cubic-bezier(0.2, 0.8, 0.2, 1);
  z-index: 35;
  display: flex;
  flex-direction: column;
}
.drawer.show { transform: translateX(0); }

.drawer-head {
  padding: 16px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.drawer-title { display: flex; flex-direction: column; gap: 2px; }
.drawer-title h4 { margin: 0; font-size: 14px; }
.drawer-title p { margin: 0; font-size: 12px; color: var(--muted); }

.drawer-body { padding: 16px; overflow: auto; }

.section {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: var(--shadow-soft);
  padding: 14px;
  margin-bottom: 12px;
}
.section h5 { margin: 0 0 10px 0; font-size: 13px; }

.kv { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

.kv .item {
  border: 1px solid rgba(15, 23, 42, 0.06);
  background: rgba(2, 6, 23, 0.02);
  border-radius: 14px;
  padding: 10px 12px;
}

.kv .k { font-size: 11px; color: var(--muted); margin-bottom: 6px; }
.kv .v { font-size: 13px; font-weight: 700; }

.products { display: grid; gap: 10px; }

.p-item {
  display: grid;
  grid-template-columns: 54px 1fr auto;
  gap: 10px;
  align-items: center;
  border: 1px solid rgba(15, 23, 42, 0.06);
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 10px;
}

.p-img {
  width: 54px;
  height: 54px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(2, 6, 23, 0.04);
}
.p-img img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.2s ease; }
.p-item:hover .p-img img { transform: scale(1.05); }

.p-name { font-weight: 800; font-size: 13px; margin: 0; }
.p-meta { font-size: 12px; color: var(--muted); margin-top: 4px; }

.p-right { text-align: right; }

.total-row { display: grid; gap: 8px; }

.line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  background: rgba(2, 6, 23, 0.02);
}
.line strong { font-size: 13px; }
.line .muted { font-size: 12px; color: var(--muted); }

.line.final {
  background: rgba(124, 58, 237, 0.08);
  border-color: rgba(124, 58, 237, 0.18);
}

.toast {
  position: fixed;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%) translateY(20px);
  opacity: 0;
  pointer-events: none;
  z-index: 60;
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

.toast .t-inner {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid var(--border);
  box-shadow: 0 18px 40px rgba(2, 6, 23, 0.14);
  font-size: 13px;
}

.t-icon {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: var(--grad);
  color: white;
  display: grid;
  place-items: center;
  font-size: 12px;
}

@media (max-width: 980px) {
  .stat { grid-column: span 6; }
  .filters { grid-template-columns: 1fr 1fr; }
  .actions { justify-content: stretch; flex-wrap: wrap; }
  .drawer { width: 92vw; }
  .tabs-right { width: 100%; justify-content: flex-end; }
}

@media (max-width: 560px) {
  .stat { grid-column: span 12; }
  .filters { grid-template-columns: 1fr; }
}
`;

const imgs = {
    serum: "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&w=200&q=70",
    sunscreen:
        "https://images.unsplash.com/photo-1620916566393-c52f8a4baf1b?auto=format&fit=crop&w=200&q=70",
    toner: "https://images.unsplash.com/photo-1612810430211-7b1b9ac2f1b5?auto=format&fit=crop&w=200&q=70",
    cream: "https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=200&q=70",
    mask: "https://images.unsplash.com/photo-1615396899839-c99c121e0b9d?auto=format&fit=crop&w=200&q=70",
    cleanser:
        "https://images.unsplash.com/photo-1619979427927-33a9f2e302d3?auto=format&fit=crop&w=200&q=70",
} as const;

function pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function item(name: string, sku: string, image: string, qty: number, price: number): OrderItem {
    return { name, sku, image, qty, price };
}

function sumQty(items: OrderItem[]) {
    return items.reduce((s, it) => s + it.qty, 0);
}

function money(v: number) {
    const n = Number(v || 0);
    return n.toLocaleString("vi-VN") + " ₫";
}

function fmtDate(yyyy_mm_dd: string) {
    const [y, m, d] = yyyy_mm_dd.split("-");
    return `${d}/${m}/${y}`;
}

function parseNumber(s: string) {
    if (!s) return NaN;
    const cleaned = String(s).replace(/[^\d]/g, "");
    if (!cleaned) return NaN;
    return Number(cleaned);
}

function mkOrder(
    code: string,
    customerName: string,
    customerEmail: string,
    createdDate: string,
    status: Order["status"],
    items: OrderItem[],
): Order {
    const subtotal = items.reduce((s, it) => s + it.qty * it.price, 0);
    const shipping = subtotal >= 500000 ? 0 : 25000;
    const discount = subtotal >= 700000 ? 50000 : 0;
    const total = Math.max(0, subtotal + shipping - discount);

    const paymentMethods = ["Chuyển khoản", "COD", "Ví điện tử"] as const;
    const branches = ["CN Quận 1", "CN Quận 7", "CN Thủ Đức", "CN Bình Thạnh"] as const;
    const staff = ["An", "Bình", "Châu", "Dũng", "Hạnh"] as const;

    const carriers = ["GHTK", "GHN", "Viettel Post", "J&T Express"] as const;

    const pm = pick(paymentMethods);
    const br = pick(branches);
    const st = pick(staff);
    const carrier = pick(carriers);

    // ✅ Shipping info (demo)
    const receiverName = customerName;
    const phones = ["0901 234 567", "0912 345 678", "0938 888 999", "0987 654 321"] as const;
    const wards = ["Phường 1", "Phường 7", "Phường Linh Trung", "Phường 13"] as const;
    const districts = ["Quận 1", "Quận 3", "Quận 7", "Thủ Đức", "Bình Thạnh"] as const;

    const shipMethod = pm; // demo: align payment method naming
    const trackingCode = status === "paid" ? "TRK-" + Math.floor(100000 + Math.random() * 900000) : null;

    const expectedDelivery = (() => {
        // demo: +2~4 days from createdAt
        const dt = new Date(createdDate + "T00:00:00");
        dt.setDate(dt.getDate() + (2 + Math.floor(Math.random() * 3)));
        const y = dt.getFullYear();
        const m = String(dt.getMonth() + 1).padStart(2, "0");
        const d = String(dt.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    })();

    return {
        id: Number(String(code).replace(/\D/g, "")) || Date.now(),
        code,
        status,
        createdAt: createdDate,
        customer: { name: customerName, email: customerEmail },
        branch: br,
        confirmedBy: status === "processing" ? null : st,
        payment: {
            method: pm,
            paidAt: status === "paid" ? createdDate : null,
            ref: status === "paid" ? "TX-" + Math.floor(100000 + Math.random() * 900000) : null,
        },
        items,
        pricing: { subtotal, shipping, discount, total },
        note:
            status === "processing"
                ? "Đơn mới tạo, chờ xác nhận tồn kho."
                : status === "paid"
                    ? "Đã thanh toán, chuẩn bị đóng gói."
                    : status === "cancelled"
                        ? "Khách yêu cầu hủy."
                        : "Đơn hết hạn thanh toán.",
        shippingInfo: {
            receiverName,
            phone: pick(phones),
            addressLine: `12 Nguyễn Huệ, ${pick(wards)}`,
            district: pick(districts),
            city: "TP. Hồ Chí Minh",
            method: shipMethod,
            carrier,
            trackingCode,
            note:
                status === "processing"
                    ? "Chưa bàn giao cho đơn vị vận chuyển."
                    : status === "paid"
                        ? "Đang đóng gói & sẵn sàng bàn giao."
                        : status === "cancelled"
                            ? "Đơn đã hủy, không tạo vận đơn."
                            : "Đơn hết hạn, không giao hàng.",
            expectedDelivery,
        },
    };
}

const initialOrders: Order[] = [];

function renderStatus(status: Order["status"]) {
    const map: Record<Order["status"], { cls: string; label: string }> = {
        processing: { cls: "processing", label: STATUS.processing.label },
        paid: { cls: "paid", label: STATUS.paid.label },
        cancelled: { cls: "cancelled", label: STATUS.cancelled.label },
        expired: { cls: "expired", label: STATUS.expired.label },
    };
    const x = map[status] ?? { cls: "", label: "—" };
    return (
        <span className={`status ${x.cls}`}>
      <span className="s-dot" />
      <span style={{ fontWeight: 800 }}>{x.label}</span>
    </span>
    );
}

export default function AdminOrdersDemo() {
    const [orders, setOrders] = useState<Order[]>(() => [...initialOrders]);

    // Filters
    const [activeStatus, setActiveStatus] = useState<StatusKey>("all");
    const [q, setQ] = useState("");
    const [fromDate, setFromDate] = useState("2026-02-01");
    const [toDate, setToDate] = useState("2026-02-28");
    const [minTotal, setMinTotal] = useState("");
    const [maxTotal, setMaxTotal] = useState("");

    // Pagination
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Drawer
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [activeOrderId, setActiveOrderId] = useState<number | null>(null);

    // Toast + Loading
    const [loading, setLoading] = useState(false);
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const toastTimer = useRef<number | null>(null);

    const activeOrder = useMemo(
        () => (activeOrderId ? orders.find((x) => x.id === activeOrderId) ?? null : null),
        [activeOrderId, orders],
    );

    const counts = useMemo(() => {
        return orders.reduce<Record<Order["status"], number>>(
            (acc, o) => {
                acc[o.status] = (acc[o.status] || 0) + 1;
                return acc;
            },
            { processing: 0, paid: 0, cancelled: 0, expired: 0 },
        );
    }, [orders]);

    const filtered = useMemo(() => {
        const query = (q || "").trim().toLowerCase();
        const fd = fromDate ? new Date(fromDate + "T00:00:00") : null;
        const td = toDate ? new Date(toDate + "T23:59:59") : null;
        const min = parseNumber(minTotal);
        const max = parseNumber(maxTotal);

        const rows = orders.filter((o) => {
            if (activeStatus !== "all" && o.status !== activeStatus) return false;

            if (query) {
                const hay = (o.code + " " + o.customer.name + " " + o.customer.email).toLowerCase();
                if (!hay.includes(query)) return false;
            }

            const created = new Date(o.createdAt + "T12:00:00");
            if (fd && created < fd) return false;
            if (td && created > td) return false;

            if (Number.isFinite(min) && o.pricing.total < min) return false;
            if (Number.isFinite(max) && o.pricing.total > max) return false;

            return true;
        });

        rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
        return rows;
    }, [orders, activeStatus, q, fromDate, toDate, minTotal, maxTotal]);

    // Stats computed from filtered (same behavior as HTML demo: stats follow current filtered list)
    const stats = useMemo(() => {
        const totalOrders = filtered.length;
        const paidOrders = filtered.filter((o) => o.status === "paid").length;

        const revenueThisMonth = filtered
            .filter((o) => o.status === "paid" && o.createdAt.slice(0, 7) === "2026-02")
            .reduce((s, o) => s + o.pricing.total, 0);

        const unitsSold = filtered.filter((o) => o.status === "paid").reduce((s, o) => s + sumQty(o.items), 0);

        const successRate = totalOrders ? Math.round((paidOrders / totalOrders) * 100) : 0;

        return { totalOrders, revenueThisMonth, unitsSold, successRate };
    }, [filtered]);

    const totalPages = useMemo(() => Math.max(1, Math.ceil(filtered.length / pageSize)), [filtered.length, pageSize]);

    const pageRows = useMemo(() => {
        const safePage = Math.min(Math.max(1, page), totalPages);
        const start = (safePage - 1) * pageSize;
        const end = start + pageSize;
        return filtered.slice(start, end);
    }, [filtered, page, pageSize, totalPages]);

    const fetchOrders = useCallback(async (showSuccessToast = false) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (activeStatus !== "all") params.set("status", activeStatus.toUpperCase());
            if (q.trim()) params.set("q", q.trim());
            const endpoint = params.toString()
                ? `/api/product-orders/admin/list?${params.toString()}`
                : "/api/product-orders/admin/list";
            const rows = await api<ApiOrder[]>(endpoint);
            setOrders(Array.isArray(rows) ? rows.map(mapOrder) : []);
            if (showSuccessToast) toast("Đã tải lại danh sách đơn hàng.");
        } catch (e) {
            toast("Không tải được danh sách đơn hàng.");
        } finally {
            setLoading(false);
        }
    }, [activeStatus, q]);

    useEffect(() => {
        fetchOrders(false);
    }, [fetchOrders]);

    useEffect(() => {
        // keep page in range when filters/pageSize change
        setPage((p) => Math.min(Math.max(1, p), totalPages));
    }, [totalPages]);

    useEffect(() => {
        return () => {
            if (toastTimer.current) window.clearTimeout(toastTimer.current);
        };
    }, []);

    function toast(msg: string) {
        setToastMsg(msg);
        if (toastTimer.current) window.clearTimeout(toastTimer.current);
        toastTimer.current = window.setTimeout(() => setToastMsg(null), 1600);
    }

    function applyFilters(withToast: boolean) {
        setPage(1);
        if (withToast) fetchOrders(true);
    }

    function resetFilters() {
        setQ("");
        setMinTotal("");
        setMaxTotal("");
        setFromDate("2026-02-01");
        setToDate("2026-02-28");
        setActiveStatus("all");
        setPage(1);
        fetchOrders(true);
    }

    function fakeRefresh() {
        fetchOrders(true);
    }

    function openDrawer(orderId: number) {
        setActiveOrderId(orderId);
        setDrawerOpen(true);
    }

    function closeDrawer() {
        setDrawerOpen(false);
    }

    async function markProcessing() {
        if (!activeOrder) return;
        try {
            await api(`/api/product-orders/admin/${activeOrder.id}/status`, {
                method: "PATCH",
                body: JSON.stringify({ status: "PROCESSING" }),
            });
            await fetchOrders(false);
            toast("Đã cập nhật trạng thái.");
            closeDrawer();
        } catch {
            toast("Không thể cập nhật trạng thái.");
        }
    }

    async function markPaid() {
        if (!activeOrder) return;
        try {
            await api(`/api/product-orders/admin/${activeOrder.id}/mark-paid`, { method: "POST" });
            await fetchOrders(false);
            toast("Đã cập nhật thanh toán.");
            closeDrawer();
        } catch {
            toast("Không thể xác nhận thanh toán.");
        }
    }

    // Pager text (same format)
    const pagerText = useMemo(() => {
        const total = filtered.length;
        const safePage = Math.min(Math.max(1, page), totalPages);
        const start = (safePage - 1) * pageSize;
        const end = start + pageSize;

        const showingFrom = total === 0 ? 0 : start + 1;
        const showingTo = Math.min(end, total);

        return `Hiển thị ${showingFrom}-${showingTo} / ${total} • Trang ${safePage}/${totalPages}`;
    }, [filtered.length, page, pageSize, totalPages]);

    // Keyboard ESC to close drawer (kept)
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeDrawer();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    const tabs = useMemo(
        () => [
            { key: "all" as const, label: STATUS.all.label, count: orders.length },
            { key: "processing" as const, label: STATUS.processing.label, count: counts.processing || 0 },
            { key: "paid" as const, label: STATUS.paid.label, count: counts.paid || 0 },
            { key: "cancelled" as const, label: STATUS.cancelled.label, count: counts.cancelled || 0 },
            { key: "expired" as const, label: STATUS.expired.label, count: counts.expired || 0 },
        ],
        [orders.length, counts],
    );

    useEffect(() => {
        if (drawerOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }

        return () => {
            document.body.style.overflow = "";
        };
    }, [drawerOpen]);

    return (
        <>
            {/* FontAwesome CDN */}
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
            <style>{CSS}</style>

            <div className="app">
                <div className="topbar">
                    <div className="topbar-inner">
                        <div className="brand">
                            <div className="logo">AO</div>
                            <div>
                                <h1>Admin • Quản lý đơn hàng</h1>
                                <p>Demo • filter + tab status + pagination + drawer chi tiết</p>
                            </div>
                        </div>
                        <div className="top-actions">
                            <div className={`loading ${loading ? "show" : ""}`} id="loading">
                                <div className="spinner"></div>
                                Đang tải dữ liệu...
                            </div>
                            <div className="pill" id="btnRefresh" title="Làm mới (demo)" onClick={fakeRefresh}>
                                <span className="dot"></span>
                                <span style={{ fontSize: 13, fontWeight: 700 }}>Refresh</span>
                                <i className="fa-solid fa-rotate-right" style={{ opacity: 0.7 }}></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container">
                    <div className="page-title">
                        <div>
                            <h2>Quản lý đơn hàng</h2>
                            <p className="hint">Tìm kiếm nhanh theo mã đơn / tên / email, lọc theo ngày và tổng tiền.</p>
                        </div>
                        <div
                            className="pill"
                            id="btnExport"
                            title="Demo export"
                            onClick={() => toast("Export demo: bạn có thể map sang CSV/Excel sau.")}
                        >
                            <i className="fa-solid fa-file-arrow-down" style={{ opacity: 0.85 }}></i>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>Export</span>
                        </div>
                    </div>

                    <div className="stats" id="stats">
                        <div className="card stat">
                            <div className="bg"></div>
                            <p className="label">Tổng đơn</p>
                            <div className="row">
                                <p className="value" id="statTotalOrders">
                                    {stats.totalOrders}
                                </p>
                                <span className="badge-mini">
                  <span className="spark"></span>Realtime
                </span>
                            </div>
                        </div>

                        <div className="card stat">
                            <div className="bg"></div>
                            <p className="label">Doanh thu tháng này</p>
                            <div className="row">
                                <p className="value" id="statRevenueThisMonth">
                                    {money(stats.revenueThisMonth)}
                                </p>
                                <span className="badge-mini">
                  <span className="spark"></span>VNĐ
                </span>
                            </div>
                        </div>

                        <div className="card stat">
                            <div className="bg"></div>
                            <p className="label">Tổng sản phẩm đã bán</p>
                            <div className="row">
                                <p className="value" id="statUnitsSold">
                                    {stats.unitsSold}
                                </p>
                                <span className="badge-mini">
                  <span className="spark"></span>Units
                </span>
                            </div>
                        </div>

                        <div className="card stat">
                            <div className="bg"></div>
                            <p className="label">Tỷ lệ đơn thành công</p>
                            <div className="row">
                                <p className="value" id="statSuccessRate">
                                    {stats.successRate}%
                                </p>
                                <span className="badge-mini">
                  <span className="spark"></span>Paid / Total
                </span>
                            </div>
                        </div>
                    </div>

                    <div className="card panel">
                        <div className="panel-head">
                            <h3>
                                <i className="fa-solid fa-filter" style={{ opacity: 0.8 }}></i> Bộ lọc
                            </h3>
                            <div className="right">
                                <span>Tip:</span>
                                <span>gõ “OD-” hoặc email để lọc nhanh</span>
                            </div>
                        </div>

                        <div className="filters">
                            <div>
                                <label>Tìm kiếm đơn (mã đơn, tên KH, email KH)</label>
                                <input
                                    className="input"
                                    id="q"
                                    placeholder="VD: OD-1007 / lan.nguyen / gmail.com"
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            applyFilters(true);
                                        }
                                    }}
                                />
                            </div>

                            <div>
                                <label>Từ ngày</label>
                                <input className="input" id="fromDate" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                            </div>

                            <div>
                                <label>Đến ngày</label>
                                <input className="input" id="toDate" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                            </div>

                            <div>
                                <label>Min tổng tiền</label>
                                <input
                                    className="input"
                                    id="minTotal"
                                    inputMode="numeric"
                                    placeholder="VD: 100000"
                                    value={minTotal}
                                    onChange={(e) => setMinTotal(e.target.value)}
                                />
                            </div>

                            <div>
                                <label>Max tổng tiền</label>
                                <input
                                    className="input"
                                    id="maxTotal"
                                    inputMode="numeric"
                                    placeholder="VD: 2000000"
                                    value={maxTotal}
                                    onChange={(e) => setMaxTotal(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="actions">
                            <button className="btn ghost" id="btnReset" onClick={resetFilters}>
                                <i className="fa-solid fa-eraser" style={{ opacity: 0.85 }}></i>
                                Reset
                            </button>
                            <button className="btn primary" id="btnApply" onClick={() => applyFilters(true)}>
                                <i className="fa-solid fa-magnifying-glass" style={{ opacity: 0.95 }}></i>
                                Áp dụng
                            </button>
                        </div>
                    </div>

                    <div className="tabs" id="tabs">
                        <div className="tabs-left" id="tabsLeft">
                            {tabs.map((t) => (
                                <div
                                    key={t.key}
                                    className={`tab ${t.key === activeStatus ? "active" : ""}`}
                                    data-tab={t.key}
                                    onClick={() => {
                                        setActiveStatus(t.key);
                                        setPage(1);
                                        // keep same behavior: "applyFilters(true)" on tab click
                                        toast(`Đã lọc: ${filtered.length} đơn`);
                                    }}
                                >
                                    <i className="fa-solid fa-layer-group" style={{ opacity: 0.75 }}></i>
                                    <span>{t.label}</span>
                                    <span className="count">{t.count}</span>
                                </div>
                            ))}
                        </div>

                        <div className="tabs-right">
              <span className="mini-label">
                <i className="fa-solid fa-list" style={{ opacity: 0.75 }}></i>
                Size/trang
              </span>
                            <select
                                className="select"
                                id="pageSize"
                                value={String(pageSize)}
                                onChange={(e) => {
                                    const next = Number(e.target.value || 10);
                                    setPageSize(next);
                                    setPage(1);
                                    toast(`Size/trang: ${next}`);
                                }}
                            >
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="20">20</option>
                            </select>
                        </div>
                    </div>

                    <div className="card table-wrap">
                        <table>
                            <thead>
                            <tr>
                                <th style={{ width: "16%" }}>Mã đơn</th>
                                <th style={{ width: "22%" }}>Khách hàng</th>
                                <th style={{ width: "18%" }}>Ngày tạo</th>
                                <th style={{ width: "16%" }}>Trạng thái</th>
                                <th style={{ width: "16%" }}>Tổng tiền</th>
                                <th style={{ width: "12%", textAlign: "right" }}>Hành động</th>
                            </tr>
                            </thead>

                            <tbody id="tbody">
                            {!pageRows.length ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: "26px 14px", color: "#64748b", background: "rgba(255,255,255,.9)" }}>
                                        Không có đơn phù hợp bộ lọc.
                                    </td>
                                </tr>
                            ) : (
                                pageRows.map((o) => {
                                    const created = fmtDate(o.createdAt);
                                    const total = money(o.pricing.total);
                                    return (
                                        <tr key={o.code}>
                                            <td>
                                                <div className="mono" style={{ fontWeight: 900 }}>
                                                    {o.code}
                                                </div>
                                                <div className="sub">Chi nhánh: {o.branch}</div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 800 }}>{o.customer.name}</div>
                                                <div className="sub">{o.customer.email}</div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 800 }}>{created}</div>
                                                <div className="sub">
                                                    {o.items.length} sản phẩm • {sumQty(o.items)} item(s)
                                                </div>
                                            </td>
                                            <td>{renderStatus(o.status)}</td>
                                            <td>
                                                <div className="money">{total}</div>
                                                <div className="sub">
                                                    {o.payment.method}
                                                    {o.payment.ref ? " • " + o.payment.ref : ""}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: "right" }}>
                                                <div className="table-actions">
                                                    <button className="icon-btn" title="Xem chi tiết" data-view={o.code} onClick={() => openDrawer(o.id)}>
                                                        <i className="fa-solid fa-eye"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                            </tbody>
                        </table>
                    </div>

                    <div className="pager" id="pager">
                        <div className="pager-left" id="pagerInfo">
                            {pagerText}
                        </div>
                        <div className="pager-right">
                            <button
                                className="page-btn"
                                id="btnPrev"
                                title="Trang trước"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                style={{
                                    opacity: page <= 1 ? 0.5 : 1,
                                    cursor: page <= 1 ? "not-allowed" : "pointer",
                                }}
                            >
                                <i className="fa-solid fa-chevron-left"></i>
                            </button>

                            <span className="page-num" id="pageNum">
                {Math.min(Math.max(1, page), totalPages)}
              </span>

                            <button
                                className="page-btn"
                                id="btnNext"
                                title="Trang sau"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                style={{
                                    opacity: page >= totalPages ? 0.5 : 1,
                                    cursor: page >= totalPages ? "not-allowed" : "pointer",
                                }}
                            >
                                <i className="fa-solid fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div className={`overlay ${drawerOpen ? "show" : ""}`} id="overlay" onClick={closeDrawer}></div>

                <aside className={`drawer ${drawerOpen ? "show" : ""}`} id="drawer" aria-hidden={!drawerOpen}>
                    <div className="drawer-head">
                        <div className="drawer-title">
                            <h4 id="dTitle">Chi tiết • {activeOrder?.code ?? "—"}</h4>
                            <p id="dSub">
                                {activeOrder ? `${activeOrder.customer.name} • ${activeOrder.customer.email}` : "—"}
                            </p>
                        </div>
                        <button className="icon-btn" id="btnClose" title="Đóng" onClick={closeDrawer}>
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    <div className="drawer-body" id="drawerBody">
                        {!activeOrder ? null : (
                            <>
                                <div className="section">
                                    <h5>
                                        <i className="fa-solid fa-receipt" style={{ opacity: 0.8 }}></i> Thông tin đơn
                                    </h5>
                                    <div className="kv">
                                        <div className="item">
                                            <div className="k">Trạng thái</div>
                                            <div className="v">{STATUS[activeOrder.status]?.label || "—"}</div>
                                        </div>
                                        <div className="item">
                                            <div className="k">Ngày tạo</div>
                                            <div className="v">{fmtDate(activeOrder.createdAt)}</div>
                                        </div>
                                        <div className="item">
                                            <div className="k">Chi nhánh</div>
                                            <div className="v">{activeOrder.branch}</div>
                                        </div>
                                        <div className="item">
                                            <div className="k">Nhân viên xác nhận</div>
                                            <div className="v">{activeOrder.confirmedBy || "—"}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="section">
                                    <h5>
                                        <i className="fa-solid fa-credit-card" style={{ opacity: 0.8 }}></i> Thanh toán
                                    </h5>
                                    <div className="kv">
                                        <div className="item">
                                            <div className="k">Phương thức</div>
                                            <div className="v">{activeOrder.payment.method}</div>
                                        </div>
                                        <div className="item">
                                            <div className="k">Mã giao dịch</div>
                                            <div className="v">{activeOrder.payment.ref || "—"}</div>
                                        </div>
                                        <div className="item">
                                            <div className="k">Ngày thanh toán</div>
                                            <div className="v">{activeOrder.payment.paidAt ? fmtDate(activeOrder.payment.paidAt) : "—"}</div>
                                        </div>
                                        <div className="item">
                                            <div className="k">Ghi chú</div>
                                            <div className="v">{activeOrder.note}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* ✅ NEW: Shipping section (added per request) */}
                                <div className="section">
                                    <h5>
                                        <i className="fa-solid fa-truck-fast" style={{ opacity: 0.8 }}></i> Giao hàng
                                    </h5>
                                    <div className="kv">
                                        <div className="item">
                                            <div className="k">Người nhận</div>
                                            <div className="v">{activeOrder.shippingInfo.receiverName}</div>
                                        </div>
                                        <div className="item">
                                            <div className="k">SĐT</div>
                                            <div className="v">{activeOrder.shippingInfo.phone}</div>
                                        </div>
                                        <div className="item">
                                            <div className="k">Địa chỉ</div>
                                            <div className="v">
                                                {activeOrder.shippingInfo.addressLine}, {activeOrder.shippingInfo.district}, {activeOrder.shippingInfo.city}
                                            </div>
                                        </div>
                                        <div className="item">
                                            <div className="k">Đơn vị vận chuyển</div>
                                            <div className="v">{activeOrder.shippingInfo.carrier}</div>
                                        </div>
                                        <div className="item">
                                            <div className="k">Mã vận đơn</div>
                                            <div className="v">{activeOrder.shippingInfo.trackingCode || "—"}</div>
                                        </div>
                                        <div className="item">
                                            <div className="k">Dự kiến giao</div>
                                            <div className="v">{fmtDate(activeOrder.shippingInfo.expectedDelivery)}</div>
                                        </div>
                                        <div className="item" style={{ gridColumn: "1 / -1" }}>
                                            <div className="k">Ghi chú giao hàng</div>
                                            <div className="v">{activeOrder.shippingInfo.note}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="section">
                                    <h5>
                                        <i className="fa-solid fa-bag-shopping" style={{ opacity: 0.8 }}></i> Sản phẩm
                                    </h5>
                                    <div className="products">
                                        {activeOrder.items.map((it, idx) => (
                                            <div className="p-item" key={idx}>
                                                <div className="p-img">
                                                    <img src={it.image} alt={it.name} />
                                                </div>
                                                <div>
                                                    <p className="p-name">{it.name}</p>
                                                    <div className="p-meta mono">
                                                        {it.sku} • SL: {it.qty}
                                                    </div>
                                                </div>
                                                <div className="p-right">
                                                    <div className="money">{money(it.price * it.qty)}</div>
                                                    <div className="p-meta">{money(it.price)} / sp</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="section">
                                    <h5>
                                        <i className="fa-solid fa-calculator" style={{ opacity: 0.8 }}></i> Tổng kết
                                    </h5>
                                    <div className="total-row">
                                        <div className="line">
                                            <span className="muted">Tạm tính</span>
                                            <strong>{money(activeOrder.pricing.subtotal)}</strong>
                                        </div>
                                        <div className="line">
                                            <span className="muted">Phí ship</span>
                                            <strong>{money(activeOrder.pricing.shipping)}</strong>
                                        </div>
                                        <div className="line">
                                            <span className="muted">Giảm giá</span>
                                            <strong>-{money(activeOrder.pricing.discount)}</strong>
                                        </div>
                                        <div className="line final">
                                            <span className="muted">Tổng thanh toán</span>
                                            <strong>{money(activeOrder.pricing.total)}</strong>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: "flex", gap: 10, paddingBottom: 8, flexWrap: "wrap" }}>
                                    <button className="btn ghost" id="btnMarkProcessing" onClick={markProcessing}>
                                        <i className="fa-solid fa-clock" style={{ opacity: 0.85 }}></i>
                                        Chuyển “Chờ xử lý”
                                    </button>
                                    <button className="btn primary" id="btnMarkPaid" onClick={markPaid}>
                                        <i className="fa-solid fa-circle-check" style={{ opacity: 0.95 }}></i>
                                        Đánh dấu “Đã thanh toán”
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </aside>

                <div className={`toast ${toastMsg ? "show" : ""}`} id="toast">
                    <div className="t-inner">
                        <div className="t-icon">
                            <i className="fa-solid fa-bolt"></i>
                        </div>
                        <div id="toastText">{toastMsg ?? "—"}</div>
                    </div>
                </div>
            </div>
        </>
    );
}

