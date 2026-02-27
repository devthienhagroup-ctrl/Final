import React from "react";
import { Link } from "react-router-dom";

type FooterProps = {
  address?: string;
  phone?: string;
  email?: string;
  hours?: string;
  brandName?: string;
};

export function Footer({
  brandName = "AYANAVITA",
  address = "Số 123, Đường ABC, Quận 1, TP.HCM",
  phone = "(028) 1234 5678",
  email = "support@ayanavita.vn",
  hours = "8:00 - 18:00 (T2 - T7)",
}: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-10 text-white" style={{ background: "var(--aya-footer-bg, transparent)" }}>
      <div className="gradient-footer">
        <div className="inner py-12">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl text-xl font-black text-white ring-1 ring-white/15"
                     style={{ background: "linear-gradient(135deg,var(--aya-primary-1),var(--aya-primary-2))", boxShadow:"0 18px 40px rgba(79,70,229,.25)" }}>
                  A
                </div>
                <div>
                  <div className="text-xl font-black">{brandName}</div>
                  <div className="text-sm text-slate-300">Nền tảng LMS hàng đầu</div>
                </div>
              </div>

              <p className="mb-6 max-w-md text-slate-300">
                Hệ thống học tập trực tuyến chuyên nghiệp, tăng chuyển đổi bán khoá học và nâng cao trải nghiệm học viên.
              </p>

              <div className="flex gap-3">
                <a className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-amber-300 hover:bg-white/20"
                   href="#" onClick={(e)=>e.preventDefault()} aria-label="Facebook">
                  f
                </a>
                <a className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-amber-300 hover:bg-white/20"
                   href="#" onClick={(e)=>e.preventDefault()} aria-label="YouTube">
                  ▶
                </a>
                <a className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-amber-300 hover:bg-white/20"
                   href="#" onClick={(e)=>e.preventDefault()} aria-label="TikTok">
                  ♪
                </a>
                <a className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-amber-300 hover:bg-white/20"
                   href="#" onClick={(e)=>e.preventDefault()} aria-label="LinkedIn">
                  in
                </a>
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-lg font-semibold">Về chúng tôi</h3>
              <ul className="space-y-3 text-slate-300">
                <li><a href="#product" className="hover:text-amber-200">Giới thiệu</a></li>
                <li><a href="#courseGallery" className="hover:text-amber-200">Khóa học</a></li>
                <li><a href="#reviews" className="hover:text-amber-200">Đánh giá</a></li>
                <li><a href="#pricing" className="hover:text-amber-200">Bảng giá</a></li>
                <li><a href="#contact" className="hover:text-amber-200">Hợp tác</a></li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-lg font-semibold">Hỗ trợ</h3>
              <ul className="space-y-3 text-slate-300">
                <li><Link to="/help" className="hover:text-amber-200">Trung tâm trợ giúp</Link></li>
                <li><Link to="/faq" className="hover:text-amber-200">Câu hỏi thường gặp</Link></li>
                <li><a href="#contact" className="hover:text-amber-200">Liên hệ hỗ trợ</a></li>
                <li><Link to="/payment-guide" className="hover:text-amber-200">Hướng dẫn thanh toán</Link></li>
                <li><Link to="/refund" className="hover:text-amber-200">Chính sách hoàn tiền</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-lg font-semibold">Liên hệ</h3>
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-amber-300">📍</span>
                  <span>{address}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-300">☎</span>
                  <span>{phone}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-300">✉</span>
                  <span>{email}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-300">⏰</span>
                  <span>{hours}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-8">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <div className="text-sm text-slate-400">© {year} {brandName}. All rights reserved.</div>
              <div className="flex gap-6 text-sm text-slate-400">
                <Link to="/terms" className="hover:text-amber-200">Điều khoản</Link>
                <Link to="/privacy" className="hover:text-amber-200">Bảo mật</Link>
                <Link to="/cookie" className="hover:text-amber-200">Cookie</Link>
              </div>
            </div>

            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 ring-1 ring-white/10">
                <span className="text-amber-300">🛡</span>
                <span className="text-sm text-slate-300">Website được bảo mật bởi SSL</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
