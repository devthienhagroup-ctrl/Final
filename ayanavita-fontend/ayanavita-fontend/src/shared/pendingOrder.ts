const KEY_PREFIX = "AYA_PENDING_ORDER_V1:";

export type PendingOrder = {
  orderId: number;
  createdAt: string; // ISO
};

export function getPendingOrder(courseId: number): PendingOrder | null {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + String(courseId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.orderId) return null;
    return parsed as PendingOrder;
  } catch {
    return null;
  }
}

export function setPendingOrder(courseId: number, po: PendingOrder) {
  localStorage.setItem(KEY_PREFIX + String(courseId), JSON.stringify(po));
}

export function clearPendingOrder(courseId: number) {
  localStorage.removeItem(KEY_PREFIX + String(courseId));
}
