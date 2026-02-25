import React from "react";
import { Link } from "react-router-dom";

// Định nghĩa kiểu dữ liệu cho CMS Data (chỉ chứa nội dung, không chứa màu sắc, kích thước)
export type FooterCMSData = {
  brandName?: string;
  description?: string;              // đoạn mô tả thương hiệu
  address?: string;
  phone?: string;
  email?: string;
  hours?: string;
  socialLinks?: Array<{ icon: string; url: string; label?: string }>;  // icon là class Font Awesome (ví dụ: "fab fa-facebook-f")
  aboutLinks?: Array<{ text: string; url: string }>;                   // menu "Về chúng tôi"
  supportLinks?: Array<{ text: string; url: string }>;                 // menu "Hỗ trợ"
  bottomLinks?: Array<{ text: string; url: string }>;                  // các link cuối trang (Điều khoản, Bảo mật, Cookie)
  copyrightText?: string;              // ví dụ: "© 2025 AYANAVITA. All rights reserved."
  sslText?: string;                    // ví dụ: "Website được bảo mật bởi SSL"

  // Labels mới được thêm vào
  brandLabel?: string;                 // label cho thương hiệu (ví dụ: "Nền tảng LMS hàng đầu")
  aboutTitle?: string;                 // tiêu đề cột "Về chúng tôi"
  supportTitle?: string;               // tiêu đề cột "Hỗ trợ"
  contactTitle?: string;               // tiêu đề cột "Liên hệ"
};

type FooterProps = {
  cmsData?: FooterCMSData;             // dữ liệu từ CMS, sẽ ghi đè các props khác nếu có
};

export function Footer({ cmsData }: FooterProps) {
  const year = new Date().getFullYear();

  // Giá trị mặc định cho toàn bộ dữ liệu
  const finalBrandName = cmsData?.brandName ?? "AYANAVITA";
  const finalDescription =
      cmsData?.description ??
      "Hệ thống học tập trực tuyến chuyên nghiệp, tăng chuyển đổi bán khoá học và nâng cao trải nghiệm học viên.";
  const finalAddress = cmsData?.address ?? "Số 123, Đường ABC, Quận 1, TP.HCM";
  const finalPhone = cmsData?.phone ?? "(028) 1234 5678";
  const finalEmail = cmsData?.email ?? "support@ayanavita.vn";
  const finalHours = cmsData?.hours ?? "8:00 - 18:00 (T2 - T7)";
  const finalSocialLinks = cmsData?.socialLinks ?? [
    { icon: "fab fa-facebook-f", url: "#" },
    { icon: "fab fa-youtube", url: "#" },
    { icon: "fab fa-tiktok", url: "#" },
    { icon: "fab fa-linkedin-in", url: "#" },
  ];
  const finalAboutLinks = cmsData?.aboutLinks ?? [
    { text: "Giới thiệu", url: "#product" },
    { text: "Khóa học", url: "#courseGallery" },
    { text: "Đánh giá", url: "#reviews" },
    { text: "Bảng giá", url: "#pricing" },
    { text: "Hợp tác", url: "#contact" },
  ];
  const finalSupportLinks = cmsData?.supportLinks ?? [
    { text: "Trung tâm trợ giúp", url: "/help" },
    { text: "Câu hỏi thường gặp", url: "/faq" },
    { text: "Liên hệ hỗ trợ", url: "#contact" },
    { text: "Hướng dẫn thanh toán", url: "/payment-guide" },
    { text: "Chính sách hoàn tiền", url: "/refund" },
  ];
  const finalBottomLinks = cmsData?.bottomLinks ?? [
    { text: "Điều khoản", url: "/terms" },
    { text: "Bảo mật", url: "/privacy" },
    { text: "Cookie", url: "/cookie" },
  ];
  const finalCopyrightText =
      cmsData?.copyrightText ?? `© ${year} ${finalBrandName}. All rights reserved.`;
  const finalSslText = cmsData?.sslText ?? "Website được bảo mật bởi SSL";

  // Labels mới
  const finalBrandLabel = cmsData?.brandLabel ?? "Nền tảng LMS hàng đầu";
  const finalAboutTitle = cmsData?.aboutTitle ?? "Về chúng tôi";
  const finalSupportTitle = cmsData?.supportTitle ?? "Hỗ trợ";
  const finalContactTitle = cmsData?.contactTitle ?? "Liên hệ";

  // Hàm render link: nếu url bắt đầu bằng '/' thì dùng Link của react-router, nếu không thì dùng thẻ a thông thường
  const renderLink = (text: string, url: string, className?: string) => {
    if (url.startsWith("/")) {
      return (
          <Link to={url} className={className}>
            {text}
          </Link>
      );
    }
    return (
        <a href={url} className={className} onClick={(e) => e.preventDefault()}>
          {text}
        </a>
    );
  };

  return (
      <footer
          className="mt-10 text-white z-10"
      >
        <div className="gradient-footer z-10">
          <div className="inner py-12">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
              {/* Cột thương hiệu và mô tả */}
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
                    <div className="text-xl font-black">{finalBrandName}</div>
                    <div className="text-sm text-slate-300">{finalBrandLabel}</div>
                  </div>
                </div>

                <p className="mb-6 max-w-md text-slate-300">{finalDescription}</p>

                {/* Social Links */}
                <div className="flex gap-3">
                  {finalSocialLinks.map((social, idx) => (
                      <a
                          key={idx}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-amber-300 hover:bg-white/20"
                          href={social.url}
                          onClick={(e) => e.preventDefault()}
                          aria-label={social.label || social.icon}
                      >
                        <i className={social.icon}></i>
                      </a>
                  ))}
                </div>
              </div>

              {/* Về chúng tôi */}
              <div>
                <h3 className="mb-4 text-lg font-semibold">{finalAboutTitle}</h3>
                <ul className="space-y-3 text-slate-300">
                  {finalAboutLinks.map((link, idx) => (
                      <li key={idx}>
                        {renderLink(link.text, link.url, "hover:text-amber-200")}
                      </li>
                  ))}
                </ul>
              </div>

              {/* Hỗ trợ */}
              <div>
                <h3 className="mb-4 text-lg font-semibold">{finalSupportTitle}</h3>
                <ul className="space-y-3 text-slate-300">
                  {finalSupportLinks.map((link, idx) => (
                      <li key={idx}>
                        {renderLink(link.text, link.url, "hover:text-amber-200")}
                      </li>
                  ))}
                </ul>
              </div>

              {/* Liên hệ */}
              <div>
                <h3 className="mb-4 text-lg font-semibold">{finalContactTitle}</h3>
                <ul className="space-y-3 text-slate-300">
                  <li className="flex items-start gap-2">
                    <i className="fa-solid fa-location-dot mt-1 text-amber-300"></i>
                    <span>{finalAddress}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <i className="fa-solid fa-phone text-amber-300"></i>
                    <span>{finalPhone}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <i className="fa-solid fa-envelope text-amber-300"></i>
                    <span>{finalEmail}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <i className="fa-solid fa-clock text-amber-300"></i>
                    <span>{finalHours}</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom */}
            <div className="mt-10 border-t border-white/10 pt-8">
              <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                <div className="text-sm text-slate-400">{finalCopyrightText}</div>
                <div className="flex gap-6 text-sm text-slate-400">
                  {finalBottomLinks.map((link, idx) => (
                      <span key={idx}>
                    {renderLink(link.text, link.url, "hover:text-amber-200")}
                  </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 ring-1 ring-white/10">
                  <i className="fa-solid fa-shield-halved text-amber-300"></i>
                  <span className="text-sm text-slate-300">{finalSslText}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
  );
}