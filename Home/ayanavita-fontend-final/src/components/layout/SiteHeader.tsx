// src/components/layout/SiteHeader.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

type Props = {
  active?: "products" | "services" | "booking" | "franchise" | "account" | "courses" | "cart";
};

const COURSE_CART_KEY = "aya_courses_cart_v1";

function readCartCount(): number {
  try {
    const raw = localStorage.getItem(COURSE_CART_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.length : 0;
  } catch {
    return 0;
  }
}

export function SiteHeader({ active }: Props) {
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `navlink ${isActive ? "active" : ""}`;

  // Optional: fallback when you want to force active by prop (if routes are placeholders)
  const navlink = (k: NonNullable<Props["active"]>) =>
    `navlink ${active === k ? "active" : ""}`;

  const useForcedActive = useMemo(() => Boolean(active), [active]);

  useEffect(() => {
    // init
    setCartCount(readCartCount());

    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === COURSE_CART_KEY) setCartCount(readCartCount());
    };

    const onCustom = () => setCartCount(readCartCount());

    window.addEventListener("storage", onStorage);
    window.addEventListener("aya_cart_changed", onCustom as EventListener);
    window.addEventListener("aya_course_cart_changed", onCustom as EventListener);

    // fallback: update within same tab even if you didn't dispatch events
    const t = window.setInterval(() => setCartCount(readCartCount()), 1200);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("aya_cart_changed", onCustom as EventListener);
      window.removeEventListener("aya_course_cart_changed", onCustom as EventListener);
      window.clearInterval(t);
    };
  }, []);

  // close mobile menu on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header className="">
      <div className=" mx-auto px-5 py-4">
        <div className="max-w-7xl mx-auto flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Brand */}
          <div className="flex items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl gradient-primary text-white flex items-center justify-center font-extrabold">
                A
              </div>
              <div>
                <div className="font-extrabold text-lg">AYANAVITA</div>
                <div className="text-xs font-extrabold text-slate-500">
                  Spa • Beauty • Health • Franchise
                </div>
              </div>
            </Link>

            {/* Mobile actions */}
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

          {/* Desktop nav */}
          <nav className="hidden md:flex gap-2 flex-wrap items-center">
            {useForcedActive ? (
              <>
                <Link className={navlink("products")} to="/products">
                  <i className="fa-solid fa-store mr-2" />
                  Sản phẩm
                </Link>
                <Link className={navlink("services")} to="/services">
                  <i className="fa-solid fa-spa mr-2" />
                  Dịch vụ
                </Link>
                <Link className={navlink("courses")} to="/courses">
                  <i className="fa-solid fa-graduation-cap mr-2" />
                  Khoá học
                </Link>
                <Link className={navlink("booking")} to="/booking">
                  <i className="fa-solid fa-calendar-check mr-2" />
                  Đặt lịch
                </Link>
                <Link className={navlink("franchise")} to="/franchise">
                  <i className="fa-solid fa-handshake mr-2" />
                  Nhượng quyền
                </Link>
                <Link className={navlink("account")} to="/account">
                  <i className="fa-solid fa-user mr-2" />
                  Tài khoản
                </Link>
              </>
            ) : (
              <>
                <NavLink className={navClass} to="/products">
                  <i className="fa-solid fa-store mr-2" />
                  Sản phẩm
                </NavLink>
                <NavLink className={navClass} to="/services">
                  <i className="fa-solid fa-spa mr-2" />
                  Dịch vụ
                </NavLink>
                <NavLink className={navClass} to="/courses">
                  <i className="fa-solid fa-graduation-cap mr-2" />
                  Khoá học
                </NavLink>
                <NavLink className={navClass} to="/booking">
                  <i className="fa-solid fa-calendar-check mr-2" />
                  Đặt lịch
                </NavLink>
                <NavLink className={navClass} to="/franchise">
                  <i className="fa-solid fa-handshake mr-2" />
                  Nhượng quyền
                </NavLink>
{/*                <NavLink className={navClass} to="/account">
                  <i className="fa-solid fa-user mr-2" />
                  Tài khoản
                </NavLink>*/}
              </>
            )}
          </nav>

          {/* Desktop right actions */}
          <div className="hidden md:flex gap-2 items-center">
            <Link className="btn" to="/cart">
              <i className="fa-solid fa-cart-shopping mr-2" />
              <span className="chip ml-1">{cartCount}</span>
            </Link>

            <Link className="btn btn-primary hover:text-purple-700" to="/booking">
              <i className="fa-solid fa-calendar-check mr-2" />
              Đặt ngay
            </Link>
          </div>

          {/* Mobile nav panel */}
          {open ? (
            <nav className="md:hidden grid gap-2 pt-2 border-t border-slate-200">
              <NavLink className={navClass} to="/products">
                <i className="fa-solid fa-store mr-2" />
                Sản phẩm
              </NavLink>
              <NavLink className={navClass} to="/services">
                <i className="fa-solid fa-spa mr-2" />
                Dịch vụ
              </NavLink>
              <NavLink className={navClass} to="/courses">
                <i className="fa-solid fa-graduation-cap mr-2" />
                Khoá học
              </NavLink>
              <NavLink className={navClass} to="/booking">
                <i className="fa-solid fa-calendar-check mr-2" />
                Đặt lịch
              </NavLink>
              <NavLink className={navClass} to="/franchise">
                <i className="fa-solid fa-handshake mr-2" />
                Nhượng quyền
              </NavLink>
              <NavLink className={navClass} to="/account">
                <i className="fa-solid fa-user mr-2" />
                Tài khoản
              </NavLink>

              <div className="flex gap-2 pt-1">
                <Link className="btn flex-1" to="/cart">
                  <i className="fa-solid fa-cart-shopping mr-2" />
                  Cart <span className="chip ml-1">{cartCount}</span>
                </Link>
                <Link className="btn btn-primary flex-1" to="/booking">
                  <i className="fa-solid fa-calendar-check mr-2" />
                  Đặt ngay
                </Link>
              </div>
            </nav>
          ) : null}
        </div>
      </div>
    </header>
  );
}
