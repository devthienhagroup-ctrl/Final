export type ShippingType = "standard" | "fast";
export type PayMethod = "card" | "bank" | "wallet";

export type CartItem = {
  id: string;        // CI-xx
  productId: string; // P-xxxx
  name: string;
  sku: string;
  price: number;
  qty: number;
  img: string;
};

export type CustomerDraft = {
  name: string;
  phone: string;
  email: string;
  addr: string;
  city: string;
  district: string;
  note: string;
};

export type VoucherState = {
  code: string;
  discount: number;   // percent 0..1
  freeShip: boolean;
};

export type Order = {
  id: string;
  code: string;
  createdAt: string;

  customer: CustomerDraft;
  items: Array<{
    productId: string;
    name: string;
    sku: string;
    price: number;
    qty: number;
  }>;

  shipping: ShippingType;
  payMethod: PayMethod;
  voucher: VoucherState;

  subtotal: number;
  discount: number;
  shipFee: number;
  total: number;

  payStatus: "Đã thanh toán" | "Chờ thanh toán";
};

export type CheckoutState = {
  cart: CartItem[];
  customerDraft: CustomerDraft | null;
  shipping: ShippingType;
  payMethod: PayMethod;
  voucher: VoucherState;
  orders: Order[];
};

export const CHECKOUT_KEY = "aya_checkout_v1";
export const PRODUCT_DETAIL_KEY = "aya_product_detail_v1"; // optional import

function deepClone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T;
}

export function uid(prefix = "ID") {
  return `${prefix}-${Math.random().toString(16).slice(2, 8).toUpperCase()}`;
}

export function defaultCheckoutState(): CheckoutState {
  return {
    cart: [
      {
        id: "CI-01",
        productId: "P-1001",
        name: "Serum Phục Hồi AYANAVITA",
        sku: "AYA-SER-15",
        price: 590000,
        qty: 1,
        img: "https://images.unsplash.com/photo-1612810436541-336d31f6e5f4?auto=format&fit=crop&w=1200&q=80",
      },
      {
        id: "CI-02",
        productId: "P-1004",
        name: "Kem Dưỡng Khoá Ẩm & Phục Hồi",
        sku: "AYA-MOI-02",
        price: 450000,
        qty: 1,
        img: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80",
      },
    ],
    customerDraft: null,
    shipping: "standard",
    payMethod: "card",
    voucher: { code: "", discount: 0, freeShip: false },
    orders: [],
  };
}

export function loadCheckoutState(): CheckoutState {
  if (typeof window === "undefined") return defaultCheckoutState();

  const base = defaultCheckoutState();

  // 1) load from CHECKOUT_KEY
  try {
    const raw = localStorage.getItem(CHECKOUT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CheckoutState>;
      Object.assign(base, parsed);
    }
  } catch {
    // ignore
  }

  // 2) optional import from PRODUCT_DETAIL_KEY (giống HTML)
  try {
    const pdRaw = localStorage.getItem(PRODUCT_DETAIL_KEY);
    const pd = pdRaw ? (JSON.parse(pdRaw) as any) : null;

    if (pd?.cart?.length) {
      const map: Record<
        string,
        { name: string; sku: string; price: number; img: string }
      > = {
        "P-1001": {
          name: "Serum Phục Hồi AYANAVITA",
          sku: "AYA-SER-15",
          price: 590000,
          img: "https://images.unsplash.com/photo-1612810436541-336d31f6e5f4?auto=format&fit=crop&w=1200&q=80",
        },
        "P-1002": {
          name: "Sunscreen Bảo Vệ Sau Chăm Sóc",
          sku: "AYA-SUN-50",
          price: 390000,
          img: "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&w=1200&q=80",
        },
        "P-1003": {
          name: "Cleanser Làm Sạch Dịu Nhẹ",
          sku: "AYA-CLN-01",
          price: 290000,
          img: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=1200&q=80",
        },
        "P-1004": {
          name: "Kem Dưỡng Khoá Ẩm & Phục Hồi",
          sku: "AYA-MOI-02",
          price: 450000,
          img: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80",
        },
      };

      const imported = (pd.cart as Array<{ productId: string; qty: number }>)
        .map((i) => {
          const m = map[i.productId];
          if (!m) return null;
          return {
            id: uid("CI"),
            productId: i.productId,
            name: m.name,
            sku: m.sku,
            price: m.price,
            img: m.img,
            qty: Math.max(1, Number(i.qty || 1)),
          };
        })
        .filter(Boolean);

      if (imported.length) base.cart = imported as CartItem[];
    }
  } catch {
    // ignore
  }

  return deepClone(base);
}

export function saveCheckoutState(state: CheckoutState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHECKOUT_KEY, JSON.stringify(state));
}
