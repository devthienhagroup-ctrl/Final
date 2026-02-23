// src/api/orders.api.ts
import { get, post } from "./http";

export type OrderStatus = "PENDING" | "PAID" | "CANCELLED";

export type OrderItem = {
  id: number;
  courseId: number;
  price: number;
  courseTitle: string;
  course?: { id: number; title: string; slug: string; price: number };
};

// Dùng chung cho cả Admin & My Orders (backend bạn trả gần giống nhau)
export type Order = {
  id: number;
  code: string;
  status: OrderStatus;
  currency: string;
  subtotal: number;
  discount: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];

  // Admin list có thêm user
  user?: { id: number; email: string; name?: string | null };
};

// Alias để MyOrdersPage import theo tên MyOrder nếu bạn muốn
export type MyOrder = Order;

export const ordersApi = {
  /**
   * USER: POST /courses/:id/order
   * Tạo order cho course -> thường trả status=PENDING
   */
  create(courseId: number) {
    return post<Order>(`/courses/${courseId}/order`, {}, { auth: true });
  },

  /**
   * USER: GET /me/orders
   */
  myOrders() {
    return get<MyOrder[]>("/me/orders", { auth: true });
  },

  /**
   * ADMIN: GET /orders?status=&q=
   */
  list(params?: { status?: OrderStatus | "ALL"; q?: string }) {
    const qs = new URLSearchParams();
    if (params?.status && params.status !== "ALL") qs.set("status", params.status);
    if (params?.q) qs.set("q", params.q);

    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return get<Order[]>(`/orders${suffix}`, { auth: true });
  },

  /**
   * ADMIN: POST /orders/:id/mark-paid
   */
  markPaid(orderId: number) {
    return post<{ ok: boolean }>(`/orders/${orderId}/mark-paid`, {}, { auth: true });
  },
};
