import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { SiteHeader } from "../components/layout/SiteHeader";
import { Footer } from "../components/layout/Footer";
import { PRODUCTS, type ProductSku } from "../data/products.data";
import { money } from "../services/booking.utils";
import { buildCatalogMetas } from "../data/shopCatalog.data";

function pricePerMl(price: number, ml: number) {
  if (!ml) return "—";
  return `${money(Math.round(price / ml))}/ml`;
}

export default function ComparePage() {
  const metas = useMemo(() => buildCatalogMetas(), []);
  const skus = useMemo(() => metas.map((m) => m.sku), [metas]);

  const [a, setA] = useState<ProductSku | "">((skus[0] as any) || "");
  const [b, setB] = useState<ProductSku | "">((skus[1] as any) || "");
  const [c, setC] = useState<ProductSku | "">((skus[2] as any) || "");

  const A = a ? PRODUCTS[a as ProductSku] : null;
  const B = b ? PRODUCTS[b as ProductSku] : null;
  const C = c ? PRODUCTS[c as ProductSku] : null;

  const mA = a ? metas.find((x) => x.sku === a) : null;
  const mB = b ? metas.find((x) => x.sku === b) : null;
  const mC = c ? metas.find((x) => x.sku === c) : null;

  function reset() {
    setA((skus[0] as any) || "");
    setB((skus[1] as any) || "");
    setC((skus[2] as any) || "");
  }

  function suggest() {
    reset();
    window.alert("Đã chọn routine phục hồi (demo).");
  }

  return (
    <div className="text-slate-900">
      <SiteHeader />

      <main className="px-4 pb-10">
        <div className="max-w-6xl mx-auto grid gap-4">
          <section className="card p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-xs font-extrabold text-slate-500">Compare</div>
                <h1 className="text-2xl font-extrabold">So sánh sản phẩm</h1>
                <div className="mt-1 text-sm text-slate-600">
                  Chọn tối đa 3 sản phẩm để so sánh theo giá/ML, rating (demo).
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn" type="button" onClick={reset}>
                  <i className="fa-solid fa-rotate-left mr-2" />Reset
                </button>
                <button className="btn btn-primary" type="button" onClick={suggest}>
                  <i className="fa-solid fa-wand-magic-sparkles mr-2" />Gợi ý combo
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div>
                <label className="text-sm font-extrabold text-slate-700">Sản phẩm A</label>
                <select className="field mt-2" value={a} onChange={(e) => setA(e.target.value as any)}>
                  {skus.map((sku) => <option key={sku} value={sku}>{PRODUCTS[sku].name} ({PRODUCTS[sku].id})</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-extrabold text-slate-700">Sản phẩm B</label>
                <select className="field mt-2" value={b} onChange={(e) => setB(e.target.value as any)}>
                  {skus.map((sku) => <option key={sku} value={sku}>{PRODUCTS[sku].name} ({PRODUCTS[sku].id})</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-extrabold text-slate-700">Sản phẩm C (tuỳ chọn)</label>
                <select className="field mt-2" value={c} onChange={(e) => setC(e.target.value as any)}>
                  <option value="">(Không chọn)</option>
                  {skus.map((sku) => <option key={sku} value={sku}>{PRODUCTS[sku].name} ({PRODUCTS[sku].id})</option>)}
                </select>
              </div>
            </div>

            <div className="mt-5 overflow-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="text-left text-slate-500">
                  <tr className="border-b border-slate-200">
                    <th className="py-3 pr-4">Tiêu chí</th>
                    <th className="py-3 pr-4">A</th>
                    <th className="py-3 pr-4">B</th>
                    <th className="py-3 pr-4">C</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700">
                  <tr className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-extrabold">Sản phẩm</td>
                    <td className="py-3 pr-4">{A ? <div className="flex items-center gap-3"><img className="h-14 w-14 rounded-xl object-cover ring-1 ring-slate-200" src={A.img} alt={A.name} /><div><div className="font-extrabold">{A.name}</div><div className="text-xs text-slate-500">{A.id}</div></div></div> : "—"}</td>
                    <td className="py-3 pr-4">{B ? <div className="flex items-center gap-3"><img className="h-14 w-14 rounded-xl object-cover ring-1 ring-slate-200" src={B.img} alt={B.name} /><div><div className="font-extrabold">{B.name}</div><div className="text-xs text-slate-500">{B.id}</div></div></div> : "—"}</td>
                    <td className="py-3 pr-4">{C ? <div className="flex items-center gap-3"><img className="h-14 w-14 rounded-xl object-cover ring-1 ring-slate-200" src={C.img} alt={C.name} /><div><div className="font-extrabold">{C.name}</div><div className="text-xs text-slate-500">{C.id}</div></div></div> : "—"}</td>
                  </tr>

                  <tr className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-extrabold">Giá</td>
                    <td className="py-3 pr-4">{A ? money(A.price) : "—"}</td>
                    <td className="py-3 pr-4">{B ? money(B.price) : "—"}</td>
                    <td className="py-3 pr-4">{C ? money(C.price) : "—"}</td>
                  </tr>

                  <tr className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-extrabold">Dung tích (demo)</td>
                    <td className="py-3 pr-4">{mA ? `${mA.ml} ml` : "—"}</td>
                    <td className="py-3 pr-4">{mB ? `${mB.ml} ml` : "—"}</td>
                    <td className="py-3 pr-4">{mC ? `${mC.ml} ml` : "—"}</td>
                  </tr>

                  <tr className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-extrabold">Giá/ML</td>
                    <td className="py-3 pr-4">{A && mA ? pricePerMl(A.price, mA.ml) : "—"}</td>
                    <td className="py-3 pr-4">{B && mB ? pricePerMl(B.price, mB.ml) : "—"}</td>
                    <td className="py-3 pr-4">{C && mC ? pricePerMl(C.price, mC.ml) : "—"}</td>
                  </tr>

                  <tr className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-extrabold">Đánh giá</td>
                    <td className="py-3 pr-4">{mA ? `${mA.rating}★` : "—"}</td>
                    <td className="py-3 pr-4">{mB ? `${mB.rating}★` : "—"}</td>
                    <td className="py-3 pr-4">{mC ? `${mC.rating}★` : "—"}</td>
                  </tr>

                  <tr className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-extrabold">Phù hợp (demo)</td>
                    <td className="py-3 pr-4">{mA ? mA.concern.join(", ") : "—"}</td>
                    <td className="py-3 pr-4">{mB ? mB.concern.join(", ") : "—"}</td>
                    <td className="py-3 pr-4">{mC ? mC.concern.join(", ") : "—"}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <Link className="btn text-center" to={`/products/${a || skus[0]}`}>
                <i className="fa-solid fa-circle-info mr-2" />Mở trang chi tiết
              </Link>
              <Link className="btn text-center" to="/cart">
                <i className="fa-solid fa-cart-shopping mr-2" />Về giỏ hàng
              </Link>
              <Link className="btn btn-primary text-center" to="/checkout">
                <i className="fa-solid fa-credit-card mr-2" />Thanh toán
              </Link>
            </div>
          </section>

          <section className="card p-6">
            <div className="flex items-center justify-between">
              <div className="font-extrabold">Gợi ý routine</div>
              <span className="chip"><i className="fa-solid fa-lightbulb text-amber-600" />Khuyến nghị</span>
            </div>

            <div className="mt-3 text-sm text-slate-700">
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="font-extrabold">Routine đề xuất (demo)</div>
                <ol className="mt-2 space-y-2">
                  <li>1) Làm sạch: <b>{A?.name || "—"}</b></li>
                  <li>2) Treatment/Serum: <b>{B?.name || "—"}</b></li>
                  <li>3) Dưỡng khoá ẩm: <b>{C?.name || "Kem dưỡng (demo)"}</b></li>
                </ol>
                <div className="mt-2 text-sm text-slate-600">Bạn có thể tuỳ chỉnh theo loại da và mục tiêu.</div>
              </div>
            </div>
          </section>
        </div>

        <div className="max-w-6xl mx-auto mt-4 text-center text-sm text-slate-500">© 2025 AYANAVITA • Prototype Compare</div>
      </main>

      <Footer />
    </div>
  );
}
