// src/contexts/CartContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { http } from "../api/http";
import { getAuth } from "../services/auth.storage";

export type CartItem = {
  itemId?: string | number; // id CartDetail trên server (nếu có)
  productId: string | number;
  name: string;
  price: number;
  image?: string | null;
  quantity: number;
};

export type AddToCartPayload = {
  productId: string | number;
  quantity?: number;
  // guest mode cần các field này để hiển thị ngay (nếu không có thì sẽ để rỗng/0)
  name?: string;
  price?: number;
  image?: string | null;
};

type CartContextValue = {
  items: CartItem[];
  subtotal: number;
  totalItems: number;
  loading: boolean;
  isAuthenticated: boolean;

  refresh: () => Promise<void>;
  addItem: (p: AddToCartPayload) => Promise<void>;
  updateQuantity: (itemIdOrProductId: string | number, nextQty: number) => Promise<void>;
  removeItem: (itemIdOrProductId: string | number) => Promise<void>;
  clear: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

const LS_GUEST_CART_KEY = "ayanavita_guest_cart_v1";

function readGuestCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(LS_GUEST_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((x) => ({
        itemId: x.itemId,
        productId: x.productId,
        name: String(x.name ?? ""),
        price: Number(x.price ?? 0),
        image: x.image ?? null,
        quantity: Math.max(1, Number(x.quantity ?? 1)),
      }))
      .filter((x) => x.productId !== undefined && x.productId !== null);
  } catch {
    return [];
  }
}

function writeGuestCart(items: CartItem[]) {
  localStorage.setItem(LS_GUEST_CART_KEY, JSON.stringify(items));
}

function getAuthTokenMaybe(): string | null {
  try {
    const a: any = getAuth?.();
    const token = a?.token || a?.accessToken || a?.jwt || null;
    return token ? String(token) : null;
  } catch {
    return null;
  }
}

function normalizeServerItems(data: any): CartItem[] {
  const arr =
    data?.items ??
    data?.cartItems ??
    data?.data?.items ??
    data?.data?.cartItems ??
    data?.cart?.items ??
    [];

  if (!Array.isArray(arr)) return [];

  return arr.map((x: any) => {
    const product = x.product ?? x.productInfo ?? x.p ?? null;
    return {
      itemId: x.itemId ?? x.id ?? x.cartDetailId ?? x.detailId,
      productId: x.productId ?? product?.id ?? product?._id,
      name: x.name ?? product?.name ?? "",
      price: Number(x.price ?? product?.price ?? 0),
      image: x.image ?? product?.image ?? product?.img ?? null,
      quantity: Number(x.quantity ?? x.qty ?? 1),
    } as CartItem;
  });
}

/**
 * === API CONTRACT (FE giả định) ===
 * GET    /cart                      -> { items: CartItemLike[] }
 * POST   /cart/items                body { productId, quantity } -> { items: ... }
 * PATCH  /cart/items/:itemId        body { quantity } -> { items: ... }
 * DELETE /cart/items/:itemId        -> { items: ... }
 * DELETE /cart                      -> { items: [] }
 * POST   /cart/merge                body { items: [{productId, quantity}] } -> { items: ... }
 *
 * Nếu BE bạn đặt route khác, đổi ở các hàm call bên dưới là xong.
 */
async function apiGetCart() {
  const res = await http.get("/cart");
  return normalizeServerItems(res.data);
}
async function apiAddItem(productId: any, quantity: number) {
  const res = await http.post("/cart/items", { productId, quantity });
  return normalizeServerItems(res.data);
}
async function apiUpdateQty(itemId: any, quantity: number) {
  const res = await http.patch(`/cart/items/${itemId}`, { quantity });
  return normalizeServerItems(res.data);
}
async function apiRemove(itemId: any) {
  const res = await http.delete(`/cart/items/${itemId}`);
  return normalizeServerItems(res.data);
}
async function apiClear() {
  const res = await http.delete("/cart");
  return normalizeServerItems(res.data);
}
async function apiMerge(guestItems: Array<{ productId: any; quantity: number }>) {
  const res = await http.post("/cart/merge", { items: guestItems });
  return normalizeServerItems(res.data);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const tokenRef = useRef<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const subtotal = useMemo(() => items.reduce((s, x) => s + x.price * x.quantity, 0), [items]);
  const totalItems = useMemo(() => items.reduce((s, x) => s + x.quantity, 0), [items]);

  // Theo dõi auth thay đổi qua localStorage (đủ dùng cho FE)
  useEffect(() => {
    const syncAuth = () => {
      const t = getAuthTokenMaybe();
      tokenRef.current = t;
      setIsAuthenticated(Boolean(t));
    };
    syncAuth();

    const onStorage = (e: StorageEvent) => {
      // auth.storage của bạn có thể dùng key khác; check "auth" là phổ biến
      if (!e.key) return;
      if (e.key.toLowerCase().includes("auth") || e.key.toLowerCase().includes("token")) {
        syncAuth();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  async function refresh() {
    setLoading(true);
    try {
      if (!tokenRef.current) {
        const guest = readGuestCart();
        setItems(guest);
        return;
      }

      // Logged in: lấy cart từ server
      const serverItems = await apiGetCart();
      setItems(serverItems);
    } catch (err) {
      // fallback an toàn
      const guest = readGuestCart();
      setItems(guest);
      console.error("Cart refresh failed, fallback to guest cart:", err);
    } finally {
      setLoading(false);
    }
  }

  // Load lần đầu + xử lý merge khi vừa login
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const token = tokenRef.current;

        if (!token) {
          setItems(readGuestCart());
          return;
        }

        // Nếu có guest cart -> merge lên server rồi xoá guest
        const guest = readGuestCart();
        if (guest.length) {
          const payload = guest.map((x) => ({ productId: x.productId, quantity: x.quantity }));
          try {
            const merged = await apiMerge(payload);
            setItems(merged);
            writeGuestCart([]); // clear guest
            return;
          } catch (e) {
            // Nếu BE chưa có /cart/merge -> fallback add từng item
            try {
              let cur = await apiGetCart();
              for (const g of payload) {
                cur = await apiAddItem(g.productId, g.quantity);
              }
              setItems(cur);
              writeGuestCart([]);
              return;
            } catch (e2) {
              console.error("Merge fallback failed:", e2);
            }
          }
        }

        // Không có guest hoặc merge xong -> chỉ load server
        const serverItems = await apiGetCart();
        setItems(serverItems);
      } catch (err) {
        setItems(readGuestCart());
        console.error("Initial cart load failed, fallback to guest:", err);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  async function addItem(p: AddToCartPayload) {
    const qty = Math.max(1, Number(p.quantity ?? 1));

    // Guest mode
    if (!tokenRef.current) {
      const cur = readGuestCart();
      const idx = cur.findIndex((x) => String(x.productId) === String(p.productId));
      let next: CartItem[];

      if (idx >= 0) {
        next = cur.map((x, i) => (i === idx ? { ...x, quantity: x.quantity + qty } : x));
      } else {
        next = [
          ...cur,
          {
            productId: p.productId,
            name: String(p.name ?? ""),
            price: Number(p.price ?? 0),
            image: p.image ?? null,
            quantity: qty,
          },
        ];
      }

      writeGuestCart(next);
      setItems(next);
      return;
    }

    // Auth mode
    setLoading(true);
    try {
      const next = await apiAddItem(p.productId, qty);
      setItems(next);
    } catch (err) {
      console.error("Add item failed:", err);
    } finally {
      setLoading(false);
    }
  }

  function resolveServerItemId(itemIdOrProductId: string | number): string | number {
    // Nếu truyền itemId thật thì dùng luôn; nếu truyền productId thì tìm ra itemId
    const found =
      items.find((x) => String(x.itemId) === String(itemIdOrProductId)) ||
      items.find((x) => String(x.productId) === String(itemIdOrProductId));
    return (found?.itemId ?? itemIdOrProductId) as any;
  }

  async function updateQuantity(itemIdOrProductId: string | number, nextQty: number) {
    const qty = Math.max(0, Number(nextQty));

    // Guest
    if (!tokenRef.current) {
      const cur = readGuestCart();
      const next =
        qty <= 0
          ? cur.filter((x) => String(x.productId) !== String(itemIdOrProductId))
          : cur.map((x) =>
              String(x.productId) === String(itemIdOrProductId) ? { ...x, quantity: qty } : x
            );

      writeGuestCart(next);
      setItems(next);
      return;
    }

    // Auth
    setLoading(true);
    try {
      if (qty <= 0) {
        await removeItem(itemIdOrProductId);
        return;
      }
      const itemId = resolveServerItemId(itemIdOrProductId);
      const next = await apiUpdateQty(itemId, qty);
      setItems(next);
    } catch (err) {
      console.error("Update quantity failed:", err);
    } finally {
      setLoading(false);
    }
  }

  async function removeItem(itemIdOrProductId: string | number) {
    // Guest
    if (!tokenRef.current) {
      const cur = readGuestCart();
      const next = cur.filter((x) => String(x.productId) !== String(itemIdOrProductId));
      writeGuestCart(next);
      setItems(next);
      return;
    }

    // Auth
    setLoading(true);
    try {
      const itemId = resolveServerItemId(itemIdOrProductId);
      const next = await apiRemove(itemId);
      setItems(next);
    } catch (err) {
      console.error("Remove item failed:", err);
    } finally {
      setLoading(false);
    }
  }

  async function clear() {
    // Guest
    if (!tokenRef.current) {
      writeGuestCart([]);
      setItems([]);
      return;
    }

    // Auth
    setLoading(true);
    try {
      const next = await apiClear();
      setItems(next);
    } catch (err) {
      console.error("Clear cart failed:", err);
    } finally {
      setLoading(false);
    }
  }

  const value: CartContextValue = {
    items,
    subtotal,
    totalItems,
    loading,
    isAuthenticated,
    refresh,
    addItem,
    updateQuantity,
    removeItem,
    clear,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider />");
  return ctx;
}