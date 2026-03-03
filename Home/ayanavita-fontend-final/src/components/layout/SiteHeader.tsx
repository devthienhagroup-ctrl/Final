// src/components/layout/SiteHeader.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useParams } from "react-router-dom";
import { http } from "../../api/http";

type Props = {
  active?: "products" | "services" | "booking" | "franchise" | "account" | "courses" | "cart";
};

type CourseHeaderData = {
  id: number;
  slug: string;
  title: string;
  shortDescription?: string | null;
  description?: string | null;
  thumbnail?: string | null;
  price?: number;
  ratingAvg?: number;
  ratingCount?: number;
  enrollmentCount?: number;
  time?: string | null;
  level?: string | null;
  topic?: { id: number; name: string } | null;
  lessons?: Array<{ id: number; modules?: Array<{ id: number }> }>;
};

const COURSE_CART_KEY = "aya_courses_cart_v1";
const COURSE_THUMBNAIL_FALLBACK =
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1400&q=80";

function readCartCount(): number {
  try {
    const raw = localStorage.getItem(COURSE_CART_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.length : 0;
  } catch {
    return 0;
  }
}

function toMinuteLabel(raw?: string | null) {
  if (!raw) return "-";
  const n = Number(String(raw).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return "-";
  return `${Math.round(n * 60)} phút`;
}

export function SiteHeader({ active }: Props) {
  const location = useLocation();
  const { slug } = useParams<{ slug?: string }>();

  const [open, setOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const [course, setCourse] = useState<CourseHeaderData | null>(null);
  const [loadingCourse, setLoadingCourse] = useState(false);
  const [lang, setLang] = useState(() => localStorage.getItem("preferred-language") || "vi");

  const isCourseDetailRoute = Boolean(slug) && location.pathname.startsWith("/courses/") && location.pathname !== "/courses/player";

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `navlink ${isActive ? "active" : ""}`;

  const navlink = (k: NonNullable<Props["active"]>) =>
    `navlink ${active === k ? "active" : ""}`;

  const useForcedActive = useMemo(() => Boolean(active), [active]);

  useEffect(() => {
    setCartCount(readCartCount());

    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === COURSE_CART_KEY) setCartCount(readCartCount());
    };

    const onCustom = () => setCartCount(readCartCount());

    window.addEventListener("storage", onStorage);
    window.addEventListener("aya_cart_changed", onCustom as EventListener);
    window.addEventListener("aya_course_cart_changed", onCustom as EventListener);

    const t = window.setInterval(() => setCartCount(readCartCount()), 1200);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("aya_cart_changed", onCustom as EventListener);
      window.removeEventListener("aya_course_cart_changed", onCustom as EventListener);
      window.clearInterval(t);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onLangChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ language?: string }>;
      if (customEvent.detail?.language) setLang(customEvent.detail.language);
    };
    window.addEventListener("languageChange", onLangChange as EventListener);
    return () => window.removeEventListener("languageChange", onLangChange as EventListener);
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!isCourseDetailRoute || !slug) {
      setCourse(null);
      return;
    }

    (async () => {
      setLoadingCourse(true);
      try {
        const res = await http.get(`/public/courses/slug/${encodeURIComponent(slug)}`, {
          params: { lang },
        });
        if (!cancelled) setCourse(res.data || null);
      } catch {
        if (!cancelled) setCourse(null);
      } finally {
        if (!cancelled) setLoadingCourse(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isCourseDetailRoute, slug, lang]);

  const totalModules = useMemo(
    () => (course?.lessons || []).reduce((sum, lesson) => sum + (lesson.modules?.length || 0), 0),
    [course?.lessons],
  );

  if (isCourseDetailRoute) {
    return (
      <header className="py-3 max-w-6xl mx-auto">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <div className="grid lg:grid-cols-5">
            <div className="lg:col-span-2">
              <div className="relative h-[220px] sm:h-[280px] lg:h-full">
                <img
                  className="absolute inset-0 h-full w-full object-cover"
                  src={course?.thumbnail || COURSE_THUMBNAIL_FALLBACK}
                  alt={course?.title || "Course cover"}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-950/20 to-transparent" />

                <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
                  <span className="chip">
                    <i className="fa-solid fa-star text-amber-500" />
                    {Number(course?.ratingAvg || 0).toFixed(1)} ({Number(course?.ratingCount || 0)})
                  </span>
                  <span className="chip">
                    <i className="fa-solid fa-users text-indigo-600" />
                    {new Intl.NumberFormat("vi-VN").format(Number(course?.enrollmentCount || 0))}
                  </span>
                  <span className="chip">
                    <i className="fa-solid fa-clock text-emerald-600" />
                    {toMinuteLabel(course?.time)}
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-xs font-extrabold text-slate-500">COURSE DETAIL</div>
                  <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">
                    {loadingCourse ? "Đang tải..." : course?.title || "Khóa học"}
                  </h1>
                  {course?.topic?.name ? (
                    <div className="mt-2 text-xs font-semibold uppercase tracking-wide text-indigo-600">{course.topic.name}</div>
                  ) : null}
                  <p className="mt-2 text-sm text-slate-600">
                    {course?.shortDescription || course?.description || "Thông tin khóa học đang được cập nhật."}
                  </p>
                </div>

                <div className="flex gap-2">
                  <span className="chip">
                    <i className="fa-solid fa-tag text-emerald-600" />₫ {new Intl.NumberFormat("vi-VN").format(Number(course?.price || 0))}
                  </span>
                  <span className="chip">
                    <i className="fa-solid fa-signal text-indigo-600" />
                    {course?.level || "Beginner"}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-600">
                  {course?.lessons?.length || 0} bài học • {totalModules} module
                </div>
                <div className="text-base font-extrabold text-slate-800">
                  <span className="text-slate-900">Đăng ký:</span> {new Intl.NumberFormat("vi-VN").format(Number(course?.enrollmentCount || 0))} học viên
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="px-4 py-4">
      <div className="max-w-6xl mx-auto card px-5 py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl gradient-primary text-white flex items-center justify-center font-extrabold">
                A
              </div>
              <div>
                <div className="font-extrabold text-lg">AYANAVITA</div>
                <div className="text-xs font-extrabold text-slate-500">
                  Spa • Beauty • Health • Franchise ưertyuiop
                </div>
              </div>
            </Link>

            <div className="md:hidden flex items-center gap-2">
              <Link className="btn" to="/cart" aria-label="Cart">
                <i className="fa-solid fa-cart-shopping" />
                <span className="chip ml-1">{cartCount}</span>
              </Link>

              <button
                className="btn"
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label="Toggle menu"
              >
                <i className="fa-solid fa-bars" />
              </button>
            </div>
          </div>

          <nav className="hidden md:flex gap-2 flex-wrap items-center">
            {useForcedActive ? (
              <>
                <Link className={navlink("products")} to="/products"><i className="fa-solid fa-store mr-2" />Sản phẩm</Link>
                <Link className={navlink("services")} to="/services"><i className="fa-solid fa-spa mr-2" />Dịch vụ</Link>
                <Link className={navlink("courses")} to="/courses"><i className="fa-solid fa-graduation-cap mr-2" />Khoá học</Link>
                <Link className={navlink("booking")} to="/booking"><i className="fa-solid fa-calendar-check mr-2" />Đặt lịch</Link>
                <Link className={navlink("franchise")} to="/franchise"><i className="fa-solid fa-handshake mr-2" />Nhượng quyền</Link>
                <Link className={navlink("account")} to="/account"><i className="fa-solid fa-user mr-2" />Tài khoản</Link>
              </>
            ) : (
              <>
                <NavLink className={navClass} to="/products"><i className="fa-solid fa-store mr-2" />Sản phẩm</NavLink>
                <NavLink className={navClass} to="/services"><i className="fa-solid fa-spa mr-2" />Dịch vụ</NavLink>
                <NavLink className={navClass} to="/courses"><i className="fa-solid fa-graduation-cap mr-2" />Khoá học</NavLink>
                <NavLink className={navClass} to="/booking"><i className="fa-solid fa-calendar-check mr-2" />Đặt lịch</NavLink>
                <NavLink className={navClass} to="/franchise"><i className="fa-solid fa-handshake mr-2" />Nhượng quyền</NavLink>
                <NavLink className={navClass} to="/account"><i className="fa-solid fa-user mr-2" />Tài khoản</NavLink>
              </>
            )}
          </nav>

          <div className="hidden md:flex gap-2 items-center">
            <Link className="btn" to="/cart"><i className="fa-solid fa-cart-shopping mr-2" />Cart <span className="chip ml-1">{cartCount}</span></Link>
            <Link className="btn btn-primary" to="/booking"><i className="fa-solid fa-calendar-check mr-2" />Đặt ngay</Link>
          </div>

          {open ? (
            <nav className="md:hidden grid gap-2 pt-2 border-t border-slate-200">
              <NavLink className={navClass} to="/products"><i className="fa-solid fa-store mr-2" />Sản phẩm</NavLink>
              <NavLink className={navClass} to="/services"><i className="fa-solid fa-spa mr-2" />Dịch vụ</NavLink>
              <NavLink className={navClass} to="/courses"><i className="fa-solid fa-graduation-cap mr-2" />Khoá học</NavLink>
              <NavLink className={navClass} to="/booking"><i className="fa-solid fa-calendar-check mr-2" />Đặt lịch</NavLink>
              <NavLink className={navClass} to="/franchise"><i className="fa-solid fa-handshake mr-2" />Nhượng quyền</NavLink>
              <NavLink className={navClass} to="/account"><i className="fa-solid fa-user mr-2" />Tài khoản</NavLink>

              <div className="flex gap-2 pt-1">
                <Link className="btn flex-1" to="/cart"><i className="fa-solid fa-cart-shopping mr-2" />Cart <span className="chip ml-1">{cartCount}</span></Link>
                <Link className="btn btn-primary flex-1" to="/booking"><i className="fa-solid fa-calendar-check mr-2" />Đặt ngay</Link>
              </div>
            </nav>
          ) : null}
        </div>
      </div>
    </header>
  );
}
