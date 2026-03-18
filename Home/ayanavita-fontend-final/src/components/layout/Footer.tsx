import React from "react";
import { Link } from "react-router-dom";

export type FooterCMSData = {
  brandName?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  hours?: string;
  socialLinks?: Array<{ icon: string; url: string; label?: string }>;
  aboutLinks?: Array<{ text: string; url: string }>;
  supportLinks?: Array<{ text: string; url: string }>;
  bottomLinks?: Array<{ text: string; url: string }>;
  copyrightText?: string;
  sslText?: string;
  brandLabel?: string;
  aboutTitle?: string;
  supportTitle?: string;
  contactTitle?: string;
};

type FooterProps = {
  cmsData?: FooterCMSData;
};

export const cmsDataDefault: Required<FooterCMSData> = {
  brandName: "AYANAVITA",
  description:
      "AYANAVITA là nền tảng wellness kết nối dịch vụ, sản phẩm, khóa học và trải nghiệm sống cân bằng trong một hành trình chăm sóc cá nhân hóa.",
  address: "Thông tin địa chỉ đang được cập nhật",
  phone: "Đang cập nhật",
  email: "contact@ayanavita.vn",
  hours: "08:00 - 18:00 (T2 - T7)",
  socialLinks: [
    { icon: "fab fa-facebook-f", url: "#", label: "Facebook" },
    { icon: "fab fa-youtube", url: "#", label: "YouTube" },
    { icon: "fab fa-tiktok", url: "#", label: "TikTok" },
    { icon: "fab fa-linkedin-in", url: "#", label: "LinkedIn" },
  ],
  aboutLinks: [
    { text: "Về AYANAVITA", url: "/about" },
    { text: "Trải nghiệm", url: "/experience" },
    { text: "Dịch vụ", url: "/services" },
    { text: "Khóa học", url: "/courses" },
    { text: "Sản phẩm", url: "/products" },
  ],
  supportLinks: [
    { text: "Đặt lịch", url: "/booking" },
    { text: "Theo dõi đơn hàng", url: "/track-order" },
    { text: "So sánh sản phẩm", url: "/compare" },
    { text: "Đánh giá khách hàng", url: "/reviews" },
    { text: "Liên hệ hỗ trợ", url: "/contact" },
  ],
  bottomLinks: [
    { text: "Điều khoản", url: "/policies/terms" },
    { text: "Bảo mật", url: "/policies/privacy" },
    { text: "Cookie", url: "/policies/cookie" },
  ],
  copyrightText: "",
  sslText: "Website được bảo mật bởi SSL",
  brandLabel: "Wellness • Beauty • Lifestyle",
  aboutTitle: "Khám phá",
  supportTitle: "Hỗ trợ",
  contactTitle: "Liên hệ",
};

const isInternalRoute = (url: string) => url.startsWith("/") && !url.startsWith("//");
const isPlaceholderLink = (url: string) => url.trim() === "#";

export function Footer({ cmsData }: FooterProps) {
  const year = new Date().getFullYear();

  const finalData: Required<FooterCMSData> = {
    ...cmsDataDefault,
    ...cmsData,
    socialLinks: cmsData?.socialLinks ?? cmsDataDefault.socialLinks,
    aboutLinks: cmsData?.aboutLinks ?? cmsDataDefault.aboutLinks,
    supportLinks: cmsData?.supportLinks ?? cmsDataDefault.supportLinks,
    bottomLinks: cmsData?.bottomLinks ?? cmsDataDefault.bottomLinks,
    copyrightText:
        cmsData?.copyrightText ??
        `© ${year} ${(cmsData?.brandName ?? cmsDataDefault.brandName)}. All rights reserved.`,
  };

  const hasValidPhone = /\d/.test(finalData.phone);
  const hasValidEmail = finalData.email.includes("@");

  const renderLink = (text: string, url: string, className?: string) => {
    if (isInternalRoute(url)) {
      return (
          <Link to={url} className={className}>
            {text}
          </Link>
      );
    }

    return (
        <a
            href={url}
            className={className}
            onClick={isPlaceholderLink(url) ? (e) => e.preventDefault() : undefined}
        >
          {text}
        </a>
    );
  };

  return (
      <footer className="mt-10 z-10 text-white">
        <div className="gradient-footer z-10">
          <div className="inner py-12">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <div className="mb-6 flex items-center gap-3">
                  <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl text-xl font-black text-white ring-1 ring-white/15"
                      style={{
                        background:
                            "linear-gradient(135deg,var(--aya-primary-1),var(--aya-primary-2))",
                        boxShadow: "0 18px 40px rgba(79,70,229,.25)",
                      }}
                  >
                    A
                  </div>
                  <div>
                    <div className="text-xl font-black">{finalData.brandName}</div>
                    <div className="text-sm text-slate-300">{finalData.brandLabel}</div>
                  </div>
                </div>

                <p className="mb-6 max-w-md text-slate-300">{finalData.description}</p>

                <div className="flex gap-3">
                  {finalData.socialLinks.map((social, idx) => (
                      <a
                          key={idx}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-amber-300 transition hover:bg-white/20"
                          href={social.url}
                          onClick={isPlaceholderLink(social.url) ? (e) => e.preventDefault() : undefined}
                          aria-label={social.label || social.icon}
                      >
                        <i className={social.icon}></i>
                      </a>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-lg font-semibold">{finalData.aboutTitle}</h3>
                <ul className="space-y-3 text-slate-300">
                  {finalData.aboutLinks.map((link, idx) => (
                      <li key={idx}>{renderLink(link.text, link.url, "hover:text-amber-200")}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="mb-4 text-lg font-semibold">{finalData.supportTitle}</h3>
                <ul className="space-y-3 text-slate-300">
                  {finalData.supportLinks.map((link, idx) => (
                      <li key={idx}>{renderLink(link.text, link.url, "hover:text-amber-200")}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="mb-4 text-lg font-semibold">{finalData.contactTitle}</h3>
                <ul className="space-y-3 text-slate-300">
                  <li className="flex items-start gap-2">
                    <i className="fa-solid fa-location-dot mt-1 text-amber-300"></i>
                    <span>{finalData.address}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <i className="fa-solid fa-phone text-amber-300"></i>
                    {hasValidPhone ? (
                        <a href={`tel:${finalData.phone}`} className="hover:text-amber-200">
                          {finalData.phone}
                        </a>
                    ) : (
                        <span>{finalData.phone}</span>
                    )}
                  </li>
                  <li className="flex items-center gap-2">
                    <i className="fa-solid fa-envelope text-amber-300"></i>
                    {hasValidEmail ? (
                        <a href={`mailto:${finalData.email}`} className="hover:text-amber-200">
                          {finalData.email}
                        </a>
                    ) : (
                        <span>{finalData.email}</span>
                    )}
                  </li>
                  <li className="flex items-center gap-2">
                    <i className="fa-solid fa-clock text-amber-300"></i>
                    <span>{finalData.hours}</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-10 border-t border-white/10 pt-8">
              <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                <div className="text-sm text-slate-400">{finalData.copyrightText}</div>
                <div className="flex gap-6 text-sm text-slate-400">
                  {finalData.bottomLinks.map((link, idx) => (
                      <span key={idx}>{renderLink(link.text, link.url, "hover:text-amber-200")}</span>
                  ))}
                </div>
              </div>

              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 ring-1 ring-white/10">
                  <i className="fa-solid fa-shield-halved text-amber-300"></i>
                  <span className="text-sm text-slate-300">{finalData.sslText}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
  );
}
