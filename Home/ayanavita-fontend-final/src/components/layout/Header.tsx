import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

type HeaderProps = {
  onLogin?: () => void;
  onRegister?: () => void;
  onSearch?: () => void;
  brandHref?: string;
};

type DropdownKey = "products" | "pricing" | null;

type PreferredLanguage = "vi" | "en" | "ja";

const LANGUAGE_OPTIONS: Array<{ code: PreferredLanguage; label: string }> = [
  { code: "vi", label: "VI" },
  { code: "en", label: "EN" },
  { code: "ja", label: "JA" },
];

function normalizePreferredLanguage(raw: string | null): PreferredLanguage {
  const lang = raw?.trim().toLowerCase();
  if (lang === "en") return "en";
  if (lang === "ja") return "ja";
  return "vi";
}


export function Header({
  onLogin,
  onRegister,
  onSearch,
  brandHref = "/",
}: HeaderProps) {
  const [openDd, setOpenDd] = useState<DropdownKey>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [preferredLanguage, setPreferredLanguage] = useState<PreferredLanguage>(() => {
    if (typeof window === "undefined") return "vi";
    return normalizePreferredLanguage(window.localStorage.getItem("preferred-language"));
  });

  const rootRef = useRef<HTMLDivElement | null>(null);

  const menus = useMemo(
    () => ({
      products: [
        { label: "Danh mục sản phẩm", to: "/category" },
        { label: "Sản phẩm nổi bật", to: "/product" },
        { label: "Tìm sản phẩm phù hợp", to: "/quiz-fit" },
        { sep: true as const },
        { label: "Giỏ hàng", to: "/cart" },
        { label: "Thanh toán", to: "/checkout" },
      ],
      pricing: [
        { label: "Dịch vụ Spa", to: "/services" },
        { label: "Đặt lịch", to: "/booking" },
        { sep: true as const },
        { label: "Nhượng quyền", to: "/franchise" },
        { label: "Bộ tài liệu nhượng quyền", to: "/franchise-docs" },
      ],
    }),
    []
  );

  // close on outside click / ESC
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const root = rootRef.current;
      if (!root) return;
      if (!root.contains(e.target as Node)) {
        setOpenDd(null);
        setDrawerOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenDd(null);
        setDrawerOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // lock body scroll when drawer open
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  const toggleDd = (k: Exclude<DropdownKey, null>) => {
    setOpenDd((cur) => (cur === k ? null : k));
  };

  const setLanguage = (lang: PreferredLanguage) => {
    setPreferredLanguage(lang);
    if (typeof window === "undefined") return;
    window.localStorage.setItem("preferred-language", lang);
    window.dispatchEvent(new CustomEvent("preferred-language-changed", { detail: lang }));
  };

  return (
    <div ref={rootRef} className="sticky top-0 z-[80] border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 py-3">
        {/* Brand */}
        <Link to={brandHref} className="flex min-w-[180px] items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-2xl font-black text-white shadow-lg"
            style={{
              background:
                "linear-gradient(135deg,var(--aya-primary-1),var(--aya-primary-2))",
              boxShadow: "0 12px 24px rgba(79,70,229,.22)",
            }}
          >
            A
          </div>
          <div className="font-black tracking-[0.3px] text-slate-900">
            AYANAVITA
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden flex-1 items-center justify-center gap-3 lg:flex">
          {/* Products dropdown */}
          <div className="relative">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-transparent px-3 py-2 text-[15px] font-extrabold text-slate-900 hover:border-slate-200 hover:bg-slate-50"
              aria-expanded={openDd === "products"}
              onClick={() => toggleDd("products")}
            >
              Sản phẩm <span className="text-xs">▾</span>
            </button>

            {openDd === "products" ? (
              <div className="absolute left-0 top-[calc(100%+10px)] z-[60] min-w-[260px] rounded-2xl border border-slate-200/70 bg-white p-2 shadow-[0_18px_40px_rgba(2,6,23,.10)]">
                {menus.products.map((it, idx) =>
                  "sep" in it ? (
                    <div
                      key={`sep-${idx}`}
                      className="my-2 h-px bg-slate-200/70"
                    />
                  ) : (
                    <Link
                      key={it.to}
                      to={it.to}
                      className="block rounded-xl px-3 py-2 font-extrabold text-slate-900 hover:bg-slate-50"
                      onClick={() => setOpenDd(null)}
                    >
                      {it.label}
                    </Link>
                  )
                )}
              </div>
            ) : null}
          </div>

          {/* Pricing dropdown */}
          <div className="relative">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-transparent px-3 py-2 text-[15px] font-extrabold text-slate-900 hover:border-slate-200 hover:bg-slate-50"
              aria-expanded={openDd === "pricing"}
              onClick={() => toggleDd("pricing")}
            >
              Gói &amp; Giá <span className="text-xs">▾</span>
            </button>

            {openDd === "pricing" ? (
              <div className="absolute left-0 top-[calc(100%+10px)] z-[60] min-w-[260px] rounded-2xl border border-slate-200/70 bg-white p-2 shadow-[0_18px_40px_rgba(2,6,23,.10)]">
                {menus.pricing.map((it, idx) =>
                  "sep" in it ? (
                    <div
                      key={`sep-${idx}`}
                      className="my-2 h-px bg-slate-200/70"
                    />
                  ) : (
                    <Link
                      key={it.to}
                      to={it.to}
                      className="block rounded-xl px-3 py-2 font-extrabold text-slate-900 hover:bg-slate-50"
                      onClick={() => setOpenDd(null)}
                    >
                      {it.label}
                    </Link>
                  )
                )}
              </div>
            ) : null}
          </div>

          <Link
            to="/reviews"
            className="rounded-xl border border-transparent px-3 py-2 text-[15px] font-extrabold text-slate-900 hover:border-slate-200 hover:bg-slate-50"
          >
            Đánh giá
          </Link>
          <Link
            to="/blog"
            className="rounded-xl border border-transparent px-3 py-2 text-[15px] font-extrabold text-slate-900 hover:border-slate-200 hover:bg-slate-50"
          >
            Blog kiến thức
          </Link>
          <Link
            to="/contact"
            className="rounded-xl border border-transparent px-3 py-2 text-[15px] font-extrabold text-slate-900 hover:border-slate-200 hover:bg-slate-50"
          >
            Liên hệ
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex min-w-fit items-center gap-2 lg:min-w-[260px] lg:justify-end">
          <div className="hidden items-center rounded-full border border-slate-200 bg-white p-1 md:inline-flex">
            {LANGUAGE_OPTIONS.map((item) => (
              <button
                key={item.code}
                type="button"
                className={`rounded-full px-2.5 py-1 text-xs font-black ${preferredLanguage === item.code ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"}`}
                onClick={() => setLanguage(item.code)}
                aria-label={`Switch language to ${item.code}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
              type="button"
              onClick={onSearch}
              title="Tìm kiếm"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-50"
          >
            <i className="fa-solid fa-magnifying-glass"></i>
          </button>

          <button
              type="button"
            onClick={onLogin}
            className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 font-black text-slate-900 hover:bg-slate-50 sm:inline-flex"
          >
            Đăng nhập
          </button>

          <button
            type="button"
            onClick={onRegister}
            className="inline-flex rounded-full px-4 py-2 font-black text-slate-900"
            style={{
              background:
                "linear-gradient(135deg,var(--aya-accent-1),var(--aya-accent-2))",
              border: "1px solid rgba(17,24,39,.10)",
            }}
          >
            Đăng ký
          </button>

          {/* Mobile burger */}
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 lg:hidden"
            aria-label="Open menu"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen((v) => !v)}
          >
            ☰
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {drawerOpen ? (
        <div
          className="fixed inset-0 z-[90] bg-slate-950/55 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDrawerOpen(false);
          }}
        >
          <div className="mx-auto max-w-[560px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(2,6,23,.25)]">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="font-black text-slate-900">Menu</div>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white hover:bg-slate-50"
                aria-label="Close menu"
                onClick={() => setDrawerOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="grid gap-2 p-4">
              <details className="overflow-hidden rounded-2xl border border-slate-200">
                <summary className="cursor-pointer bg-slate-50 px-4 py-3 font-black">
                  Sản phẩm
                </summary>
                <div className="grid">
                  {menus.products
                    .filter((x) => !("sep" in x))
                    .map((it) => (
                      <Link
                        key={(it as any).to}
                        to={(it as any).to}
                        className="border-t border-slate-200 px-4 py-3 font-extrabold text-slate-900 hover:bg-slate-50"
                        onClick={() => setDrawerOpen(false)}
                      >
                        {(it as any).label}
                      </Link>
                    ))}
                </div>
              </details>

              <details className="overflow-hidden rounded-2xl border border-slate-200">
                <summary className="cursor-pointer bg-slate-50 px-4 py-3 font-black">
                  Gói &amp; Giá
                </summary>
                <div className="grid">
                  {menus.pricing
                    .filter((x) => !("sep" in x))
                    .map((it) => (
                      <Link
                        key={(it as any).to}
                        to={(it as any).to}
                        className="border-t border-slate-200 px-4 py-3 font-extrabold text-slate-900 hover:bg-slate-50"
                        onClick={() => setDrawerOpen(false)}
                      >
                        {(it as any).label}
                      </Link>
                    ))}
                </div>
              </details>

              <Link
                to="/reviews"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-black text-slate-900"
                onClick={() => setDrawerOpen(false)}
              >
                Đánh giá
              </Link>
              <Link
                to="/blog"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-black text-slate-900"
                onClick={() => setDrawerOpen(false)}
              >
                Blog kiến thức
              </Link>
              <Link
                to="/contact"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-black text-slate-900"
                onClick={() => setDrawerOpen(false)}
              >
                Liên hệ
              </Link>

              <div className="mt-2">
                <div className="mb-2 text-xs font-extrabold uppercase text-slate-500">Ngôn ngữ</div>
                <div className="grid grid-cols-3 gap-2">
                  {LANGUAGE_OPTIONS.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      className={`rounded-xl border px-3 py-2 text-sm font-black ${preferredLanguage === item.code ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"}`}
                      onClick={() => setLanguage(item.code)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-2 grid gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    onLogin?.();
                  }}
                  className="w-full rounded-full border border-slate-200 bg-white px-4 py-3 font-black text-slate-900 hover:bg-slate-50"
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    onRegister?.();
                  }}
                  className="w-full rounded-full px-4 py-3 font-black text-slate-900"
                  style={{
                    background:
                      "linear-gradient(135deg,var(--aya-accent-1),var(--aya-accent-2))",
                    border: "1px solid rgba(17,24,39,.10)",
                  }}
                >
                  Đăng ký
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
