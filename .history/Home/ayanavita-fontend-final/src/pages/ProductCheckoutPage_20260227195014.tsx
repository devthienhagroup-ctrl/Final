// src/services/productCheckout.utils.ts
import type { ProductCartItem } from "./productCart.utils";
import type { ProductSku } from "../data/products.data";
import { PRODUCTS } from "../data/products.data";

export type ShippingMethod = "standard" | "fast";
export type PayMethod = "card" | "bank" | "wallet";

export type CheckoutDraft = {
  name: string;
  phone: string;
  email: string;
  addr: string;
  city: string;
  district: string;
  note: string;
  shipping: ShippingMethod;
  payMethod: PayMethod;
  voucherCode: string; // "AYA10" | "FREESHIP" | ""
};

export type OrderItem = {
  sku: ProductSku;
  productId: string;
  name: string;
  price: number;
  qty: number;
};

export type Order = {
  id: string;
  code: string;
  createdAt: string;
  customer: Omit<CheckoutDraft, "shipping" | "payMethod" | "voucherCode">;
  shipping: ShippingMethod;
  payMethod: PayMethod;
  voucherCode: string;
  subtotal: number;
  discount: number;
  shipFee: number;
  total: number;
  payStatus: "PAID" | "PENDING";
  items: OrderItem[];
};

export const CHECKOUT_DRAFT_KEY = "aya_product_checkout_draft_v1";
export const PRODUCT_ORDERS_KEY = "aya_product_orders_v1";

export const COUPONS = {
  AYA10: { type: "percent" as const, value: 10, note: "Giảm 10% cho đơn hàng." },
  FREESHIP: { type: "freeship" as const, value: 0, note: "Miễn phí ship (demo)." },
};

export function fmtOrderCode() {
  return "AYA-" + Math.random().toString(16).slice(2, 8).toUpperCase();
}
export function uid(prefix = "ORD") {
  return `${prefix}-${Math.random().toString(16).slice(2, 10).toUpperCase()}`;
}

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function readCheckoutDraft(): CheckoutDraft {
  if (typeof window === "undefined") {
    return {
      name: "",
      phone: "",
      email: "",
      addr: "",
      city: "",
      district: "",
      note: "",
      shipping: "standard",
      payMethod: "card",
      voucherCode: "",
    };
  }
  const d = safeParse<Partial<CheckoutDraft>>(localStorage.getItem(CHECKOUT_DRAFT_KEY), {});
  return {
    name: d.name || "",
    phone: d.phone || "",
    email: d.email || "",
    addr: d.addr || "",
    city: d.city || "",
    district: d.district || "",
    note: d.note || "",
    shipping: d.shipping || "standard",
    payMethod: d.payMethod || "card",
    voucherCode: d.voucherCode || "",
  };
}

export function writeCheckoutDraft(d: CheckoutDraft) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(d));
}

export function readOrders(): Order[] {
  if (typeof window === "undefined") return [];
  return safeParse<Order[]>(localStorage.getItem(PRODUCT_ORDERS_KEY), []);
}

export function writeOrders(list: Order[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PRODUCT_ORDERS_KEY, JSON.stringify(list));
}

export function buildOrderItems(cart: ProductCartItem[]): OrderItem[] {
  const items: OrderItem[] = [];
  for (const it of cart) {
    const p = (PRODUCTS as any)[it.sku];
    if (!p) continue;
    items.push({
      sku: it.sku,
      productId: p.id,
      name: p.name,
      price: Number(p.price || 0),
      qty: Number(it.qty || 1),
    });
  }
  return items;
}

export function calcSubtotal(items: OrderItem[]) {
  return items.reduce((s, x) => s + x.price * x.qty, 0);
}

export function calcDiscount(subtotal: number, voucherCode: string) {
  const code = (voucherCode || "").trim().toUpperCase();
  if (code === "AYA10") return Math.round(subtotal * 0.1);
  return 0;
}

export function calcShipFee(subtotal: number, shipping: ShippingMethod, voucherCode: string) {
  const code = (voucherCode || "").trim().toUpperCase();
  const freeByThreshold = subtotal >= 1_000_000;
  if (code === "FREESHIP") return 0;
  if (freeByThreshold) return 0;
  if (!subtotal) return 0;
  return shipping === "fast" ? 60_000 : 30_000;
}

export function calcTotal(subtotal: number, discount: number, shipFee: number) {
  return Math.max(0, subtotal - discount) + shipFee;
}

export function payStatusByMethod(payMethod: PayMethod): Order["payStatus"] {
  if (payMethod === "bank") return "PENDING";
  return "PAID";
}
