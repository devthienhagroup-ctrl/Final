// src/components/home/RegisterSection.tsx
import React, { useMemo, useRef, useState } from "react";
import { authApi } from "../../api/auth.api";

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
};

export const RegisterSection: React.FC<RegisterSectionProps> = ({ onRegisterSuccess }) => {
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
      await authApi.sendOtp({ email: form.email.trim() });
      setOtpDigits(Array.from({ length: OTP_LEN }, () => ""));
      setOtpOpen(true);
      setInfo("OTP đã gửi qua email, mã có hiệu lực trong 5 phút.");
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
      const res = await authApi.registerNew({
        name: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        password: form.password,
        otp: otpValue,
        acceptedPolicy: form.terms,
      });

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
              <h2 className="text-3xl font-extrabold">Đăng ký thành viên AYANAVITA</h2>
              <p className="mt-4 text-white/90">Nhận ưu đãi đặc biệt khi đăng ký tài khoản mới:</p>
              <ul className="mt-6 space-y-3 text-white/95">
                <li className="flex items-center gap-2"><i className="fa-regular fa-circle-check"></i> Truy cập miễn phí
                  3 khóa học cơ bản
                </li>
                <li className="flex items-center gap-2"><i className="fa-regular fa-circle-check"></i> Giảm 20% cho khóa
                  học đầu tiên
                </li>
                <li className="flex items-center gap-2"><i className="fa-regular fa-circle-check"></i> Lộ trình học tập cá nhân hóa</li>
                <li className="flex items-center gap-2"><i className="fa-regular fa-circle-check"></i> Cộng đồng học viên VIP</li>
              </ul>

              <div className="mt-8 rounded-2xl bg-white/10 p-5 ring-1 ring-white/10">
                <div className="text-sm font-medium">Ưu đãi có hiệu lực trong:</div>
                <div className="mt-2 flex gap-2">
                  {[
                    { v: "03", l: "Ngày" },
                    { v: "15", l: "Giờ" },
                    { v: "42", l: "Phút" },
                  ].map((x) => (
                    <div
                      key={x.l}
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
              <h3 className="text-2xl font-extrabold text-slate-900">Điền thông tin đăng ký</h3>

              {error ? <div className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}
              {info ? <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{info}</div> : null}

              {!otpOpen ? (
                <form className="mt-6" onSubmit={(e) => { e.preventDefault(); sendOtp(); }}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-slate-700">Họ và tên *</label>
                      <input
                        className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none ring-indigo-100 focus:ring-4 ${
                          errors.fullName ? "border-red-400" : "border-slate-200"
                        }`}
                        value={form.fullName}
                        onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))}
                        placeholder="Nguyễn Văn A"
                      />
                      {errors.fullName ? <div className="mt-1 text-xs text-red-500">{errors.fullName}</div> : null}
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-700">Số điện thoại *</label>
                      <input
                        className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none ring-indigo-100 focus:ring-4 ${
                          errors.phone ? "border-red-400" : "border-slate-200"
                        }`}
                        value={form.phone}
                        onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                        placeholder="0912 345 678"
                      />
                      {errors.phone ? <div className="mt-1 text-xs text-red-500">{errors.phone}</div> : null}
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="text-sm font-semibold text-slate-700">Email *</label>
                    <input
                      className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none ring-indigo-100 focus:ring-4 ${
                        errors.email ? "border-red-400" : "border-slate-200"
                      }`}
                      value={form.email}
                      onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                      placeholder="email@example.com"
                    />
                    {errors.email ? <div className="mt-1 text-xs text-red-500">{errors.email}</div> : null}
                  </div>

                  <div className="mt-4">
                    <label className="text-sm font-semibold text-slate-700">Mật khẩu *</label>
                    <input
                      type="password"
                      className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none ring-indigo-100 focus:ring-4 ${
                        errors.password ? "border-red-400" : "border-slate-200"
                      }`}
                      value={form.password}
                      onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                      placeholder="Ít nhất 8 ký tự"
                    />
                    {errors.password ? <div className="mt-1 text-xs text-red-500">{errors.password}</div> : null}
                  </div>

                  <div className="mt-4">
                    <label className="text-sm font-semibold text-slate-700">Xác nhận mật khẩu *</label>
                    <input
                      type="password"
                      className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none ring-indigo-100 focus:ring-4 ${
                        errors.confirmPassword ? "border-red-400" : "border-slate-200"
                      }`}
                      value={form.confirmPassword}
                      onChange={(e) => setForm((s) => ({ ...s, confirmPassword: e.target.value }))}
                      placeholder="Nhập lại mật khẩu"
                    />
                    {errors.confirmPassword ? (
                      <div className="mt-1 text-xs text-red-500">{errors.confirmPassword}</div>
                    ) : null}
                  </div>

                  <div className="mt-4">
                    <label className="text-sm font-semibold text-slate-700">Bạn quan tâm lĩnh vực nào?</label>
                    <select
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-indigo-100 focus:ring-4"
                      value={form.interest}
                      onChange={(e) => setForm((s) => ({ ...s, interest: e.target.value }))}
                    >
                      <option value="">Chọn lĩnh vực quan tâm</option>
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
                      Tôi đồng ý với <span className="font-semibold text-indigo-600">Điều khoản</span> và{" "}
                      <span className="font-semibold text-indigo-600">Chính sách bảo mật</span>
                    </span>
                  </label>
                  {errors.terms ? <div className="mt-1 text-xs text-red-500">{errors.terms}</div> : null}

                  <button
                    type="submit"
                    disabled={sendingOtp}
                    className="mt-6 w-full rounded-2xl bg-gradient-to-r from-amber-300 to-yellow-300 py-4 font-extrabold text-slate-900 shadow hover:opacity-95 disabled:opacity-60"
                  >
                    {sendingOtp ? "Đang gửi OTP..." : "Đăng ký tài khoản miễn phí"}
                  </button>

                  <div className="mt-4 text-sm text-slate-600">
                    Đã có tài khoản?{" "}
                    <a href="#top" className="font-semibold text-indigo-600 hover:underline">
                      Đăng nhập
                    </a>
                  </div>
                </form>
              ) : (
                <div className="mt-6 rounded-3xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="text-xs font-semibold text-slate-500">Xác nhận OTP</div>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpOpen(false);
                          setError("");
                          setInfo("Bạn có thể chỉnh lại form đăng ký rồi nhận OTP lại.");
                        }}
                        className="text-sm font-semibold text-blue-600 hover:underline"
                      >
                        Quay lại đăng ký
                      </button>
                    </div>
                    <button type="button" onClick={resetFormState} className="h-9 w-9 rounded-xl bg-slate-100 hover:bg-slate-200">✕</button>
                  </div>

                  <h4 className="mt-2 text-xl font-bold text-slate-900">Nhập mã gồm 6 chữ số</h4>

                  <p className="mt-2 text-sm text-slate-600">
                    Mã đã gửi đến <span className="font-semibold">{form.email}</span> và có hiệu lực trong 5 phút.
                  </p>

                  <div className="mt-5 flex justify-between gap-2">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => { otpInputRefs.current[idx] = el; }}
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
                      {verifying ? "Đang xác nhận..." : "Xác nhận"}
                    </button>

                    <button
                      type="button"
                      onClick={sendOtp}
                      disabled={sendingOtp}
                      className="w-1/2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-60"
                    >
                      {sendingOtp ? "Đang gửi lại..." : "Gửi lại OTP"}
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
