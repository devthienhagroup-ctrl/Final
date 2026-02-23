// src/components/home/AuthModal.tsx
import React, { useMemo, useState } from "react";
import { Modal } from "../ui/Modal";

type AuthTab = "login" | "register";

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
  const [reg, setReg] = useState({ name: "", phone: "", email: "", pass: "", confirm: "", terms: false });

  const emailOk = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail), [loginEmail]);
  const loginPassOk = useMemo(() => loginPass.trim().length > 0, [loginPass]);

  const regEmailOk = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reg.email), [reg.email]);
  const regPassOk = useMemo(() => reg.pass.length >= 8, [reg.pass]);
  const regConfirmOk = useMemo(() => reg.pass === reg.confirm, [reg.pass, reg.confirm]);

  return (
    <Modal open={open} onClose={onClose} ariaLabel="Đăng nhập / Đăng ký">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-slate-500">Tài khoản AYANAVITA</div>
          <h3 className="text-xl font-bold text-slate-900">Đăng nhập / Đăng ký</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="h-10 w-10 rounded-2xl bg-slate-50 ring-1 ring-slate-200 hover:bg-slate-100"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          className={`w-1/2 rounded-[14px] px-3 py-2 font-bold text-sm ${tab === "login" ? "bg-slate-900 text-white" : "bg-white ring-1 ring-slate-200"}`}
          onClick={() => onSwitchTab("login")}
        >
          Đăng nhập
        </button>
        <button
          type="button"
          className={`w-1/2 rounded-[14px] px-3 py-2 font-bold text-sm ${tab === "register" ? "bg-slate-900 text-white" : "bg-white ring-1 ring-slate-200"}`}
          onClick={() => onSwitchTab("register")}
        >
          Đăng ký
        </button>
      </div>

      {tab === "login" ? (
        <form
          className="mt-5 grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (emailOk && loginPassOk) onLoginSuccess();
          }}
        >
          <div>
            <label className="form-label">Email *</label>
            <input
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              type="email"
              className={`form-input ${loginEmail && !emailOk ? "error" : ""}`}
              placeholder="email@example.com"
            />
            {loginEmail && !emailOk ? <div className="error-message">Email không hợp lệ</div> : null}
          </div>

          <div>
            <label className="form-label">Mật khẩu *</label>
            <input
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
              type="password"
              className={`form-input ${loginPass === "" ? "" : !loginPassOk ? "error" : ""}`}
              placeholder="Nhập mật khẩu"
            />
            {loginPass !== "" && !loginPassOk ? <div className="error-message">Mật khẩu không được để trống</div> : null}
          </div>

          <button type="submit" className="rounded-2xl btn-primary px-6 py-3 font-semibold">
            Đăng nhập
          </button>

          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 text-sm text-slate-700">
            Demo: nhập email hợp lệ và mật khẩu bất kỳ để hiện “Đăng nhập thành công”.
          </div>
        </form>
      ) : (
        <form
          className="mt-5 grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const ok = reg.name.trim() && reg.phone.trim() && regEmailOk && regPassOk && regConfirmOk && reg.terms;
            if (ok) onRegisterSuccess();
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Họ tên *</label>
              <input
                value={reg.name}
                onChange={(e) => setReg((s) => ({ ...s, name: e.target.value }))}
                className={`form-input ${reg.name && !reg.name.trim() ? "error" : ""}`}
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div>
              <label className="form-label">Số điện thoại *</label>
              <input
                value={reg.phone}
                onChange={(e) => setReg((s) => ({ ...s, phone: e.target.value }))}
                className="form-input"
                placeholder="0912 345 678"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Email *</label>
            <input
              value={reg.email}
              onChange={(e) => setReg((s) => ({ ...s, email: e.target.value }))}
              className={`form-input ${reg.email && !regEmailOk ? "error" : ""}`}
              placeholder="email@example.com"
            />
            {reg.email && !regEmailOk ? <div className="error-message">Email không hợp lệ</div> : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Mật khẩu *</label>
              <input
                value={reg.pass}
                onChange={(e) => setReg((s) => ({ ...s, pass: e.target.value }))}
                className={`form-input ${reg.pass && !regPassOk ? "error" : ""}`}
                placeholder="Ít nhất 8 ký tự"
                type="password"
              />
              {reg.pass && !regPassOk ? <div className="error-message">Mật khẩu phải có ít nhất 8 ký tự</div> : null}
            </div>
            <div>
              <label className="form-label">Xác nhận *</label>
              <input
                value={reg.confirm}
                onChange={(e) => setReg((s) => ({ ...s, confirm: e.target.value }))}
                className={`form-input ${reg.confirm && !regConfirmOk ? "error" : ""}`}
                placeholder="Nhập lại mật khẩu"
                type="password"
              />
              {reg.confirm && !regConfirmOk ? <div className="error-message">Mật khẩu không khớp</div> : null}
            </div>
          </div>

          <label className="flex items-start gap-2 text-sm text-slate-600">
            <input
              checked={reg.terms}
              onChange={(e) => setReg((s) => ({ ...s, terms: e.target.checked }))}
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 mt-1"
            />
            <span>
              Tôi đồng ý với <span className="font-semibold text-indigo-600">Điều khoản</span> và{" "}
              <span className="font-semibold text-indigo-600">Chính sách bảo mật</span>
            </span>
          </label>

          <button type="submit" className="rounded-2xl btn-accent px-6 py-3 font-semibold">
            Tạo tài khoản
          </button>
        </form>
      )}
    </Modal>
  );
}
