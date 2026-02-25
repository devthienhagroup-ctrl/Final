// src/components/home/RegisterSection.tsx
import React, { useMemo, useState } from "react";

export type RegisterPayload = {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  interest?: string;
};

/**
 * Dữ liệu nội dung từ CMS – chỉ chứa text thuần, không chứa HTML hay style.
 * Tất cả thuộc tính đều là string hoặc mảng string.
 */
export type RegisterSectionCmsData = {
  // Khối giới thiệu bên trái
  title?: string;
  description?: string;
  benefits?: string[];               // mảng các lợi ích
  offerTitle?: string;                // "Ưu đãi có hiệu lực trong:"
  offerDaysLabel?: string;            // "Ngày"
  offerHoursLabel?: string;           // "Giờ"
  offerMinutesLabel?: string;         // "Phút"
  offerDaysValue?: string;            // giá trị số ngày (vd "03")
  offerHoursValue?: string;           // giá trị số giờ (vd "15")
  offerMinutesValue?: string;         // giá trị số phút (vd "42")

  // Khối form bên phải
  formTitle?: string;                 // "Điền thông tin đăng ký"
  fullNameLabel?: string;
  fullNamePlaceholder?: string;
  phoneLabel?: string;
  phonePlaceholder?: string;
  emailLabel?: string;
  emailPlaceholder?: string;
  passwordLabel?: string;
  passwordPlaceholder?: string;
  confirmPasswordLabel?: string;
  confirmPasswordPlaceholder?: string;
  interestLabel?: string;
  interestPlaceholder?: string;       // text cho option mặc định (vd "Chọn lĩnh vực quan tâm")

  // Các thành phần của dòng đồng ý điều khoản (đã tách nhỏ, không lưu HTML)
  termsPrefix?: string;                // ví dụ "Tôi đồng ý với "
  termsLink1?: string;                 // ví dụ "Điều khoản"
  termsSeparator?: string;             // ví dụ " và "
  termsLink2?: string;                 // ví dụ "Chính sách bảo mật"
  // (không có termsSuffix, có thể thêm nếu cần)

  submitButtonText?: string;
  loginPromptText?: string;            // "Đã có tài khoản?"
  loginLinkText?: string;              // "Đăng nhập"
};

export type RegisterSectionProps = {
  /** gọi khi đăng ký thành công (prototype) */
  onRegisterSuccess?: () => void;

  /** nếu bạn muốn tự handle submit: nhận payload, return void/Promise */
  onSubmit?: (payload: RegisterPayload) => void | Promise<void>;

  /** dữ liệu nội dung từ CMS – nếu không có sẽ dùng nội dung mẫu */
  cmsData?: RegisterSectionCmsData;
};

// Nội dung mặc định (dùng khi không có cmsData) – hoàn toàn không chứa HTML
const defaultCmsData: RegisterSectionCmsData = {
  title: "Đăng ký thành viên AYANAVITA",
  description: "Nhận ưu đãi đặc biệt khi đăng ký tài khoản mới:",
  benefits: [
    "Truy cập miễn phí 3 khóa học cơ bản",
    "Giảm 20% cho khóa học đầu tiên",
    "Lộ trình học tập cá nhân hóa",
    "Cộng đồng học viên VIP",
  ],
  offerTitle: "Ưu đãi có hiệu lực trong:",
  offerDaysLabel: "Ngày",
  offerHoursLabel: "Giờ",
  offerMinutesLabel: "Phút",
  offerDaysValue: "03",
  offerHoursValue: "15",
  offerMinutesValue: "42",
  formTitle: "Điền thông tin đăng ký",
  fullNameLabel: "Họ và tên *",
  fullNamePlaceholder: "Nguyễn Văn A",
  phoneLabel: "Số điện thoại *",
  phonePlaceholder: "0912 345 678",
  emailLabel: "Email *",
  emailPlaceholder: "email@example.com",
  passwordLabel: "Mật khẩu *",
  passwordPlaceholder: "Ít nhất 8 ký tự",
  confirmPasswordLabel: "Xác nhận mật khẩu *",
  confirmPasswordPlaceholder: "Nhập lại mật khẩu",
  interestLabel: "Bạn quan tâm lĩnh vực nào?",
  interestPlaceholder: "Chọn lĩnh vực quan tâm",
  termsPrefix: "Tôi đồng ý với ",
  termsLink1: "Điều khoản",
  termsSeparator: " và ",
  termsLink2: "Chính sách bảo mật",
  submitButtonText: "Đăng ký tài khoản miễn phí",
  loginPromptText: "Đã có tài khoản?",
  loginLinkText: "Đăng nhập",
};

export const RegisterSection: React.FC<RegisterSectionProps> = ({
                                                                  onRegisterSuccess,
                                                                  onSubmit,
                                                                  cmsData,
                                                                }) => {
  // Gộp nội dung mặc định và nội dung từ CMS
  const content = { ...defaultCmsData, ...cmsData };

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    interest: "",
    terms: false,
  });

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /(03|05|07|08|09|01[2|6|8|9])+([0-9]{8})\b/;

    if (!form.fullName.trim()) e.fullName = "Vui lòng nhập họ tên";
    if (!phoneRegex.test(form.phone.replace(/\s/g, ""))) e.phone = "Số điện thoại không hợp lệ";
    if (!emailRegex.test(form.email)) e.email = "Email không hợp lệ";
    if (form.password.length < 8) e.password = "Mật khẩu phải có ít nhất 8 ký tự";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Mật khẩu không khớp";
    if (!form.terms) e.terms = "Vui lòng đồng ý Điều khoản";
    return e;
  }, [form]);

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (Object.keys(errors).length) {
      window.alert("Form chưa hợp lệ. Kiểm tra các trường bắt buộc.");
      return;
    }

    const payload: RegisterPayload = {
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      password: form.password,
      interest: form.interest || undefined,
    };

    try {
      if (onSubmit) await onSubmit(payload);
      // prototype default behavior
      if (!onSubmit) window.alert("Đăng ký thành công (prototype). Sau này nối API.");
      onRegisterSuccess?.();
    } catch (err: any) {
      window.alert(err?.message ?? "Đăng ký thất bại");
    }
  };

  return (
      <section id="register" className="w-full py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 shadow-xl">
            <div className="grid md:grid-cols-2">
              {/* Cột trái – nội dung giới thiệu */}
              <div className="p-10 text-white">
                <h2 className="text-3xl font-extrabold">{content.title}</h2>
                <p className="mt-4 text-white/90">{content.description}</p>
                <ul className="mt-6 space-y-3 text-white/95">
                  {content.benefits?.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <i className="fa-regular fa-circle-check"></i> {item}
                      </li>
                  ))}
                </ul>

                <div className="mt-8 rounded-2xl bg-white/10 p-5 ring-1 ring-white/10">
                  <div className="text-sm font-medium">{content.offerTitle}</div>
                  <div className="mt-2 flex gap-2">
                    {[
                      { value: content.offerDaysValue, label: content.offerDaysLabel },
                      { value: content.offerHoursValue, label: content.offerHoursLabel },
                      { value: content.offerMinutesValue, label: content.offerMinutesLabel },
                    ].map((x) => (
                        <div
                            key={x.label}
                            className="rounded-lg bg-white/15 px-3 py-2 text-center ring-1 ring-white/10"
                        >
                          <div className="text-xl font-extrabold">{x.value}</div>
                          <div className="text-xs">{x.label}</div>
                        </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cột phải – form đăng ký */}
              <div className="bg-white p-10">
                <h3 className="text-2xl font-extrabold text-slate-900">{content.formTitle}</h3>

                <form className="mt-6" onSubmit={submit}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-slate-700">{content.fullNameLabel}</label>
                      <input
                          className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none ring-indigo-100 focus:ring-4 ${
                              errors.fullName ? "border-red-400" : "border-slate-200"
                          }`}
                          value={form.fullName}
                          onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))}
                          placeholder={content.fullNamePlaceholder}
                      />
                      {errors.fullName ? <div className="mt-1 text-xs text-red-500">{errors.fullName}</div> : null}
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-700">{content.phoneLabel}</label>
                      <input
                          className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none ring-indigo-100 focus:ring-4 ${
                              errors.phone ? "border-red-400" : "border-slate-200"
                          }`}
                          value={form.phone}
                          onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                          placeholder={content.phonePlaceholder}
                      />
                      {errors.phone ? <div className="mt-1 text-xs text-red-500">{errors.phone}</div> : null}
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="text-sm font-semibold text-slate-700">{content.emailLabel}</label>
                    <input
                        className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none ring-indigo-100 focus:ring-4 ${
                            errors.email ? "border-red-400" : "border-slate-200"
                        }`}
                        value={form.email}
                        onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                        placeholder={content.emailPlaceholder}
                    />
                    {errors.email ? <div className="mt-1 text-xs text-red-500">{errors.email}</div> : null}
                  </div>

                  <div className="mt-4">
                    <label className="text-sm font-semibold text-slate-700">{content.passwordLabel}</label>
                    <input
                        type="password"
                        className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none ring-indigo-100 focus:ring-4 ${
                            errors.password ? "border-red-400" : "border-slate-200"
                        }`}
                        value={form.password}
                        onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                        placeholder={content.passwordPlaceholder}
                    />
                    {errors.password ? <div className="mt-1 text-xs text-red-500">{errors.password}</div> : null}
                  </div>

                  <div className="mt-4">
                    <label className="text-sm font-semibold text-slate-700">{content.confirmPasswordLabel}</label>
                    <input
                        type="password"
                        className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none ring-indigo-100 focus:ring-4 ${
                            errors.confirmPassword ? "border-red-400" : "border-slate-200"
                        }`}
                        value={form.confirmPassword}
                        onChange={(e) => setForm((s) => ({ ...s, confirmPassword: e.target.value }))}
                        placeholder={content.confirmPasswordPlaceholder}
                    />
                    {errors.confirmPassword ? (
                        <div className="mt-1 text-xs text-red-500">{errors.confirmPassword}</div>
                    ) : null}
                  </div>

                  <div className="mt-4">
                    <label className="text-sm font-semibold text-slate-700">{content.interestLabel}</label>
                    <select
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-indigo-100 focus:ring-4"
                        value={form.interest}
                        onChange={(e) => setForm((s) => ({ ...s, interest: e.target.value }))}
                    >
                      <option value="">{content.interestPlaceholder}</option>
                      <option value="tech">Công nghệ thông tin</option>
                      <option value="business">Kinh doanh & Marketing</option>
                      <option value="design">Thiết kế & Sáng tạo</option>
                      <option value="language">Ngoại ngữ</option>
                      <option value="softskills">Kỹ năng mềm</option>
                    </select>
                  </div>

                  {/* Dòng đồng ý điều khoản – được ghép từ các trường text thuần, không HTML */}
                  <label className="mt-5 flex items-start gap-2 text-sm text-slate-600">
                    <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-slate-300"
                        checked={form.terms}
                        onChange={(e) => setForm((s) => ({ ...s, terms: e.target.checked }))}
                    />
                    <span>
                    {content.termsPrefix}
                      <span className="font-semibold text-indigo-600">{content.termsLink1}</span>
                      {content.termsSeparator}
                      <span className="font-semibold text-indigo-600">{content.termsLink2}</span>
                  </span>
                  </label>
                  {errors.terms ? <div className="mt-1 text-xs text-red-500">{errors.terms}</div> : null}

                  <button
                      type="submit"
                      className="mt-6 w-full rounded-2xl bg-gradient-to-r from-amber-300 to-yellow-300 py-4 font-extrabold text-slate-900 shadow hover:opacity-95"
                  >
                    {content.submitButtonText}
                  </button>

                  <div className="mt-4 text-sm text-slate-600">
                    {content.loginPromptText}{" "}
                    <a href="#top" className="font-semibold text-indigo-600 hover:underline">
                      {content.loginLinkText}
                    </a>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
  );
};