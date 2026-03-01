// src/pages/CartPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { SiteHeader } from "../components/layout/SiteHeader";
import { Footer } from "../components/layout/Footer";
import { http } from "../api/http";

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

// Giữ lại COUPONS chỉ chứa logic
const COUPONS: Record<
    Exclude<CouponCode, null>,
    { type: "percent" | "fixed" | "freeship"; value: number }
> = {
  AYA10: { type: "percent", value: 10 },
  FREESHIP: { type: "freeship", value: 0 },
};

type Product = (typeof PRODUCTS)[keyof typeof PRODUCTS];

// Định nghĩa kiểu dữ liệu cho CMS
interface CmsData {
  storeName: string;
  pageTitle: string;
  pageDescription: string;
  safeBadge: string;
  tableHeaders: {
    product: string;
    price: string;
    quantity: string;
    subtotal: string;
    remove: string;
  };
  emptyCartText: string;
  emptyCartLinkText: string;
  voucherTitle: string;
  voucherPlaceholder: string;
  applyButton: string;
  couponEmptyMessage: string;
  couponInvalidMessage: string;
  couponAya10Note: string;
  couponFreeshipNote: string;
  shippingTitle: string;
  cityPlaceholder: string;
  districtPlaceholder: string;
  calculateShippingButton: string;
  shipNoteTemplate: string;          // chứa {fee}
  freeshipActiveMessage: string;
  upsellTitle: string;
  upsellSubtitle: string;
  addButton: string;
  addToCartMessage: string;
  clearCartButton: string;
  confirmClearCart: string;
  syncButton: string;
  syncMessage: string;
  summaryTitle: string;
  summaryBadge: string;
  summaryLabels: {
    subtotal: string;
    discount: string;
    shipping: string;
    total: string;
  };
  checkoutButton: string;
  continueShoppingButton: string;
  commitmentTitle: string;
  commitmentItems: string[];
  footerText: string;
}

// Nội dung mặc định (fallback)
const defaultCmsData: CmsData = {
  storeName: "Cửa hàng AYANAVITA",
  pageTitle: "Giỏ hàng",
  pageDescription: "Tối ưu chuyển đổi bằng combo, voucher và gợi ý mua kèm.",
  safeBadge: "Thanh toán an toàn",
  tableHeaders: {
    product: "Sản phẩm",
    price: "Giá",
    quantity: "Số lượng",
    subtotal: "Tạm tính",
    remove: "Xoá",
  },
  emptyCartText: "Giỏ hàng đang trống.",
  emptyCartLinkText: "Mua sắm ngay",
  voucherTitle: "Voucher",
  voucherPlaceholder: "VD: AYA10 hoặc FREESHIP",
  applyButton: "Áp dụng",
  couponEmptyMessage: "Nhập mã voucher để áp dụng.",
  couponInvalidMessage: "Voucher không hợp lệ (demo).",
  couponAya10Note: "Giảm 10% cho đơn hàng.",
  couponFreeshipNote: "Miễn phí ship (demo).",
  shippingTitle: "Ước tính vận chuyển",
  cityPlaceholder: "Tỉnh/Thành phố",
  districtPlaceholder: "Quận/Huyện",
  calculateShippingButton: "Tính phí ship",
  shipNoteTemplate: "Phí ship dự kiến: {fee} (demo).",
  freeshipActiveMessage: "FREESHIP đang bật → phí ship = 0 (demo).",
  upsellTitle: "Gợi ý mua kèm",
  upsellSubtitle: "Combo tăng hiệu quả chăm sóc",
  addButton: "Thêm",
  addToCartMessage: "Đã thêm vào giỏ (demo).",
  clearCartButton: "Xoá giỏ",
  confirmClearCart: "Xoá toàn bộ giỏ hàng?",
  syncButton: "Sync",
  syncMessage: "Đã đồng bộ lại giỏ từ localStorage (demo).",
  summaryTitle: "Tóm tắt thanh toán",
  summaryBadge: "Conversion",
  summaryLabels: {
    subtotal: "Tạm tính",
    discount: "Giảm giá",
    shipping: "Phí ship",
    total: "Tổng",
  },
  checkoutButton: "Đi tới thanh toán",
  continueShoppingButton: "Tiếp tục mua",
  commitmentTitle: "Cam kết AYANAVITA",
  commitmentItems: [
    "Sản phẩm chính hãng",
    "Đổi trả theo chính sách",
    "Tư vấn da miễn phí",
  ],
  footerText: "© 2025 AYANAVITA • Prototype Cart",
};

export default function CartPage() {
  // State cho ngôn ngữ và dữ liệu CMS từ API
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
    return localStorage.getItem("preferred-language") || "vi";
  });
  const [cmsDataFromAPI, setCmsDataFromAPI] = useState<CmsData | null>(null);

  // Lắng nghe sự kiện thay đổi ngôn ngữ từ Header
  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => {
      setCurrentLanguage(event.detail.language);
    };
    window.addEventListener('languageChange', handleLanguageChange as EventListener);
    return () => window.removeEventListener('languageChange', handleLanguageChange as EventListener);
  }, []);

  // Gọi API lấy nội dung CMS cho trang giỏ hàng
  useEffect(() => {
    const fetchCms = async () => {
      try {
        const res = await http.get(`/public/pages/cart?lang=${currentLanguage}`);
        setCmsDataFromAPI(res.data.sections[0].data);
        console.log("dữ liệu cart", res.data.sections[0].data)
      } catch (error) {
        console.error("Lỗi gọi API cart:", error);
        // Nếu lỗi, vẫn giữ cmsDataFromAPI = null, sẽ dùng default
      }
    };
    fetchCms();
  }, [currentLanguage]);

  // Merge dữ liệu từ API với default (API ghi đè lên default)
  const cms = useMemo(() => {
    return { ...defaultCmsData, ...cmsDataFromAPI };
  }, [cmsDataFromAPI]);

  // State giỏ hàng
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

  // Đồng bộ giỏ hàng với localStorage
  function sync(next: ProductCartItem[]) {
    setCart(next);
    writeProductCart(next);
  }

  // Lắng nghe thay đổi từ tab khác
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
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

  // Tính toán các giá trị
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

  // Các hành động
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
    window.alert(cms.addToCartMessage);
  }

  function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    setCoupon(null);

    if (!code) {
      setCouponNote(cms.couponEmptyMessage);
      return;
    }
    if (code !== "AYA10" && code !== "FREESHIP") {
      setCouponNote(cms.couponInvalidMessage);
      return;
    }

    setCoupon(code as CouponCode);
    if (code === "AYA10") {
      setCouponNote(cms.couponAya10Note);
    } else if (code === "FREESHIP") {
      setCouponNote(cms.couponFreeshipNote);
      setShipNote(cms.freeshipActiveMessage);
    }
  }

  function calcShip() {
    const hasAddr = city.trim() && district.trim();
    const fee = hasAddr ? 25000 : 35000;
    setShipBaseFee(fee);

    if (coupon === "FREESHIP") {
      setShipNote(cms.freeshipActiveMessage);
      return;
    }

    setShipNote(cms.shipNoteTemplate.replace("{fee}", money(fee)));
  }

  function clearAll() {
    if (!window.confirm(cms.confirmClearCart)) return;
    const next = clearProductCart();
    sync(next);
  }

  function reloadFromLocal() {
    const next = readProductCart();
    setCart(next);
    window.alert(cms.syncMessage);
  }

  return (
      <div className="text-slate-900">
        {/* Có thể thêm Header nếu cần */}
        <main className="mt-2 px-4 pb-10">
          <div className="max-w-6xl mx-auto grid gap-4 lg:grid-cols-3">
            {/* Left column */}
            <section className="card hover:translate-y-0 p-6 lg:col-span-2">
              <div className="flex items-end justify-between gap-3 flex-wrap">
                <div>
                  <div className="text-xs font-extrabold text-slate-500">{cms.storeName}</div>
                  <h1 className="text-2xl font-extrabold">{cms.pageTitle}</h1>
                  <div className="mt-1 text-sm text-slate-600">{cms.pageDescription}</div>
                </div>
                <span className="chip">
                <i className="fa-solid fa-lock text-emerald-600" />
                  {cms.safeBadge}
              </span>
              </div>

              <div className="mt-5 overflow-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="text-left text-slate-500">
                  <tr className="border-b border-slate-200">
                    <th className="py-3 pr-4">{cms.tableHeaders.product}</th>
                    <th className="py-3 pr-4">{cms.tableHeaders.price}</th>
                    <th className="py-3 pr-4">{cms.tableHeaders.quantity}</th>
                    <th className="py-3 pr-4">{cms.tableHeaders.subtotal}</th>
                    <th className="py-3 text-right">{cms.tableHeaders.remove}</th>
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
                          {cms.emptyCartText}{" "}
                          <Link className="font-extrabold text-indigo-600" to="/products">
                            {cms.emptyCartLinkText}
                          </Link>
                        </td>
                      </tr>
                  )}
                  </tbody>
                </table>
              </div>

              {/* Voucher + Shipping */}
              <div className="mt-5 flex flex-col gap-3">
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="font-extrabold">{cms.voucherTitle}</div>
                  <div className="mt-2 flex gap-2">
                    <input
                        className="field !w-3/4"
                        placeholder={cms.voucherPlaceholder}
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            applyCoupon();
                          }
                        }}
                    />
                    <button className="btn btn-accent flex-1" type="button" onClick={applyCoupon}>
                      <i className="fa-solid fa-ticket mr-2" />
                      {cms.applyButton}
                    </button>
                  </div>
                  {couponNote ? <div className="mt-2 text-sm text-slate-600">{couponNote}</div> : null}
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="font-extrabold">{cms.shippingTitle}</div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <input
                        className="field"
                        placeholder={cms.cityPlaceholder}
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                    />
                    <input
                        className="field"
                        placeholder={cms.districtPlaceholder}
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                    />
                  </div>
                  <button className="mt-2 btn" type="button" onClick={calcShip} disabled={!items.length}>
                    <i className="fa-solid fa-calculator mr-2" />
                    {cms.calculateShippingButton}
                  </button>

                  {shipNote ? <div className="mt-2 text-sm text-slate-600">{shipNote}</div> : null}
                  {coupon === "FREESHIP" ? (
                      <div className="mt-2 text-sm text-emerald-700 font-extrabold">
                        {cms.freeshipActiveMessage}
                      </div>
                  ) : null}
                </div>
              </div>

              {/* Upsell */}
              <div className="mt-6">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="font-extrabold">{cms.upsellTitle}</div>
                  <span className="text-sm text-slate-600">{cms.upsellSubtitle}</span>
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
                            {cms.addButton}
                          </button>
                        </div>
                    );
                  })}
                </div>

                <div className="mt-4 flex gap-2 flex-wrap">
                  <button className="btn" type="button" onClick={clearAll} disabled={!items.length}>
                    <i className="fa-solid fa-trash mr-2" />
                    {cms.clearCartButton}
                  </button>
                  <button className="btn" type="button" onClick={reloadFromLocal}>
                    <i className="fa-solid fa-rotate mr-2" />
                    {cms.syncButton}
                  </button>
                </div>
              </div>
            </section>

            {/* Right column */}
            <aside className="card p-6">
              <div className="flex items-center justify-between">
                <div className="font-extrabold">{cms.summaryTitle}</div>
                <span className="chip">
                <i className="fa-solid fa-bolt text-amber-600" />
                  {cms.summaryBadge}
              </span>
              </div>

              <div className="mt-4 grid gap-2 text-sm text-slate-700">
                <div className="flex justify-between">
                  <span>{cms.summaryLabels.subtotal}</span>
                  <b>{money(subTotal)}</b>
                </div>
                <div className="flex justify-between">
                  <span>{cms.summaryLabels.discount}</span>
                  <b>{money(discountValue)}</b>
                </div>
                <div className="flex justify-between">
                  <span>{cms.summaryLabels.shipping}</span>
                  <b>{money(shipping)}</b>
                </div>
                <div className="border-t border-slate-200 my-2" />
                <div className="flex justify-between text-base">
                  <span className="font-extrabold">{cms.summaryLabels.total}</span>
                  <b>{money(grandTotal)}</b>
                </div>
              </div>

              <div className="mt-4 grid gap-2">
                <Link className="btn btn-primary hover:text-purple-800 w-full text-center" to="/product-checkout">
                  <i className="fa-solid fa-credit-card mr-2" />
                  {cms.checkoutButton}
                </Link>

                <Link className="btn w-full text-center" to="/products">
                  <i className="fa-solid fa-arrow-left mr-2" />
                  {cms.continueShoppingButton}
                </Link>
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="text-sm font-extrabold">{cms.commitmentTitle}</div>
                <ul className="mt-2 text-sm text-slate-700 space-y-2">
                  {cms.commitmentItems.map((item, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-emerald-600 font-extrabold">•</span>
                        {item}
                      </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>

          <div className="max-w-6xl mx-auto mt-4 text-center text-sm text-slate-500">
            {cms.footerText}
          </div>
        </main>
      </div>
  );
}