// src/pages/CartPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { SiteHeader } from "../components/layout/SiteHeader";
import { Footer } from "../components/layout/Footer";

import {
  PRODUCTS,
  PRODUCT_CART_SEED,
  UPSELL,
  type ProductSku,
} from "../data/products.data";

import { money } from "../services/booking.utils";
import {
  ensureProductCartSeed,
  readProductCart,
  writeProductCart,
  addProductToCart,
  incProductQty,
  decProductQty,
  removeProductFromCart,
  clearProductCart,
  type ProductCartItem,
} from "../services/productCart.utils";

type CouponCode = "AYA10" | "FREESHIP" | null;

const COUPONS: Record<
  Exclude<CouponCode, null>,
  { type: "percent" | "fixed" | "freeship"; value: number; note: string }
> = {
  AYA10: { type: "percent", value: 10, note: "Giảm 10% cho đơn hàng." },
  FREESHIP: { type: "freeship", value: 0, note: "Miễn phí ship (demo)." },
};

type Product = (typeof PRODUCTS)[keyof typeof PRODUCTS];

export default function CartPage() {
  // 1) init từ local (seed nếu rỗng)
  const [cart, setCart] = useState<ProductCartItem[]>(() =>
    ensureProductCartSeed(PRODUCT_CART_SEED as any)
  );

  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<CouponCode>(null);
  const [couponNote, setCouponNote] = useState("");

  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [shipBaseFee, setShipBaseFee] = useState(0);
  const [shipNote, setShipNote] = useState("");

  // 2) sync helper — 1 đường duy nhất để persist
  function sync(next: ProductCartItem[]) {
    setCart(next);
    writeProductCart(next);
  }

  // 3) auto sync khi localStorage thay đổi (tab khác / page khác)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      // Nếu utils của bạn dùng key khác, storage event vẫn bắn.
      // Cách an toàn nhất: cứ đọc lại cart khi có change.
      if (!e.key) return;
      try {
        const next = readProductCart();
        setCart(next);
      } catch {
        // ignore
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // 4) derived items
  const items = useMemo(() => {
    return cart
      .map((it) => {
        const p = (PRODUCTS as any)[it.sku] as Product | undefined;
        if (!p) return null;
        return { ...it, product: p, line: p.price * it.qty };
      })
      .filter(Boolean) as Array<ProductCartItem & { product: Product; line: number }>;
  }, [cart]);

  const subTotal = useMemo(() => items.reduce((s, x) => s + x.line, 0), [items]);

  const discountValue = useMemo(() => {
    if (!coupon) return 0;
    const c = COUPONS[coupon];
    if (c.type === "percent") return Math.round(subTotal * (c.value / 100));
    if (c.type === "fixed") return Math.min(subTotal, c.value);
    return 0;
  }, [coupon, subTotal]);

  const shipping = useMemo(() => {
    if (!subTotal) return 0;
    if (coupon === "FREESHIP") return 0;
    return shipBaseFee;
  }, [coupon, shipBaseFee, subTotal]);

  const grandTotal = useMemo(
    () => Math.max(0, subTotal - discountValue) + shipping,
    [subTotal, discountValue, shipping]
  );

  // ===== actions: luôn sync() =====
  function onInc(sku: ProductSku) {
    const next = incProductQty(sku);
    sync(next);
  }

  function onDec(sku: ProductSku) {
    const next = decProductQty(sku);
    sync(next);
  }

  function onDel(sku: ProductSku) {
    const next = removeProductFromCart(sku);
    sync(next);
  }

  function onUpsellAdd(sku: ProductSku) {
    const next = addProductToCart(sku, 1);
    sync(next);
    window.alert("Đã thêm vào giỏ (demo).");
  }

  function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    setCoupon(null);

    if (!code) {
      setCouponNote("Nhập mã voucher để áp dụng.");
      return;
    }
    if (code !== "AYA10" && code !== "FREESHIP") {
      setCouponNote("Voucher không hợp lệ (demo).");
      return;
    }

    setCoupon(code as CouponCode);
    setCouponNote(COUPONS[code as "AYA10" | "FREESHIP"].note);

    // QoL: nếu FREESHIP thì note ship rõ ràng
    if (code === "FREESHIP") {
      setShipNote("FREESHIP đang bật → phí ship = 0 (demo).");
    }
  }

  function calcShip() {
    const hasAddr = city.trim() && district.trim();
    const fee = hasAddr ? 25000 : 35000;
    setShipBaseFee(fee);

    if (coupon === "FREESHIP") {
      setShipNote("FREESHIP đang bật → phí ship = 0 (demo).");
      return;
    }

    setShipNote(`Phí ship dự kiến: ${money(fee)} (demo).`);
  }

  function clearAll() {
    if (!window.confirm("Xoá toàn bộ giỏ hàng?")) return;
    const next = clearProductCart();
    sync(next);
  }

  function reloadFromLocal() {
    const next = readProductCart();
    setCart(next);
    window.alert("Đã đồng bộ lại giỏ từ localStorage (demo).");
  }

  return (
    <div className="text-slate-900">
      <SiteHeader />

      <main className="px-4 pb-10">
        <div className="max-w-6xl mx-auto grid gap-4 lg:grid-cols-3">
          {/* Left */}
          <section className="card p-6 lg:col-span-2">
            <div className="flex items-end justify-between gap-3 flex-wrap">
              <div>
                <div className="text-xs font-extrabold text-slate-500">Cửa hàng AYANAVITA</div>
                <h1 className="text-2xl font-extrabold">Giỏ hàng</h1>
                <div className="mt-1 text-sm text-slate-600">
                  Tối ưu chuyển đổi bằng combo, voucher và gợi ý mua kèm.
                </div>
              </div>
              <span className="chip">
                <i className="fa-solid fa-lock text-emerald-600" />
                Thanh toán an toàn
              </span>
            </div>

            <div className="mt-5 overflow-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="text-left text-slate-500">
                  <tr className="border-b border-slate-200">
                    <th className="py-3 pr-4">Sản phẩm</th>
                    <th className="py-3 pr-4">Giá</th>
                    <th className="py-3 pr-4">Số lượng</th>
                    <th className="py-3 pr-4">Tạm tính</th>
                    <th className="py-3 text-right">Xoá</th>
                  </tr>
                </thead>

                <tbody className="text-slate-700">
                  {items.length ? (
                    items.map((it) => (
                      <tr key={it.sku} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <img
                              className="h-14 w-14 rounded-xl object-cover ring-1 ring-slate-200"
                              src={it.product.img}
                              alt={it.product.name}
                            />
                            <div>
                              <div className="font-extrabold">{it.product.name}</div>
                              <div className="text-xs text-slate-500">{it.product.id}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 pr-4 font-extrabold">{money(it.product.price)}</td>

                        <td className="py-3 pr-4">
                          <div className="inline-flex items-center gap-2">
                            <button className="btn px-3 py-2" type="button" onClick={() => onDec(it.sku)}>
                              <i className="fa-solid fa-minus" />
                            </button>
                            <span className="font-extrabold w-8 text-center">{it.qty}</span>
                            <button className="btn px-3 py-2" type="button" onClick={() => onInc(it.sku)}>
                              <i className="fa-solid fa-plus" />
                            </button>
                          </div>
                        </td>

                        <td className="py-3 pr-4 font-extrabold">{money(it.line)}</td>

                        <td className="py-3 text-right">
                          <button className="btn px-3 py-2 text-rose-600" type="button" onClick={() => onDel(it.sku)}>
                            <i className="fa-solid fa-trash-can" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-6 text-center text-slate-600" colSpan={5}>
                        Giỏ hàng đang trống.{" "}
                        <Link className="font-extrabold text-indigo-600" to="/products">
                          Mua sắm ngay
                        </Link>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Voucher + Shipping */}
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="font-extrabold">Voucher</div>
                <div className="mt-2 flex gap-2">
                  <input
                    className="field"
                    placeholder="VD: AYA10 hoặc FREESHIP"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        applyCoupon();
                      }
                    }}
                  />
                  <button className="btn btn-accent" type="button" onClick={applyCoupon}>
                    <i className="fa-solid fa-ticket mr-2" />
                    Áp dụng
                  </button>
                </div>
                {couponNote ? <div className="mt-2 text-sm text-slate-600">{couponNote}</div> : null}
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="font-extrabold">Ước tính vận chuyển</div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <input className="field" placeholder="Tỉnh/Thành phố" value={city} onChange={(e) => setCity(e.target.value)} />
                  <input className="field" placeholder="Quận/Huyện" value={district} onChange={(e) => setDistrict(e.target.value)} />
                </div>
                <button className="mt-2 btn" type="button" onClick={calcShip} disabled={!items.length}>
                  <i className="fa-solid fa-calculator mr-2" />
                  Tính phí ship
                </button>

                {shipNote ? <div className="mt-2 text-sm text-slate-600">{shipNote}</div> : null}
                {coupon === "FREESHIP" ? (
                  <div className="mt-2 text-sm text-emerald-700 font-extrabold">
                    FREESHIP đang bật → phí ship = 0
                  </div>
                ) : null}
              </div>
            </div>

            {/* Upsell */}
            <div className="mt-6">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="font-extrabold">Gợi ý mua kèm</div>
                <span className="text-sm text-slate-600">Combo tăng hiệu quả chăm sóc</span>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-3">
                {UPSELL.map((u) => {
                  const p = (PRODUCTS as any)[u.sku] as Product;
                  return (
                    <div key={u.sku} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                      <img className="h-28 w-full object-cover rounded-xl" alt={p.name} src={p.img} />
                      <div className="mt-3 font-extrabold">{p.name}</div>
                      <div className="text-sm text-slate-600">{u.subtitle}</div>
                      <button className="mt-3 btn w-full" type="button" onClick={() => onUpsellAdd(u.sku)}>
                        <i className={`${u.icon} mr-2`} />
                        Thêm
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex gap-2 flex-wrap">
                <button className="btn" type="button" onClick={clearAll} disabled={!items.length}>
                  <i className="fa-solid fa-trash mr-2" />
                  Xoá giỏ
                </button>
                <button className="btn" type="button" onClick={reloadFromLocal}>
                  <i className="fa-solid fa-rotate mr-2" />
                  Sync
                </button>
              </div>
            </div>
          </section>

          {/* Right */}
          <aside className="card p-6">
            <div className="flex items-center justify-between">
              <div className="font-extrabold">Tóm tắt thanh toán</div>
              <span className="chip">
                <i className="fa-solid fa-bolt text-amber-600" />
                Conversion
              </span>
            </div>

            <div className="mt-4 grid gap-2 text-sm text-slate-700">
              <div className="flex justify-between">
                <span>Tạm tính</span>
                <b>{money(subTotal)}</b>
              </div>
              <div className="flex justify-between">
                <span>Giảm giá</span>
                <b>{money(discountValue)}</b>
              </div>
              <div className="flex justify-between">
                <span>Phí ship</span>
                <b>{money(shipping)}</b>
              </div>
              <div className="border-t border-slate-200 my-2" />
              <div className="flex justify-between text-base">
                <span className="font-extrabold">Tổng</span>
                <b>{money(grandTotal)}</b>
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              <Link className="btn btn-primary w-full text-center" to="/product-checkout">
                <i className="fa-solid fa-credit-card mr-2" />
                Đi tới thanh toán
              </Link>

              <Link className="btn w-full text-center" to="/products">
                <i className="fa-solid fa-arrow-left mr-2" />
                Tiếp tục mua
              </Link>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <div className="text-sm font-extrabold">Cam kết AYANAVITA</div>
              <ul className="mt-2 text-sm text-slate-700 space-y-2">
                <li className="flex gap-2">
                  <span className="text-emerald-600 font-extrabold">•</span>Sản phẩm chính hãng
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600 font-extrabold">•</span>Đổi trả theo chính sách
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600 font-extrabold">•</span>Tư vấn da miễn phí
                </li>
              </ul>
            </div>
          </aside>
        </div>

        <div className="max-w-6xl mx-auto mt-4 text-center text-sm text-slate-500">
          © 2025 AYANAVITA • Prototype Cart
        </div>
      </main>

      <Footer />
    </div>
  );
}
