import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthModal } from "../home/AuthModal";
import { SuccessModal } from "../home/SuccessModal";

type HeaderProps = {
  brandHref?: string;
  cmsData?: HeaderCMSData;   // Thêm prop cmsData
};

type DropdownKey = "products" | "pricing" | null;
type AuthTab = "login" | "register";
type Language = "vi" | "en" | "de";

// Định nghĩa kiểu cho dữ liệu CMS
type HeaderCMSData = {
  brandText: string;
  productsDropdownLabel: string;
  productsDropdownItems: Array<{ label: string; to: string } | { separator: true }>;
  pricingDropdownLabel: string;
  pricingDropdownItems: Array<{ label: string; to: string } | { separator: true }>;
  navLinks: Array<{ label: string; to: string }>;
  loginButtonText: string;
  registerButtonText: string;
  languageOptions?: Array<{ code: string; label: string; flag: string }>;
};

// Nội dung mẫu (default) – giống với nội dung cứng hiện tại
const defaultCMSData: HeaderCMSData = {
  brandText: "AYANAVITA",
  productsDropdownLabel: "Sản phẩm",
  productsDropdownItems: [
    { label: "Danh mục sản phẩm", to: "/category" },
    { label: "Sản phẩm nổi bật", to: "/products" },
    { label: "Tìm sản phẩm phù hợp", to: "/quiz-fit" },
    { separator: true },
    { label: "Giỏ hàng", to: "/cart" },
  ],
  pricingDropdownLabel: "Gói & Giá",
  pricingDropdownItems: [
    { label: "Dịch vụ Spa", to: "/services" },
    { label: "Đặt lịch", to: "/booking" },
    { separator: true },
    { label: "Nhượng quyền", to: "/franchise" },
    { label: "Bộ tài liệu nhượng quyền", to: "/franchise-docs" },
  ],
  navLinks: [
    { label: "Đánh giá", to: "/reviews" },
    { label: "Blog kiến thức", to: "/blog" },
    { label: "Liên hệ", to: "/contact" },
  ],
  loginButtonText: "Đăng nhập",
  registerButtonText: "Đăng ký",
  languageOptions: [
    { code: "vi", label: "Tiếng Việt", flag: "fi-vn" },
    { code: "en", label: "English", flag: "fi-gb" },
    { code: "de", label: "Deutsch", flag: "fi-de" },
  ],
};

export function Header({ brandHref = "/", cmsData }: HeaderProps) {
  // Kết hợp dữ liệu CMS (nếu có) với default
  const cms = cmsData ?? defaultCMSData;

  const location = useLocation();
  const [openDd, setOpenDd] = useState<DropdownKey>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<AuthTab>("login");
  const [success, setSuccess] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });
  // Khởi tạo language từ localStorage, mặc định là "vi"
  const [language, setLanguage] = useState<Language>(() => {
    const savedLang = localStorage.getItem("preferred-language") as Language;
    return savedLang || "vi";
  });

  const [langOpen, setLangOpen] = useState(false);

  const rootRef = useRef<HTMLDivElement | null>(null);

  // Lưu language vào localStorage mỗi khi thay đổi
  useEffect(() => {
    localStorage.setItem("preferred-language", language);
    // Bạn có thể dispatch một custom event để các component khác biết language đã thay đổi
    window.dispatchEvent(new CustomEvent('languageChange', { detail: { language } }));
  }, [language]);

  // Helper để kiểm tra link active
  const isActiveLink = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  // Kiểm tra xem dropdown products có đang active không (dựa vào các đường dẫn con)
  const isProductsActive = useMemo(() => {
    return cms.productsDropdownItems.some(
        (item) => !("separator" in item) && location.pathname.startsWith(item.to)
    );
  }, [location.pathname, cms.productsDropdownItems]);

  const isPricingActive = useMemo(() => {
    return cms.pricingDropdownItems.some(
        (item) => !("separator" in item) && location.pathname.startsWith(item.to)
    );
  }, [location.pathname, cms.pricingDropdownItems]);

  // close on outside click / ESC
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const root = rootRef.current;
      if (!root) return;
      if (!root.contains(e.target as Node)) {
        setOpenDd(null);
        setDrawerOpen(false);
        setLangOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenDd(null);
        setDrawerOpen(false);
        setLangOpen(false);
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

  const openAuth = (tab: AuthTab) => {
    setAuthTab(tab);
    setAuthOpen(true);
  };

  const openSuccess = (message: string) => {
    setSuccess({ open: true, message });
  };

  const handleLoginSuccess = () => {
    setAuthOpen(false);
    openSuccess("Đăng nhập thành công (prototype). Sau này bạn sẽ lưu token từ API.");
  };

  const handleRegisterSuccess = () => {
    setAuthOpen(false);
    openSuccess(
        "Đăng ký thành công (prototype). Sau này bạn sẽ gọi API tạo user và gửi email xác thực."
    );
  };

  // Xác định options ngôn ngữ (từ CMS hoặc default)
  const languageOptions = cms.languageOptions ?? defaultCMSData.languageOptions!;

  return (
      <>
        <div ref={rootRef} className="sticky top-0 z-[80] border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 py-3">
            {/* Brand */}
            <Link
                to={brandHref}
                className="flex min-w-[180px] items-center gap-3 transition-transform duration-300 hover:scale-[1.02]"
            >
              <div
                  className="flex h-10 w-10 items-center justify-center rounded-2xl font-black text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:rotate-3"
                  style={{
                    background:
                        "linear-gradient(135deg,var(--aya-primary-1),var(--aya-primary-2))",
                    boxShadow: "0 12px 24px rgba(79,70,229,.22)",
                  }}
              >
                A
              </div>
              <div className="font-black tracking-[0.3px] text-slate-900">
                {cms.brandText}
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
              {/* Products dropdown */}
              <div className="relative">
                <button
                    type="button"
                    className={`group inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[15px] font-extrabold transition-all duration-200 ${
                        openDd === "products" || isProductsActive
                            ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border-indigo-200"
                            : "border border-transparent text-slate-900 hover:border-indigo-200 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 hover:shadow-md hover:scale-[1.02]"
                    }`}
                    aria-expanded={openDd === "products"}
                    onClick={() => toggleDd("products")}
                >
                <span className="relative">
                  {cms.productsDropdownLabel}
                  {(openDd === "products" || isProductsActive) && (
                      <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></span>
                  )}
                </span>
                  <span
                      className={`text-xs transition-transform duration-200 group-hover:translate-y-0.5 ${
                          openDd === "products" ? "rotate-180" : ""
                      }`}
                  >
                  ▾
                </span>
                </button>

                {openDd === "products" && (
                    <div className="absolute left-0 top-[calc(100%+10px)] z-[60] min-w-[260px] animate-in fade-in slide-in-from-top-2 duration-200 rounded-2xl border border-slate-200/70 bg-white p-2 shadow-[0_18px_40px_rgba(2,6,23,.10)]">
                      {cms.productsDropdownItems.map((it, idx) =>
                          "separator" in it ? (
                              <div
                                  key={`sep-${idx}`}
                                  className="my-2 h-px bg-slate-200/70"
                              />
                          ) : (
                              <Link
                                  key={it.to}
                                  to={it.to}
                                  className={`block rounded-xl px-3 py-2 font-extrabold transition-all duration-200 ${
                                      isActiveLink(it.to)
                                          ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700"
                                          : "text-slate-900 hover:bg-indigo-50 hover:text-indigo-700 hover:translate-x-1"
                                  }`}
                                  onClick={() => setOpenDd(null)}
                              >
                                {it.label}
                              </Link>
                          )
                      )}
                    </div>
                )}
              </div>

              {/* Pricing dropdown */}
              <div className="relative">
                <button
                    type="button"
                    className={`group inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[15px] font-extrabold transition-all duration-200 ${
                        openDd === "pricing" || isPricingActive
                            ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border-indigo-200"
                            : "border border-transparent text-slate-900 hover:border-indigo-200 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 hover:shadow-md hover:scale-[1.02]"
                    }`}
                    aria-expanded={openDd === "pricing"}
                    onClick={() => toggleDd("pricing")}
                >
                <span className="relative">
                  {cms.pricingDropdownLabel}
                  {(openDd === "pricing" || isPricingActive) && (
                      <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></span>
                  )}
                </span>
                  <span
                      className={`text-xs transition-transform duration-200 group-hover:translate-y-0.5 ${
                          openDd === "pricing" ? "rotate-180" : ""
                      }`}
                  >
                  ▾
                </span>
                </button>

                {openDd === "pricing" && (
                    <div className="absolute left-0 top-[calc(100%+10px)] z-[60] min-w-[260px] animate-in fade-in slide-in-from-top-2 duration-200 rounded-2xl border border-slate-200/70 bg-white p-2 shadow-[0_18px_40px_rgba(2,6,23,.10)]">
                      {cms.pricingDropdownItems.map((it, idx) =>
                          "separator" in it ? (
                              <div
                                  key={`sep-${idx}`}
                                  className="my-2 h-px bg-slate-200/70"
                              />
                          ) : (
                              <Link
                                  key={it.to}
                                  to={it.to}
                                  className={`block rounded-xl px-3 py-2 font-extrabold transition-all duration-200 ${
                                      isActiveLink(it.to)
                                          ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700"
                                          : "text-slate-900 hover:bg-indigo-50 hover:text-indigo-700 hover:translate-x-1"
                                  }`}
                                  onClick={() => setOpenDd(null)}
                              >
                                {it.label}
                              </Link>
                          )
                      )}
                    </div>
                )}
              </div>

              {/* Các link điều hướng đơn (reviews, blog, contact) */}
              {cms.navLinks.map((link) => (
                  <Link
                      key={link.to}
                      to={link.to}
                      className={`relative rounded-xl px-3 py-2 text-[15px] font-extrabold transition-all duration-200 ${
                          isActiveLink(link.to)
                              ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700"
                              : "border border-transparent text-slate-900 hover:border-indigo-200 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 hover:shadow-md hover:scale-[1.02]"
                      }`}
                  >
                <span className="relative">
                  {link.label}
                  {isActiveLink(link.to) && (
                      <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></span>
                  )}
                </span>
                  </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex min-w-fit items-center gap-2 lg:min-w-[260px] lg:justify-end">
              {/* Ngôn ngữ (Desktop) */}
              <div className="relative hidden sm:block">
                <button
                    type="button"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-lg transition-all duration-200 hover:border-indigo-200 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 hover:shadow-md hover:scale-110"
                    onClick={() => setLangOpen(!langOpen)}
                >
                <span
                    className={`fi ${
                        languageOptions.find((opt) => opt.code === language)?.flag ??
                        "fi-vn"
                    }`}
                    style={{ width: 24, height: 18 }}
                />
                </button>

                {langOpen && (
                    <div className="absolute right-0 top-[calc(100%+10px)] z-[60] min-w-[160px] animate-in fade-in slide-in-from-top-2 duration-200 rounded-2xl border border-slate-200/70 bg-white p-2 shadow-[0_18px_40px_rgba(2,6,23,.10)]">
                      {languageOptions.map((opt) => (
                          <button
                              key={opt.code}
                              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-extrabold transition-all duration-200 ${
                                  language === opt.code
                                      ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700"
                                      : "text-slate-900 hover:bg-indigo-50 hover:text-indigo-700"
                              }`}
                              onClick={() => {
                                setLanguage(opt.code as Language);
                                setLangOpen(false);
                              }}
                          >
                            <span className={`fi ${opt.flag} mr-2`} style={{ width: 20, height: 15 }} />
                            {opt.label}
                          </button>
                      ))}
                    </div>
                )}
              </div>

              {/* Nút Đăng nhập */}
              <button
                  type="button"
                  onClick={() => openAuth("login")}
                  className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 font-black text-slate-900 transition-all duration-200 hover:border-indigo-200 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 hover:shadow-md hover:scale-[1.02] sm:inline-flex"
              >
                {cms.loginButtonText}
              </button>

              {/* Nút Đăng ký */}
              <button
                  type="button"
                  onClick={() => openAuth("register")}
                  className="inline-flex rounded-full px-4 py-2 font-black text-slate-900 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:brightness-110"
                  style={{
                    background:
                        "linear-gradient(135deg,var(--aya-accent-1),var(--aya-accent-2))",
                    border: "1px solid rgba(17,24,39,.10)",
                  }}
              >
                {cms.registerButtonText}
              </button>

              {/* Mobile burger */}
              <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white transition-all duration-200 hover:border-indigo-200 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 hover:shadow-md hover:scale-110 lg:hidden"
                  aria-label="Open menu"
                  aria-expanded={drawerOpen}
                  onClick={() => setDrawerOpen((v) => !v)}
              >
                ☰
              </button>
            </div>
          </div>

          {/* Mobile Drawer */}
          {drawerOpen && (
              <div
                  className="fixed inset-0 z-[90] bg-slate-950/55 p-4 animate-in fade-in duration-200"
                  onMouseDown={(e) => {
                    if (e.target === e.currentTarget) setDrawerOpen(false);
                  }}
              >
                <div className="mx-auto max-w-[560px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(2,6,23,.25)] animate-in slide-in-from-top-4 duration-300">
                  <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                    <div className="font-black text-slate-900">Menu</div>
                    <button
                        type="button"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white transition-all duration-200 hover:border-indigo-200 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 hover:rotate-90 hover:shadow-md"
                        aria-label="Close menu"
                        onClick={() => setDrawerOpen(false)}
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid gap-2 p-4">
                    <details className="overflow-hidden rounded-2xl border border-slate-200">
                      <summary className="cursor-pointer bg-slate-50 px-4 py-3 font-black transition-colors hover:bg-indigo-50 hover:text-indigo-700">
                        {cms.productsDropdownLabel}
                      </summary>
                      <div className="grid">
                        {cms.productsDropdownItems
                            .filter((item): item is { label: string; to: string } => !("separator" in item))
                            .map((it) => (
                                <Link
                                    key={it.to}
                                    to={it.to}
                                    className={`border-t border-slate-200 px-4 py-3 font-extrabold transition-all duration-200 ${
                                        isActiveLink(it.to)
                                            ? "bg-indigo-50 text-indigo-700"
                                            : "text-slate-900 hover:bg-indigo-50 hover:text-indigo-700 hover:translate-x-1"
                                    }`}
                                    onClick={() => setDrawerOpen(false)}
                                >
                                  {it.label}
                                </Link>
                            ))}
                      </div>
                    </details>

                    <details className="overflow-hidden rounded-2xl border border-slate-200">
                      <summary className="cursor-pointer bg-slate-50 px-4 py-3 font-black transition-colors hover:bg-indigo-50 hover:text-indigo-700">
                        {cms.pricingDropdownLabel}
                      </summary>
                      <div className="grid">
                        {cms.pricingDropdownItems
                            .filter((item): item is { label: string; to: string } => !("separator" in item))
                            .map((it) => (
                                <Link
                                    key={it.to}
                                    to={it.to}
                                    className={`border-t border-slate-200 px-4 py-3 font-extrabold transition-all duration-200 ${
                                        isActiveLink(it.to)
                                            ? "bg-indigo-50 text-indigo-700"
                                            : "text-slate-900 hover:bg-indigo-50 hover:text-indigo-700 hover:translate-x-1"
                                    }`}
                                    onClick={() => setDrawerOpen(false)}
                                >
                                  {it.label}
                                </Link>
                            ))}
                      </div>
                    </details>

                    {/* Các link đơn trong mobile */}
                    {cms.navLinks.map((link) => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className={`rounded-2xl border border-slate-200 px-4 py-3 font-black transition-all duration-200 ${
                                isActiveLink(link.to)
                                    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                    : "bg-slate-50 text-slate-900 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 hover:shadow-md hover:translate-x-1"
                            }`}
                            onClick={() => setDrawerOpen(false)}
                        >
                          {link.label}
                        </Link>
                    ))}

                    {/* Chọn ngôn ngữ trong drawer */}
                    <div className="mt-2 grid grid-cols-3 gap-2 border-t border-slate-200 pt-2">
                      {languageOptions.map((opt) => (
                          <button
                              key={opt.code}
                              className={`flex items-center justify-center gap-1 rounded-xl px-2 py-2 font-bold transition-all duration-200 ${
                                  language === opt.code
                                      ? "bg-indigo-50 text-indigo-700"
                                      : "bg-slate-50 text-slate-900 hover:bg-indigo-50 hover:text-indigo-700"
                              }`}
                              onClick={() => {
                                setLanguage(opt.code as Language);
                                setDrawerOpen(false);
                              }}
                          >
                            <span className={`fi ${opt.flag}`} style={{ width: 20, height: 15 }} />
                            {opt.code.toUpperCase()}
                          </button>
                      ))}
                    </div>

                    <div className="mt-2 grid gap-2">
                      <button
                          type="button"
                          onClick={() => {
                            setDrawerOpen(false);
                            openAuth("login");
                          }}
                          className="w-full rounded-full border border-slate-200 bg-white px-4 py-3 font-black text-slate-900 transition-all duration-200 hover:border-indigo-200 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 hover:shadow-md hover:scale-[1.02]"
                      >
                        {cms.loginButtonText}
                      </button>
                      <button
                          type="button"
                          onClick={() => {
                            setDrawerOpen(false);
                            openAuth("register");
                          }}
                          className="w-full rounded-full px-4 py-3 font-black text-slate-900 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:brightness-110"
                          style={{
                            background:
                                "linear-gradient(135deg,var(--aya-accent-1),var(--aya-accent-2))",
                            border: "1px solid rgba(17,24,39,.10)",
                          }}
                      >
                        {cms.registerButtonText}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
          )}
        </div>

        <AuthModal
            open={authOpen}
            tab={authTab}
            onClose={() => setAuthOpen(false)}
            onSwitchTab={setAuthTab}
            onLoginSuccess={handleLoginSuccess}
            onRegisterSuccess={handleRegisterSuccess}
        />

        <SuccessModal
            open={success.open}
            message={success.message}
            onClose={() => setSuccess({ open: false, message: "" })}
        />
      </>
  );
}