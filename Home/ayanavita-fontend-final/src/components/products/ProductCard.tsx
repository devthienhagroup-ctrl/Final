// src/components/products/ProductCard.tsx
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import type { CategoryProduct } from "../../data/productCategory.data";
import { money } from "../../services/booking.utils";
import { addProductToCart } from "../../services/productCart.utils";

export type ProductCardCmsData = {
    soldLabel: string;
    updatedLabel: string;
    infoButtonTitle: string;
    addToCartButtonText: string;
    addToCartSuccessAlert: string;
    compareButtonText: string;
    compareSuccessAlert: string;
};

const DEFAULT_CMS_DATA: ProductCardCmsData = {
    soldLabel: "Đã bán",
    updatedLabel: "Cập nhật:",
    infoButtonTitle: "Xem chi tiết",
    addToCartButtonText: "Thêm",
    addToCartSuccessAlert: "Đã thêm vào giỏ (demo).",
    compareButtonText: "So sánh",
    compareSuccessAlert: "Đã thêm vào so sánh (demo).",
};

function Stars({ rating }: { rating: number }) {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
                {Array.from({ length: full }).map((_, i) => (
                    <i key={i} className="fa-solid fa-star star" />
                ))}
                {half ? <i className="fa-solid fa-star-half-stroke star" /> : null}
            </div>
            <b>{rating.toFixed(1)}</b>
        </div>
    );
}

export function ProductCard({
                                p,
                                detailTo,
                                cmsData,
                                onCompare,
                            }: {
    p: CategoryProduct;
    detailTo: string;
    cmsData?: Partial<ProductCardCmsData>;
    onCompare?: (productId: string) => void;
}) {
    const soldText = useMemo(
        () => new Intl.NumberFormat("vi-VN").format(p.sold),
        [p.sold]
    );

    const cms = useMemo(
        () => ({ ...DEFAULT_CMS_DATA, ...(cmsData ?? {}) }),
        [cmsData]
    );

    return (
        <article className="card p-4 flex flex-col gap-3">
            {/* Image */}
            <img
                className="h-36 w-full rounded-xl object-cover ring-1 ring-slate-200"
                src={p.img}
                alt={p.name}
            />

            {/* Title */}
            <div>
                <div className="font-bold leading-tight">{p.name}</div>
                <div className="text-xs text-slate-500">
                    {p.id} • {cms.soldLabel} {soldText}
                </div>
            </div>

            {/* Price */}
            <div className="text-lg font-extrabold text-emerald-600">
                {money(p.price)}
            </div>

            {/* Rating + updated */}
            <div className="flex items-center justify-between text-xs text-slate-500">
                <Stars rating={p.rating} />
                <span>
          {cms.updatedLabel} {p.updated}
        </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <Link
                    to={detailTo}
                    className="flex items-center justify-center px-2 py-1 text-xs rounded-md
                     ring-1 ring-slate-300 hover:bg-slate-100"
                    title={cms.infoButtonTitle}
                >
                    <i className="fa-solid fa-circle-info" />
                </Link>

                <button
                    type="button"
                    className="flex-1 px-3 py-1 text-xs font-semibold rounded-md
                     bg-purple-600 text-white hover:bg-purple-700"
                    onClick={() => {
                        addProductToCart(p.sku, 1);
                        window.alert(cms.addToCartSuccessAlert);
                    }}
                >
                    <i className="fa-solid fa-cart-plus mr-1" />
                    {cms.addToCartButtonText}
                </button>
            </div>

            {/* Compare */}
            <button
                type="button"
                className="px-3 py-1 text-xs rounded-md
                   ring-1 ring-slate-300 hover:bg-slate-100"
                onClick={() => {
                    if (onCompare) {
                        onCompare(String(p.sku || p.id));
                        return;
                    }
                    window.alert(cms.compareSuccessAlert);
                }}
            >
                <i className="fa-solid fa-scale-balanced mr-1" />
                {cms.compareButtonText}
            </button>
        </article>
    );
}
