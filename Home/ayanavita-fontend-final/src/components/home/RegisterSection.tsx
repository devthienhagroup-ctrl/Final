// src/components/home/RegisterSection.tsx
import React, { useMemo, useRef, useState } from "react";
import { authApi } from "../../api/auth.api";

export type RegisterPayload = {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  interest?: string;
};

export type RegisterVerifyPayload = RegisterPayload & {
  otp: string;
  acceptedPolicy: boolean;
};

/**
 * Dữ liệu nội dung từ CMS – chỉ chứa text thuần, không chứa HTML hay style.
 * Tất cả thuộc tính đều là string hoặc mảng string.
 */
export type RegisterSectionCmsData = {
  // Khối giới thiệu bên trái
  title?: string;
  description?: string;
  benefits?: string[];
  offerTitle?: string;
  offerDaysLabel?: string;
  offerHoursLabel?: string;
  offerMinutesLabel?: string;
  offerDaysValue?: string;
  offerHoursValue?: string;
  offerMinutesValue?: string;

  // Khối form bên phải
  formTitle?: string;
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
  interestPlaceholder?: string;

  // Dòng đồng ý điều khoản (tách text thuần)
  termsPrefix?: string;
  termsLink1?: string;
  termsSeparator?: string;
  termsLink2?: string;

  submitButtonText?: string;
  submitButtonLoadingText?: string;

  loginPromptText?: string;
  loginLinkText?: string;

  // OTP (file 2 chưa có -> bổ sung cho file 1)
  otpCardLabel?: string;
  otpBackToRegisterText?: string;
  otpBackHintText?: string;
  otpCloseAriaLabel?: string;

  otpTitle?: string;
  otpDescriptionPrefix?: string;
  otpDescriptionSuffix?: string;
  otpSentInfoText?: string;

  otpConfirmButtonText?: string;
  otpConfirmButtonLoadingText?: string;
  otpResendButtonText?: string;
  otpResendButtonLoadingText?: string;
};

// Nội dung mặc định (dùng khi không có cmsData) – hoàn toàn không chứa HTML
export const defaultRegisterSectionCmsData: RegisterSectionCmsData = {
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
  submitButtonLoadingText: "Đang gửi OTP...",

  loginPromptText: "Đã có tài khoản?",
  loginLinkText: "Đăng nhập",

  otpCardLabel: "Xác nhận OTP",
  otpBackToRegisterText: "Quay lại đăng ký",
  otpBackHintText: "Bạn có thể chỉnh lại form đăng ký rồi nhận OTP lại.",
  otpCloseAriaLabel: "Đóng",

  otpTitle: "Nhập mã gồm 6 chữ số",
  otpDescriptionPrefix: "Mã đã gửi đến",
  otpDescriptionSuffix: "và có hiệu lực trong 5 phút.",
  otpSentInfoText: "OTP đã gửi qua email, mã có hiệu lực trong 5 phút.",

  otpConfirmButtonText: "Xác nhận",
  otpConfirmButtonLoadingText: "Đang xác nhận...",
  otpResendButtonText: "Gửi lại OTP",
  otpResendButtonLoadingText: "Đang gửi lại...",
};

type RegisterFormState = {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  interest: string;
  terms: boolean;
};

const OTP_LEN = 6;
const INITIAL_FORM: RegisterFormState = {
  fullName: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
  interest: "",
  terms: false,
};

export type RegisterSectionProps = {
  onRegisterSuccess?: () => void;

  /** dữ liệu nội dung từ CMS */
  cmsData?: RegisterSectionCmsData;

  /** override API gửi OTP (mặc định dùng authApi.sendOtp) */
  onSendOtp?: (email: string) => void | Promise<void>;

  /** override API đăng ký kèm OTP (mặc định dùng authApi.registerNew) */
  onRegisterWithOtp?: (
      payload: RegisterVerifyPayload,
  ) => void | Promise<{ accessToken?: string; refreshToken?: string } | any>;
};

export const RegisterSection: React.FC<RegisterSectionProps> = ({
                                                                  onRegisterSuccess,
                                                                  cmsData,
                                                                  onSendOtp,
                                                                  onRegisterWithOtp,
                                                                }) => {
  const content = { ...defaultRegisterSectionCmsData, ...cmsData };

  const [form, setForm] = useState(INITIAL_FORM);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpDigits, setOtpDigits] = useState(Array.from({ length: OTP_LEN }, () => ""));
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);

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

  const otpValue = otpDigits.join("");
  const otpCompleted = otpValue.length === OTP_LEN;

  function resetFormState() {
    setForm(INITIAL_FORM);
    setOtpDigits(Array.from({ length: OTP_LEN }, () => ""));
    setOtpOpen(false);
    setError("");
    setInfo("");
  }

  async function sendOtp() {
    if (Object.keys(errors).length) {
      setError("Form chưa hợp lệ. Vui lòng kiểm tra lại các trường bắt buộc.");
      return;
    }

    setError("");
    setInfo("");
    setSendingOtp(true);
    try {
      const email = form.email.trim();
      if (onSendOtp) await onSendOtp(email);
      if (!onSendOtp) await authApi.sendOtp({ email });

      setOtpDigits(Array.from({ length: OTP_LEN }, () => ""));
      setOtpOpen(true);
      setInfo(content.otpSentInfoText || "");
      setTimeout(() => otpInputRefs.current[0]?.focus(), 0);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Không gửi được OTP");
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleRegisterWithOtp() {
    if (!otpCompleted) return;

    setError("");
    setInfo("");
    setVerifying(true);
    try {
      const payload: RegisterVerifyPayload = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        password: form.password,
        interest: form.interest || undefined,
        otp: otpValue,
        acceptedPolicy: form.terms,
      };

      let res: any;
      if (onRegisterWithOtp) res = await onRegisterWithOtp(payload);
      if (!onRegisterWithOtp) {
        res = await authApi.registerNew({
          name: payload.fullName,
          phone: payload.phone,
          email: payload.email,
          password: payload.password,
          otp: payload.otp,
          acceptedPolicy: payload.acceptedPolicy,
        });
      }

      if (res?.accessToken) localStorage.setItem("aya_access_token", res.accessToken);
      if (res?.refreshToken) localStorage.setItem("aya_refresh_token", res.refreshToken);

      resetFormState();
      onRegisterSuccess?.();
    } catch (e: any) {
      setError(e?.response?.data?.message || "OTP không đúng hoặc đã hết hạn");
    } finally {
      setVerifying(false);
    }
  }

  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < OTP_LEN - 1) otpInputRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LEN);
    if (!pasted) return;
    const filled = Array.from({ length: OTP_LEN }, (_, i) => pasted[i] ?? "");
    setOtpDigits(filled);
    const nextFocus = Math.min(pasted.length, OTP_LEN - 1);
    otpInputRefs.current[nextFocus]?.focus();
  }

  return (
      <section id="register" className="w-full py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 shadow-xl">
            <div className="grid md:grid-cols-2">
              <div className="p-10 text-white">
                <h2 className="text-3xl font-extrabold">{content.title}</h2>
                <p className="mt-4 text-white/90">{content.description}</p>

                <ul className="mt-6 space-y-3 text-white/95">
                  {(content.benefits || []).map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <i className="fa-regular fa-circle-check"></i> {item}
                      </li>
                  ))}
                </ul>

                <div className="mt-8 rounded-2xl bg-white/10 p-5 ring-1 ring-white/10">
                  <div className="text-sm font-medium">{content.offerTitle}</div>
                  <div className="mt-2 flex gap-2">
                    {[
                      { v: content.offerDaysValue, l: content.offerDaysLabel },
                      { v: content.offerHoursValue, l: content.offerHoursLabel },
                      { v: content.offerMinutesValue, l: content.offerMinutesLabel },
                    ].map((x) => (
                        <div
                            key={String(x.l)}
                            className="rounded-lg bg-white/15 px-3 py-2 text-center ring-1 ring-white/10"
                        >
                          <div className="text-xl font-extrabold">{x.v}</div>
                          <div className="text-xs">{x.l}</div>
                        </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white p-10">
                <h3 className="text-2xl font-extrabold text-slate-900">{content.formTitle}</h3>

                {error ? <div className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}
                {info ? <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{info}</div> : null}

                {!otpOpen ? (
                    <form className="mt-6" onSubmit={(e) => { e.preventDefault(); sendOtp(); }}>
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

                      {/* interest select (file 2 có, file 1 thiếu input -> bổ sung) */}
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
                          disabled={sendingOtp}
                          className="mt-6 w-full rounded-2xl bg-gradient-to-r from-amber-300 to-yellow-300 py-4 font-extrabold text-slate-900 shadow hover:opacity-95 disabled:opacity-60"
                      >
                        {sendingOtp ? content.submitButtonLoadingText : content.submitButtonText}
                      </button>

                      <div className="mt-4 text-sm text-slate-600">
                        {content.loginPromptText}{" "}
                        <a href="#top" className="font-semibold text-indigo-600 hover:underline">
                          {content.loginLinkText}
                        </a>
                      </div>
                    </form>
                ) : (
                    <div className="mt-6 rounded-3xl border border-slate-200 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="text-xs font-semibold text-slate-500">{content.otpCardLabel}</div>
                          <button
                              type="button"
                              onClick={() => {
                                setOtpOpen(false);
                                setError("");
                                setInfo(content.otpBackHintText || "");
                              }}
                              className="text-sm font-semibold text-blue-600 hover:underline"
                          >
                            {content.otpBackToRegisterText}
                          </button>
                        </div>

                        <button
                            type="button"
                            aria-label={content.otpCloseAriaLabel}
                            onClick={resetFormState}
                            className="h-9 w-9 rounded-xl bg-slate-100 hover:bg-slate-200"
                        >
                          ✕
                        </button>
                      </div>

                      <h4 className="mt-2 text-xl font-bold text-slate-900">{content.otpTitle}</h4>

                      <p className="mt-2 text-sm text-slate-600">
                        {content.otpDescriptionPrefix} <span className="font-semibold">{form.email}</span>{" "}
                        {content.otpDescriptionSuffix}
                      </p>

                      <div className="mt-5 flex justify-between gap-2">
                        {otpDigits.map((digit, idx) => (
                            <input
                                key={idx}
                                ref={(el) => {
                                  otpInputRefs.current[idx] = el;
                                }}
                                value={digit}
                                onChange={(e) => handleOtpChange(idx, e.target.value)}
                                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                onPaste={handleOtpPaste}
                                inputMode="numeric"
                                maxLength={1}
                                className="h-12 w-12 rounded-2xl border border-slate-300 text-center text-xl font-bold tracking-widest text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                            />
                        ))}
                      </div>

                      <div className="mt-5 flex gap-2">
                        <button
                            type="button"
                            onClick={handleRegisterWithOtp}
                            disabled={verifying || !otpCompleted}
                            className="w-1/2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                        >
                          {verifying ? content.otpConfirmButtonLoadingText : content.otpConfirmButtonText}
                        </button>

                        <button
                            type="button"
                            onClick={sendOtp}
                            disabled={sendingOtp}
                            className="w-1/2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-60"
                        >
                          {sendingOtp ? content.otpResendButtonLoadingText : content.otpResendButtonText}
                        </button>
                      </div>
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
  );
};