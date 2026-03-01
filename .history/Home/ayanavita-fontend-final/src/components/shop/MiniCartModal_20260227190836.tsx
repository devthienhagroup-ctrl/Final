import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Modal } from "../common/Modal";
import { PRODUCTS, type ProductSku } from "../../data/products.data";
import { money } from "../../services/booking.utils";
import {
  readProductCart,
  incProductQty,
  decProductQty,
  removeProductFromCart,
  clearProductCart,
  type ProductCartItem,
} from "../../services/productCart.utils";
import { shippingFeeDemo } from "../../services/shipping.demo";

export function MiniCartModal({
                                open,
                                onClose,
                                cmsData,
                              }: {
  open: boolean;
  onClose: () => void;
  /** CMS content only (no colors/sizes/etc). */
  cmsData?: Partial<MiniCartModalCmsData>;
}) {
  const content = useMemo(() => ({ ...defaultMiniCartModalCmsData, ...(cmsData || {}) }), [cmsData]);
  const [cart, setCart] = useState<ProductCartItem[]>([]);

  function refresh() {
    setCart(readProductCart());
  }

  useEffect(() => {
    if (!open) return;
    refresh();
  }, [open]);

  useEffect(() => {
    const onChanged = () => refresh();
    window.addEventListener("aya_product_cart_changed", onChanged as any);
    return () => window.removeEventListener("aya_product_cart_changed", onChanged as any);
  }, []);

  const rows = useMemo(() => {
    return cart
        .map((it) => {
          const p = PRODUCTS[it.sku];
          if (!p) return null;
          return { ...it, product: p, line: p.price * it.qty };
        })
        .filter(Boolean) as Array<ProductCartItem & { product: any; line: number }>;
  }, [cart]);

  const subtotal = useMemo(() => rows.reduce((s, x) => s + x.line, 0), [rows]);
  const ship = useMemo(() => shippingFeeDemo(subtotal), [subtotal]);
  const total = subtotal + ship;

  function onInc(sku: ProductSku) {
    setCart(incProductQty(sku));
  }
  function onDec(sku: ProductSku) {
    setCart(decProductQty(sku));
  }
  function onDel(sku: ProductSku) {
    setCart(removeProductFromCart(sku));
  }
  function onClear() {
    if (!window.confirm(content.clearConfirm)) return;
    setCart(clearProductCart());
  }

  return (
      <Modal
          open={open}
          onClose={onClose}
          subTitle={content.modalSubTitle}
          title={content.modalTitle}
          maxWidthClass="max-w-3xl"
      >
        <div className="grid gap-3">
          {rows.length ? (
              rows.map((it) => (
                  <div key={it.sku} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                            className="h-16 w-16 rounded-2xl object-cover border border-slate-200"
                            src={it.product.img}
                            alt={it.product.name}
                        />
                        <div className="min-w-0">
                          <div className="font-extrabold truncate">{it.product.name}</div>
                          <div className="text-sm text-slate-600">{it.product.id} • {money(it.product.price)}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-extrabold text-amber-600">{money(it.line)}</div>
                        <div className="mt-2 flex items-center justify-end gap-2">
                          <button className="btn w-11 h-11 p-0" type="button" onClick={() => onDec(it.sku)}>
                            <i className={content.iconMinusClass} />
                          </button>
                          <span className="chip">{content.qtyLabel} <b>{it.qty}</b></span>
                          <button className="btn w-11 h-11 p-0" type="button" onClick={() => onInc(it.sku)}>
                            <i className={content.iconPlusClass} />
                          </button>
                          <button className="btn" type="button" onClick={() => onDel(it.sku)}>
                            {content.deleteItemText}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
              ))
          ) : (
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 text-sm text-slate-700">
                {content.emptyText}
              </div>
          )}

          <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 font-extrabold">{content.subtotalLabel}</span>
              <b>{money(subtotal)}</b>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-slate-600 font-extrabold">{content.shippingLabel}</span>
              <b>{money(ship)}</b>
            </div>
            <div className="border-t border-slate-200 my-3" />
            <div className="flex items-center justify-between">
              <span className="font-extrabold">{content.totalLabel}</span>
              <span className="text-2xl font-extrabold text-amber-600">{money(total)}</span>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Link className="btn btn-primary hover:text-purple-800 text-center" to="/checkout" onClick={onClose}>
                <i className={content.iconCheckoutClass + " mr-2"} /> {content.checkoutCtaText}
              </Link>
              <button className="btn" type="button" onClick={onClear} disabled={!rows.length}>
                <i className={content.iconClearClass + " mr-2"} /> {content.clearCartText}
              </button>
            </div>

            <div className="mt-3 text-xs text-slate-500">
              {content.footerNote}
            </div>
          </div>
        </div>
      </Modal>
  );
}

export type MiniCartModalCmsData = {
  modalSubTitle: string;
  modalTitle: string;

  emptyText: string;
  qtyLabel: string;
  deleteItemText: string;

  subtotalLabel: string;
  shippingLabel: string;
  totalLabel: string;

  checkoutCtaText: string;
  clearCartText: string;
  clearConfirm: string;

  footerNote: string;

  /** FontAwesome (or any) icon class names */
  iconMinusClass: string;
  iconPlusClass: string;
  iconCheckoutClass: string;
  iconClearClass: string;
};

export const defaultMiniCartModalCmsData: MiniCartModalCmsData = {
  modalSubTitle: "Giỏ hàng",
  modalTitle: "Sản phẩm đã chọn",

  emptyText: "Giỏ hàng trống.",
  qtyLabel: "SL:",
  deleteItemText: "Xoá",

  subtotalLabel: "Tạm tính",
  shippingLabel: "Phí vận chuyển (demo)",
  totalLabel: "Tổng",

  checkoutCtaText: "Đi tới checkout",
  clearCartText: "Xóa giỏ",
  clearConfirm: "Xóa toàn bộ giỏ hàng?",

  footerNote: "Prototype: giỏ dùng localStorage. Khi làm thật, nối API /orders.",

  iconMinusClass: "fa-solid fa-minus",
  iconPlusClass: "fa-solid fa-plus",
  iconCheckoutClass: "fa-solid fa-credit-card",
  iconClearClass: "fa-solid fa-trash",
};
