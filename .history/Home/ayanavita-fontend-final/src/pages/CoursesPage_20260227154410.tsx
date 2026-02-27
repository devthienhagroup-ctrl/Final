// src/pages/CoursesPage.tsx
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { SiteHeader } from "../components/layout/SiteHeader";
import { Footer } from "../components/layout/Footer";

import { COURSES, type Course, type CourseTopic, topicLabel } from "../data/courses.data";
import { money } from "../services/booking.utils";
import {
  readCourseCart,
  addCourseToCart,
  removeCourseFromCart,
  clearCourseCart,
} from "../services/courseCart.utils";

type SortRule = "best" | "new" | "high" | "low";

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <i key={i} className={`fa-solid fa-star ${i < full ? "star" : "text-slate-300"}`} />
      ))}
    </span>
  );
}

function CourseDetailModal({
  open,
  course,
  onClose,
  onAdd,
}: {
  open: boolean;
  course: Course | null;
  onClose: () => void;
  onAdd: (id: string) => void;
}) {
  if (!open || !course) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/55"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="card w-full max-w-4xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-extrabold text-slate-500">Course</div>
            <div className="text-lg font-extrabold">{course.title}</div>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary" type="button" onClick={() => onAdd(course.id)}>
              <i className="fa-solid fa-cart-plus" /> Thêm vào cart
            </button>
            <button className="btn h-10 w-10 p-0" type="button" onClick={onClose} aria-label="close">
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        </div>

        <div className="p-6 grid gap-4">
          <img
            className="w-full h-64 object-cover rounded-3xl ring-1 ring-slate-200"
            src={course.img}
            alt={course.title}
          />

          <div className="flex flex-wrap gap-2">
            <span className="chip">
              <i className="fa-solid fa-layer-group text-indigo-600" />
              {topicLabel(course.topic)}
            </span>
            <span className="chip">
              <i className="fa-solid fa-clock text-amber-600" />
              {course.hours} giờ
            </span>
            <span className="chip">
              <i className="fa-solid fa-users text-emerald-600" />
              {new Intl.NumberFormat("vi-VN").format(course.students)} HV
            </span>
            <span className="chip">
              <i className="fa-solid fa-star text-amber-500" />
              {course.rating.toFixed(1)}
            </span>
          </div>

          <div className="text-slate-700 leading-relaxed">{course.desc}</div>

          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <div className="font-extrabold text-indigo-700">{money(course.price)}</div>
              <div className="text-sm text-slate-600">Giá demo (có thể áp voucher)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CourseCartModal({
  open,
  onClose,
  items,
  onRemove,
  onClear,
}: {
  open: boolean;
  onClose: () => void;
  items: Course[];
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  if (!open) return null;

  const total = items.reduce((s, x) => s + (x.price || 0), 0);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/55"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="card w-full max-w-3xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-extrabold text-slate-500">Cart</div>
            <div className="text-lg font-extrabold">Giỏ khoá học (demo)</div>
          </div>
          <div className="flex gap-2">
            <button className="btn" type="button" onClick={onClear}>
              <i className="fa-solid fa-trash" /> Xoá
            </button>
            <button className="btn h-10 w-10 p-0" type="button" onClick={onClose} aria-label="close">
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {items.length ? (
            <div className="grid gap-3">
              {items.map((c) => (
                <div key={c.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <img
                        src={c.img}
                        alt={c.title}
                        className="h-16 w-24 object-cover rounded-2xl ring-1 ring-slate-200"
                      />
                      <div>
                        <div className="font-extrabold">{c.title}</div>
                        <div className="text-sm text-slate-600 mt-1">
                          {topicLabel(c.topic)} • {money(c.price)}
                        </div>
                      </div>
                    </div>
                    <button className="btn h-10 w-10 p-0" type="button" onClick={() => onRemove(c.id)}>
                      <i className="fa-solid fa-trash text-rose-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-600 py-10">
              <div className="text-3xl">
                <i className="fa-solid fa-cart-shopping" />
              </div>
              <div className="mt-2 font-extrabold">Cart trống</div>
              <div className="text-sm mt-1">Thêm khoá học để test checkout.</div>
            </div>
          )}

          <div className="mt-6 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 flex items-center justify-between">
            <div className="text-sm text-slate-600">Tạm tính</div>
            <div className="font-extrabold text-indigo-700">{money(total)}</div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              className="btn btn-primary flex-1"
              type="button"
              onClick={() => window.alert("Checkout (demo). Bạn có thể điều hướng sang trang thanh toán thật.")}
              disabled={!items.length}
            >
              <i className="fa-solid fa-credit-card" /> Checkout (demo)
            </button>
            <button className="btn flex-1" type="button" onClick={onClose}>
              <i className="fa-solid fa-arrow-left" /> Tiếp tục xem
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CoursesPage() {
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState<"all" | CourseTopic>("all");
  const [sort, setSort] = useState<SortRule>("best");

  const [detailId, setDetailId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const [cartIds, setCartIds] = useState<string[]>(() => readCourseCart());

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();

    let list = COURSES.filter((c) => {
      if (topic !== "all" && c.topic !== topic) return false;
      if (qq) {
        const hay = (c.title + " " + c.desc).toLowerCase();
        if (!hay.includes(qq)) return false;
      }
      return true;
    });

    if (sort === "new") list = [...list].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    if (sort === "high") list = [...list].sort((a, b) => (b.price || 0) - (a.price || 0));
    if (sort === "low") list = [...list].sort((a, b) => (a.price || 0) - (b.price || 0));
    if (sort === "best") list = [...list].sort((a, b) => (b.popular || 0) - (a.popular || 0));

    return list;
  }, [q, topic, sort]);

  const selectedCourse = useMemo(() => {
    if (!detailId) return null;
    return COURSES.find((c) => c.id === detailId) || null;
  }, [detailId]);

  const cartItems = useMemo(() => {
    const set = new Set(cartIds.map((x) => x.toUpperCase()));
    return COURSES.filter((c) => set.has(c.id));
  }, [cartIds]);

  function addToCart(id: string) {
    const next = addCourseToCart(id);
    setCartIds(next);
    window.alert(`Đã thêm vào cart (demo): ${id}`);
  }

  function removeFromCart(id: string) {
    const next = removeCourseFromCart(id);
    setCartIds(next);
  }

  function clearCart() {
    if (!window.confirm("Xoá toàn bộ cart?")) return;
    const next = clearCourseCart();
    setCartIds(next);
  }

  function reset() {
    setQ("");
    setTopic("all");
    setSort("best");
  }

  return (
    <div className="text-slate-900">
      <SiteHeader />

      <main className="pb-12">
        {/* HERO full width */}
        <section className="relative">
          <img
            className="h-64 md:h-80 w-full object-cover"
            alt="Courses hero"
            src="https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=2400&q=80"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 to-indigo-700/25" />

          <div className="absolute inset-0">
            <div className="max-w-7xl mx-auto h-full px-4 py-8 flex flex-col justify-end">
              <div className="flex flex-wrap gap-2">
                <span className="chip">
                  <i className="fa-solid fa-graduation-cap text-amber-600" /> Academy
                </span>
                <span className="chip">
                  <i className="fa-solid fa-certificate text-emerald-600" /> Chứng chỉ
                </span>
                <span className="chip">
                  <i className="fa-solid fa-video text-indigo-600" /> Video + tài liệu
                </span>
              </div>

              <h1 className="mt-3 text-2xl md:text-4xl font-extrabold text-white">
                Khoá học AYANAVITA <span className="text-amber-300">chuẩn spa & vận hành</span>
              </h1>

              <div className="mt-4 flex flex-wrap gap-2">
                <button className="btn btn-accent" type="button" onClick={() => setCartOpen(true)}>
                  <i className="fa-solid fa-cart-shopping" />
                  Cart
                  <span className="chip ml-1">{cartIds.length}</span>
                </button>
                <Link className="btn btn-primary" to="/cart">
                  <i className="fa-solid fa-bag-shopping" />
                  Giỏ hàng sản phẩm
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FILTER BAR ngang (trên) */}
        <section className="px-4 -mt-6">
          <div className="max-w-7xl mx-auto">
            <div className="card p-4 md:p-5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="text-xs font-extrabold text-slate-500">Bộ lọc</div>
                  <div className="text-lg md:text-xl font-extrabold">Tìm & sắp xếp khoá học</div>
                  <div className="mt-1 text-sm text-slate-600">
                    Tìm thấy <b>{filtered.length}</b> khoá
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button className="btn" type="button" onClick={reset} aria-label="reset">
                    <i className="fa-solid fa-rotate-left" /> Reset
                  </button>
                  <button className="btn btn-primary" type="button" onClick={() => setCartOpen(true)}>
                    <i className="fa-solid fa-cart-shopping" /> Mở cart <span className="chip ml-1">{cartIds.length}</span>
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-12">
                {/* Search */}
                <div className="md:col-span-6">
                  <label className="text-sm font-extrabold text-slate-700">Từ khoá</label>
                  <input
                    className="field mt-2"
                    placeholder="VD: skincare, vận hành, tư vấn..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>

                {/* Topic */}
                <div className="md:col-span-3">
                  <label className="text-sm font-extrabold text-slate-700">Chủ đề</label>
                  <select className="field mt-2" value={topic} onChange={(e) => setTopic(e.target.value as any)}>
                    <option value="all">Tất cả</option>
                    <option value="technique">Kỹ thuật</option>
                    <option value="consult">Tư vấn</option>
                    <option value="ops">Vận hành</option>
                    <option value="product">Sản phẩm</option>
                  </select>
                </div>

                {/* Sort */}
                <div className="md:col-span-3">
                  <label className="text-sm font-extrabold text-slate-700">Sắp xếp</label>
                  <select className="field mt-2" value={sort} onChange={(e) => setSort(e.target.value as SortRule)}>
                    <option value="best">Phổ biến</option>
                    <option value="new">Mới nhất</option>
                    <option value="high">Giá cao → thấp</option>
                    <option value="low">Giá thấp → cao</option>
                  </select>
                </div>
              </div>

              <div className="mt-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 text-sm text-slate-700">
                Prototype: “Chi tiết” mở modal, “Thêm” vào cart.
              </div>
            </div>
          </div>
        </section>

        {/* LIST full trang */}
        <section className="px-4 mt-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between gap-3 flex-wrap">
              <div>
                <div className="text-xs font-extrabold text-slate-500">Danh sách</div>
                <div className="text-2xl font-extrabold">Khoá học nổi bật</div>
                <div className="mt-1 text-slate-600 text-sm">
                  Chọn khoá để xem chi tiết hoặc thêm vào cart.
                </div>
              </div>

              <div className="flex gap-2">
                <button className="btn" type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                  <i className="fa-solid fa-arrow-up" /> Lên đầu
                </button>
                <button className="btn btn-primary" type="button" onClick={() => setCartOpen(true)}>
                  <i className="fa-solid fa-cart-shopping" />
                  Cart <span className="chip ml-1">{cartIds.length}</span>
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((c) => (
                <article key={c.id} className="card overflow-hidden">
                  <div className="relative">
                    <img src={c.img} alt={c.title} className="w-full h-44 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/55 to-transparent" />
                    <div className="absolute left-4 bottom-4 flex flex-wrap gap-2">
                      <span className="chip">
                        <i className="fa-solid fa-layer-group text-indigo-600" />
                        {topicLabel(c.topic)}
                      </span>
                      <span className="chip">
                        <i className="fa-solid fa-clock text-amber-600" />
                        {c.hours}h
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="font-extrabold">{c.title}</div>

                    <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                      <Stars rating={c.rating} />
                      <b>{c.rating.toFixed(1)}</b>
                      <span className="muted">• {new Intl.NumberFormat("vi-VN").format(c.students)} HV</span>
                    </div>

                    <p className="mt-3 text-slate-700 leading-relaxed line-clamp-3">{c.desc}</p>

                    <div className="mt-4 flex items-center justify-between gap-2">
                      <div className="font-extrabold text-indigo-700">{money(c.price)}</div>
                      <div className="flex gap-2">
                        <button className="btn" type="button" onClick={() => setDetailId(c.id)}>
                          <i className="fa-solid fa-eye" /> Chi tiết
                        </button>
                        <button className="btn btn-primary" type="button" onClick={() => addToCart(c.id)}>
                          <i className="fa-solid fa-cart-plus" /> Thêm
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}

              {!filtered.length ? (
                <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 card p-8 text-center text-slate-600">
                  <div className="text-4xl">
                    <i className="fa-solid fa-box-open text-slate-400" />
                  </div>
                  <div className="mt-2 text-xl font-extrabold">Không có khoá học phù hợp</div>
                  <div className="mt-2">Thử đổi từ khoá/chủ đề khác.</div>
                  <button className="btn btn-primary mt-4" type="button" onClick={reset}>
                    <i className="fa-solid fa-rotate" /> Reset
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <CourseDetailModal
        open={!!detailId}
        course={selectedCourse}
        onClose={() => setDetailId(null)}
        onAdd={(id) => addToCart(id)}
      />

      <CourseCartModal
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onRemove={removeFromCart}
        onClear={clearCart}
      />
    </div>
  );
}
