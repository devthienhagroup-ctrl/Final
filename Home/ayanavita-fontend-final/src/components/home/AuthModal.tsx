// src/components/home/AuthModal.tsx
import React, { useMemo, useRef, useState } from "react";
import { Modal } from "../ui/Modal";
import { authApi } from "../../api/auth.api";

type AuthTab = "login" | "register";

const OTP_LEN = 6;
const INITIAL_REG = { name: "", phone: "", email: "", pass: "", confirm: "", terms: false };

export function AuthModal({
  open,
  tab,
  onClose,
  onSwitchTab,
  onLoginSuccess,
  onRegisterSuccess,
}: {
  open: boolean;
  tab: AuthTab;
  onClose: () => void;
  onSwitchTab: (t: AuthTab) => void;
  onLoginSuccess: () => void;
  onRegisterSuccess: () => void;
}) {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [reg, setReg] = useState(INITIAL_REG);
  const [otpDigits, setOtpDigits] = useState(Array.from({ length: OTP_LEN }, () => ""));
  const [otpOpen, setOtpOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const emailOk = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail), [loginEmail]);
  const loginPassOk = useMemo(() => loginPass.trim().length > 0, [loginPass]);

  const regEmailOk = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reg.email), [reg.email]);
  const regPassOk = useMemo(() => reg.pass.length >= 8, [reg.pass]);
  const regConfirmOk = useMemo(() => reg.pass === reg.confirm, [reg.pass, reg.confirm]);
  const regBaseOk = useMemo(
    () => Boolean(reg.name.trim() && reg.phone.trim() && regEmailOk && regPassOk && regConfirmOk && reg.terms),
    [reg.name, reg.phone, regEmailOk, regPassOk, regConfirmOk, reg.terms],
  );

  const otpValue = otpDigits.join("");
  const otpCompleted = otpValue.length === OTP_LEN;

  function resetRegisterState() {
    setReg(INITIAL_REG);
    setOtpDigits(Array.from({ length: OTP_LEN }, () => ""));
    setOtpOpen(false);
    setError("");
    setInfo("");
  }

  function handleCloseAll() {
    resetRegisterState();
    onClose();
  }

  async function handleLogin() {
    if (!(emailOk && loginPassOk)) return;
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const res = await authApi.login({ email: loginEmail.trim(), password: loginPass });
      if (res?.accessToken) localStorage.setItem("aya_access_token", res.accessToken);
      if (res?.refreshToken) localStorage.setItem("aya_refresh_token", res.refreshToken);
      onLoginSuccess();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  }

  async function sendOtpAndOpenModal() {
    if (!regBaseOk) {
      setError("Vui lòng điền đủ thông tin đăng ký và chấp nhận chính sách.");
      return;
    }

    setError("");
    setInfo("");
    setSendingOtp(true);
    try {
      await authApi.sendOtp({ email: reg.email.trim() });
      setOtpDigits(Array.from({ length: OTP_LEN }, () => ""));
      setOtpOpen(true);
      setInfo("OTP đã được gửi qua email, hiệu lực 5 phút.");
      setTimeout(() => otpInputRefs.current[0]?.focus(), 0);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Không gửi được OTP");
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleRegisterWithOtp() {
    if (!regBaseOk || !otpCompleted) return;

    setError("");
    setInfo("");
    setLoading(true);
    try {
      const res = await authApi.registerNew({
        name: reg.name.trim(),
        phone: reg.phone.trim(),
        email: reg.email.trim(),
        password: reg.pass,
        otp: otpValue,
        acceptedPolicy: reg.terms,
      });

      if (res?.accessToken) localStorage.setItem("aya_access_token", res.accessToken);
      if (res?.refreshToken) localStorage.setItem("aya_refresh_token", res.refreshToken);

      resetRegisterState();
      onRegisterSuccess();
    } catch (e: any) {
      setError(e?.response?.data?.message || "OTP không đúng hoặc đã hết hạn");
    } finally {
      setLoading(false);
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
    <>
      <Modal open={open && !otpOpen} onClose={handleCloseAll} ariaLabel="Đăng nhập / Đăng ký">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-slate-500">Tài khoản AYANAVITA</div>
            <h3 className="text-xl font-bold text-slate-900">Đăng nhập / Đăng ký</h3>
          </div>
          <button type="button" onClick={handleCloseAll} className="h-10 w-10 rounded-2xl bg-slate-50 ring-1 ring-slate-200 hover:bg-slate-100" aria-label="Close">✕</button>
        </div>

        <div className="mt-5 flex gap-2">
          <button type="button" className={`w-1/2 rounded-[14px] px-3 py-2 font-bold text-sm ${tab === "login" ? "bg-slate-900 text-white" : "bg-white ring-1 ring-slate-200"}`} onClick={() => onSwitchTab("login")}>Đăng nhập</button>
          <button type="button" className={`w-1/2 rounded-[14px] px-3 py-2 font-bold text-sm ${tab === "register" ? "bg-slate-900 text-white" : "bg-white ring-1 ring-slate-200"}`} onClick={() => onSwitchTab("register")}>Đăng ký</button>
        </div>

        {error ? <div className="mt-3 rounded-xl bg-rose-50 text-rose-700 p-3 text-sm">{error}</div> : null}
        {info ? <div className="mt-3 rounded-xl bg-emerald-50 text-emerald-700 p-3 text-sm">{info}</div> : null}

        {tab === "login" ? (
          <form className="mt-5 grid gap-3" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
            <div>
              <label className="form-label">Email *</label>
              <input value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} type="email" className={`form-input ${loginEmail && !emailOk ? "error" : ""}`} placeholder="email@example.com" />
            </div>
            <div>
              <label className="form-label">Mật khẩu *</label>
              <input value={loginPass} onChange={(e) => setLoginPass(e.target.value)} type="password" className={`form-input ${loginPass === "" ? "" : !loginPassOk ? "error" : ""}`} placeholder="Nhập mật khẩu" />
            </div>
            <button disabled={loading} type="submit" className="rounded-2xl btn-primary px-6 py-3 font-semibold disabled:opacity-60">{loading ? "Đang xử lý..." : "Đăng nhập"}</button>
          </form>
        ) : (
          <form className="mt-5 grid gap-3" onSubmit={(e) => { e.preventDefault(); sendOtpAndOpenModal(); }}>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Họ tên *</label><input value={reg.name} onChange={(e) => setReg((s) => ({ ...s, name: e.target.value }))} className="form-input" /></div>
              <div><label className="form-label">Số điện thoại *</label><input value={reg.phone} onChange={(e) => setReg((s) => ({ ...s, phone: e.target.value }))} className="form-input" /></div>
            </div>

            <div>
              <label className="form-label">Email *</label>
              <input value={reg.email} onChange={(e) => setReg((s) => ({ ...s, email: e.target.value }))} className={`form-input ${reg.email && !regEmailOk ? "error" : ""}`} placeholder="email@example.com" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Mật khẩu *</label><input value={reg.pass} onChange={(e) => setReg((s) => ({ ...s, pass: e.target.value }))} className={`form-input ${reg.pass && !regPassOk ? "error" : ""}`} type="password" /></div>
              <div><label className="form-label">Xác nhận *</label><input value={reg.confirm} onChange={(e) => setReg((s) => ({ ...s, confirm: e.target.value }))} className={`form-input ${reg.confirm && !regConfirmOk ? "error" : ""}`} type="password" /></div>
            </div>

            <label className="flex items-start gap-2 text-sm text-slate-600">
              <input checked={reg.terms} onChange={(e) => setReg((s) => ({ ...s, terms: e.target.checked }))} type="checkbox" className="h-4 w-4 rounded border-slate-300 mt-1" />
              <span>Tôi đồng ý với <span className="font-semibold text-indigo-600">Điều khoản</span> và <span className="font-semibold text-indigo-600">Chính sách bảo mật</span></span>
            </label>

            <button disabled={sendingOtp || !regBaseOk} type="submit" className="rounded-2xl btn-accent px-6 py-3 font-semibold disabled:opacity-60">{sendingOtp ? "Đang gửi OTP..." : "Nhận OTP & tiếp tục"}</button>
          </form>
        )}
      </Modal>

      {otpOpen ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="text-xs font-semibold text-slate-500">Xác nhận OTP</div>
                <button
                  type="button"
                  onClick={() => {
                    setOtpOpen(false);
                    setError("");
                    setInfo("Bạn có thể chỉnh lại thông tin đăng ký trước khi xác nhận OTP.");
                  }}
                  className="text-sm font-semibold text-blue-600 hover:underline"
                >
                  Quay lại đăng ký
                </button>
              </div>
              <button type="button" onClick={handleCloseAll} className="h-9 w-9 rounded-xl bg-slate-100 hover:bg-slate-200">✕</button>
            </div>

            <h4 className="mt-2 text-xl font-bold text-slate-900">Nhập mã gồm 6 chữ số</h4>

            <p className="mt-2 text-sm text-slate-600">Mã đã gửi đến <span className="font-semibold">{reg.email}</span> và có hiệu lực trong 5 phút.</p>

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
                disabled={loading || !otpCompleted}
                className="w-1/2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {loading ? "Đang xác nhận..." : "Xác nhận"}
              </button>
              <button
                type="button"
                onClick={sendOtpAndOpenModal}
                disabled={sendingOtp}
                className="w-1/2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-60"
              >
                {sendingOtp ? "Đang gửi lại..." : "Gửi lại OTP"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
