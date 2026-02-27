// src/components/products/ProductFilters.tsx
import React from "react";
import type { ProductType, SkinConcern } from "../../data/productCategory.data";
import { TYPE_LABEL, CONCERN_LABEL } from "../../data/productCategory.data";

export type PriceRange = "all" | "lt200" | "200-400" | "gt400";
export type SortKey = "best" | "new" | "priceAsc" | "priceDesc" | "rating";

export type ProductFiltersCmsData = {
  title: string;
  resetTitle: string;

  searchLabel: string;
  searchPlaceholder: string;

  typeLabel: string;

  concernLabel: string;
  concernAllLabel: string;

  priceLabel: string;

  sortLabel: string;
};

const DEFAULT_CMS_DATA: ProductFiltersCmsData = {
  title: "Bộ lọc",
  resetTitle: "Reset",

  searchLabel: "Tìm kiếm",
  searchPlaceholder: "Tên sản phẩm...",

  typeLabel: "Loại",

  concernLabel: "Vấn đề da",
  concernAllLabel: "Tất cả",

  priceLabel: "Khoảng giá",

  sortLabel: "Sắp xếp",
};

const DEFAULT_TYPE_OPTIONS: Array<[ProductType, string]> = (["cleanser", "serum", "cream", "mask"] as ProductType[]).map((t) => [
  t,
  TYPE_LABEL[t],
]);

const DEFAULT_CONCERN_OPTIONS: Array<[SkinConcern, string]> = (Object.keys(CONCERN_LABEL) as SkinConcern[]).map((k) => [k, CONCERN_LABEL[k]]);

const DEFAULT_PRICE_OPTIONS: Array<[PriceRange, string]> = [
  ["all", "Tất cả"],
  ["lt200", "Dưới 200k"],
  ["200-400", "200k–400k"],
  ["gt400", "Trên 400k"],
];

const DEFAULT_SORT_OPTIONS: Array<[SortKey, string]> = [
  ["best", "Bán chạy"],
  ["new", "Mới nhất"],
  ["priceAsc", "Giá tăng"],
  ["priceDesc", "Giá giảm"],
  ["rating", "Đánh giá"],
];

export function ProductFilters(props: {
  q: string;
  onQ: (v: string) => void;

  types: ProductType[];
  onToggleType: (t: ProductType) => void;
  typeOptions?: Array<[ProductType, string]>;

  concern: "all" | SkinConcern;
  onConcern: (v: "all" | SkinConcern) => void;

  priceRange: PriceRange;
  onPriceRange: (v: PriceRange) => void;

  sort: SortKey;
  onSort: (v: SortKey) => void;

  onReset: () => void;

  cmsData?: Partial<ProductFiltersCmsData>;
}) {
  const { q, onQ, types, onToggleType, typeOptions, concern, onConcern, priceRange, onPriceRange, sort, onSort, onReset, cmsData } = props;

  const cms: ProductFiltersCmsData = {
    ...DEFAULT_CMS_DATA,
    ...cmsData,
  };

  const resolvedTypeOptions = typeOptions?.length ? typeOptions : DEFAULT_TYPE_OPTIONS;

  return (
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div className="font-extrabold">{cms.title}</div>
          <button className="btn px-3 py-2" type="button" onClick={onReset} title={cms.resetTitle}>
            <i className="fa-solid fa-rotate-left" />
          </button>
        </div>

        <div className="mt-3">
          <label className="text-sm font-extrabold text-slate-700">{cms.searchLabel}</label>
          <input className="field mt-2" value={q} onChange={(e) => onQ(e.target.value)} placeholder={cms.searchPlaceholder} />
        </div>

        <div className="mt-4 grid gap-3">
          <div>
            <div className="text-sm font-extrabold text-slate-700">{cms.typeLabel}</div>
            <div className="mt-2 grid gap-2 text-sm">
              {resolvedTypeOptions.map(([t, label]) => (
                  <label key={t} className="flex items-center gap-2">
                    <input type="checkbox" checked={types.includes(t)} onChange={() => onToggleType(t)} />
                    {label}
                  </label>
              ))}
            </div>
          </div>

          {/*Phát triển sau*/}

          <div>
            <div className="text-sm font-extrabold text-slate-700">{cms.priceLabel}</div>
            <select className="field mt-2" value={priceRange} onChange={(e) => onPriceRange(e.target.value as any)}>
              {DEFAULT_PRICE_OPTIONS.map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
              ))}
            </select>
          </div>

          <div>
            <div className="text-sm font-extrabold text-slate-700">{cms.sortLabel}</div>
            <select className="field mt-2" value={sort} onChange={(e) => onSort(e.target.value as any)}>
              {DEFAULT_SORT_OPTIONS.map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
              ))}
            </select>
          </div>
        </div>
      </div>
  );
}
