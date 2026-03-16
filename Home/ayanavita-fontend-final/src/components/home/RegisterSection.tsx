// src/components/home/RegisterSection.tsx
import React, { useMemo, useRef, useState } from "react";
import { authApi } from "../../api/auth.api";

export type RegisterPayload = {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  role: 'LECTURER' | 'USER';
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
  roleLabel?: string;
  roleUserLabel?: string;
  roleLecturerLabel?: string;

  // Dòng đồng ý điều khoản (tách text thuần)
  termsPrefix?: string;
  termsLink1?: string;
  termsSeparator?: string;
  termsLink2?: string;

  submitButtonText?: string;
  submitButtonLoadingText?: string;

  loginPromptText?: string;
  loginLinkText?: string;

  // OTP
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

  // ✅ Validate messages (bổ sung CMS)
  validateInvalidFormText?: string;
  validateFullNameRequiredText?: string;
  validatePhoneInvalidText?: string;
  validateEmailInvalidText?: string;
  validatePasswordMinLenText?: string;
  validateConfirmPasswordMismatchText?: string;
  validateTermsRequiredText?: string;
};

// Nội dung mặc định (dùng khi không có cmsData) – hoàn toàn không chứa HTML
export const defaultRegisterSectionCmsData: RegisterSectionCmsData = {
  title: "Đăng ký thành viên AYANAVITA",
  description: "Trở thành thành viên để nhận những trải nghiệm wellness cá nhân hóa.",
  benefits: [
    "Wellness check-in để hiểu rõ cơ thể và nhu cầu hiện tại",
    "Phân tích làn da, sức sống và mức năng lượng tổng thể",
    "Liệu trình thư giãn và chăm sóc phù hợp với từng cá nhân",
    "Không gian phục hồi cân bằng cho cơ thể và tinh thần",
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
  roleLabel: "Bạn là ai? *",
  roleUserLabel: "Người dùng",
  roleLecturerLabel: "Giảng viên",

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

  // ✅ Validate default
  validateInvalidFormText: "Form chưa hợp lệ. Vui lòng kiểm tra lại các trường bắt buộc.",
  validateFullNameRequiredText: "Vui lòng nhập họ tên",
  validatePhoneInvalidText: "Số điện thoại không hợp lệ",
  validateEmailInvalidText: "Email không hợp lệ",
  validatePasswordMinLenText: "Mật khẩu phải có ít nhất 8 ký tự",
  validateConfirmPasswordMismatchText: "Mật khẩu không khớp",
  validateTermsRequiredText: "Vui lòng đồng ý Điều khoản",
};

type RegisterFormState = {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  interest: string;
  role: 'LECTURER' | 'USER';
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
  role: 'USER',
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
  const content = useMemo(
      () => ({ ...defaultRegisterSectionCmsData, ...cmsData }),
      [cmsData],
  );

  const [form, setForm] = useState(INITIAL_FORM);

  const [otpOpen, setOtpOpen] = useState(false);
  const [otpDigits, setOtpDigits] = useState(Array.from({ length: OTP_LEN }, () => ""));

  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // ✅ UX: chỉ validate sau khi user bấm submit lần đầu
  const [submitted, setSubmitted] = useState(false);

  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const otpValue = otpDigits.join("");
  const otpCompleted = otpValue.length === OTP_LEN;

  const validateForm = (data: RegisterFormState) => {
    const e: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /(03|05|07|08|09|01[2|6|8|9])+([0-9]{8})\b/;

    if (!data.fullName.trim()) e.fullName = content.validateFullNameRequiredText || "";
    if (!phoneRegex.test(data.phone.replace(/\s/g, ""))) e.phone = content.validatePhoneInvalidText || "";
    if (!emailRegex.test(data.email.trim())) e.email = content.validateEmailInvalidText || "";
    if (data.password.length < 8) e.password = content.validatePasswordMinLenText || "";
    if (data.password !== data.confirmPassword)
      e.confirmPassword = content.validateConfirmPasswordMismatchText || "";
    if (!data.terms) e.terms = content.validateTermsRequiredText || "";

    Object.keys(e).forEach((k) => {
      if (!e[k]) delete e[k];
    });

    return e;
  };

  // Tính lỗi theo form (nhưng chỉ hiển thị khi submitted = true)
  const errors = useMemo(() => validateForm(form), [form, content]);
  const uiErrors: Record<string, string> = submitted ? errors : {};

  const setField = <K extends keyof RegisterFormState>(key: K, value: RegisterFormState[K]) => {
    setForm((s) => ({ ...s, [key]: value }));
  };

  function resetFormState() {
    setForm(INITIAL_FORM);
    setOtpDigits(Array.from({ length: OTP_LEN }, () => ""));
    setOtpOpen(false);
    setError("");
    setInfo("");
    setSubmitted(false);
  }

  async function sendOtp() {
    setSubmitted(true);

    const e = validateForm(form);
    if (Object.keys(e).length) {
      setError(content.validateInvalidFormText || "Form chưa hợp lệ.");
      setInfo("");
      return;
    }

    setError("");
    setInfo("");
    setSendingOtp(true);
    try {
      const email = form.email.trim();
      if (onSendOtp) await onSendOtp(email);
      else await authApi.sendOtp({ email });

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
        role: form.role,
        otp: otpValue,
        acceptedPolicy: form.terms,
      };

      let res: any;
      if (onRegisterWithOtp) res = await onRegisterWithOtp(payload);
      else {
        res = await authApi.registerNew({
          name: payload.fullName,
          phone: payload.phone,
          email: payload.email,
          password: payload.password,
          role: payload.role,
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
              <div className="relative overflow-hidden p-10 text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.18),transparent_30%)]" />
                <div className="absolute -left-16 top-16 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-amber-300/10 blur-3xl" />

                <div className="relative">
                  <h2 className="text-3xl font-extrabold leading-tight">{content.title}</h2>
                  <p className="mt-4 max-w-xl text-white/90">{content.description}</p>

                  <div className="mt-8 rounded-[28px] border border-white/15 bg-white/10 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.18)] backdrop-blur-sm ring-1 ring-white/10">
                    <div className="relative flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 via-white/5 to-amber-200/10 px-6 py-8">
                      <div className="absolute -left-10 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-white/15 blur-2xl" />
                      <div className="absolute -right-6 top-4 h-20 w-20 rounded-full bg-amber-300/20 blur-2xl" />
                      <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.12)_35%,transparent_60%)] animate-pulse" />
                      <img
                          className="relative z-10 w-[60%] brightness-0 invert drop-shadow-[0_0_18px_rgba(255,255,255,0.35)] transition duration-500 hover:scale-[1.03]"
                          src="/imgs/logo.png"
                          alt="Ayanavita Logo"
                      />
                    </div>
                  </div>

                  <ul className="mt-6 space-y-3 text-white/95">
                    {(content.benefits || []).map((item, idx) => (
                        <li
                            key={idx}
                            className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition duration-300 hover:bg-white/10 hover:translate-x-1"
                        >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-amber-200 ring-1 ring-white/10 transition duration-300 group-hover:scale-110 group-hover:bg-white/15">
                        <i className="fa-solid fa-spa text-sm"></i>
                      </span>
                          <span>{item}</span>
                        </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-white p-10">
                <h3 className="text-2xl font-extrabold text-slate-900">{content.formTitle}</h3>

                {error ? <div className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}
                {info ? <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{info}</div> : null}

                {!otpOpen ? (
                    <form
                        className="mt-6"
                        onSubmit={(e) => {
                          e.preventDefault();
                          sendOtp();
                        }}
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-semibold text-slate-700">{content.fullNameLabel}</label>
                          <input
                              className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none ring-indigo-100 focus:ring-4 ${
                                  uiErrors.fullName ? "border-red-400" : "border-slate-200"
                              }`}
                              value={form.fullName}
                              onChange={(e) => setField("fullName", e.target.value)}
                              placeholder={content.fullNamePlaceholder}
                          />
                          {uiErrors.fullName ? <div className="mt-1 text-xs text-red-500">{uiErrors.fullName}</div> : null}
                        </div>

                        <div>
                          <label className="text-sm font-semibold text-slate-700">{content.phoneLabel}</label>
                          <input
                              className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none ring-indigo-100 focus:ring-4 ${
                                  uiErrors.phone ? "border-red-400" : "border-slate-200"
                              }`}
                              value={form.phone}
                              onChange={(e) => setField("phone", e.target.value)}
                              placeholder={content.phonePlaceholder}
                          />
                          {uiErrors.phone ? <div className="mt-1 text-xs text-red-500">{uiErrors.phone}</div> : null}
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="text-sm font-semibold text-slate-700">{content.emailLabel}</label>
                        <input
                            className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none ring-indigo-100 focus:ring-4 ${
                                uiErrors.email ? "border-red-400" : "border-slate-200"
                            }`}
                            value={form.email}
                            onChange={(e) => setField("email", e.target.value)}
                            placeholder={content.emailPlaceholder}
                        />
                        {uiErrors.email ? <div className="mt-1 text-xs text-red-500">{uiErrors.email}</div> : null}
                      </div>

                      <div className="mt-4">
                        <label className="text-sm font-semibold text-slate-700">{content.passwordLabel}</label>
                        <input
                            type="password"
                            className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none ring-indigo-100 focus:ring-4 ${
                                uiErrors.password ? "border-red-400" : "border-slate-200"
                            }`}
                            value={form.password}
                            onChange={(e) => setField("password", e.target.value)}
                            placeholder={content.passwordPlaceholder}
                        />
                        {uiErrors.password ? <div className="mt-1 text-xs text-red-500">{uiErrors.password}</div> : null}
                      </div>

                      <div className="mt-4">
                        <label className="text-sm font-semibold text-slate-700">{content.confirmPasswordLabel}</label>
                        <input
                            type="password"
                            className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none ring-indigo-100 focus:ring-4 ${
                                uiErrors.confirmPassword ? "border-red-400" : "border-slate-200"
                            }`}
                            value={form.confirmPassword}
                            onChange={(e) => setField("confirmPassword", e.target.value)}
                            placeholder={content.confirmPasswordPlaceholder}
                        />
                        {uiErrors.confirmPassword ? (
                            <div className="mt-1 text-xs text-red-500">{uiErrors.confirmPassword}</div>
                        ) : null}
                      </div>

                      <div className="mt-4">
                        <label className="text-sm font-semibold text-slate-700">{content.interestLabel}</label>
                        <select
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-indigo-100 focus:ring-4"
                            value={form.interest}
                            onChange={(e) => setField("interest", e.target.value)}
                        >
                          <option value="">{content.interestPlaceholder}</option>
                          <option value="wellness-checkin">Wellness check-in cá nhân</option>
                          <option value="skin-analysis">Phân tích làn da và sức sống</option>
                          <option value="wellness-program">Chương trình chăm sóc cá nhân hóa</option>
                          <option value="relaxation">Thư giãn và phục hồi năng lượng</option>
                          <option value="beauty-care">Chăm sóc sắc đẹp và cân bằng</option>
                        </select>
                      </div>

                      <div className="mt-4">
                        <label className="text-sm font-semibold text-slate-700">{content.roleLabel}</label>
                        <select
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-indigo-100 focus:ring-4"
                            value={form.role}
                            onChange={(e) => setForm((s) => ({ ...s, role: e.target.value as "LECTURER" | "USER" }))}
                        >
                          <option value="USER">{content.roleUserLabel} </option>
                          <option value="LECTURER">{content.roleLecturerLabel} </option>
                        </select>
                      </div>

                      <label className="mt-5 flex items-start gap-2 text-sm text-slate-600">
                        <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 rounded border-slate-300"
                            checked={form.terms}
                            onChange={(e) => setField("terms", e.target.checked)}
                        />
                        <span>
                      {content.termsPrefix}
                          <span className="font-semibold text-indigo-600">{content.termsLink1}</span>
                          {content.termsSeparator}
                          <span className="font-semibold text-indigo-600">{content.termsLink2}</span>
                    </span>
                      </label>
                      {uiErrors.terms ? <div className="mt-1 text-xs text-red-500">{uiErrors.terms}</div> : null}

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
