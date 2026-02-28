import { FormEvent, useEffect, useState } from "react";
import { authApi } from "../api/auth.api";


export default function AccountCenter() {
  const [profile, setProfile] = useState({
    fullName: "",
    phone: "",
    email: "",
    birthDate: "",
    gender: "OTHER",
    address: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordStep, setPasswordStep] = useState<"verifyCurrent" | "setNew">("verifyCurrent");

  const [forgotForm, setForgotForm] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [forgotStep, setForgotStep] = useState<"email" | "otp" | "newPassword">("email");

  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!localStorage.getItem("aya_access_token")) return;
      setLoading(true);
      setError("");
      try {
        const data = await authApi.profile();
        setProfile({
          fullName: data?.name ?? "",
          phone: data?.phone ?? "",
          email: data?.email ?? "",
          birthDate: data?.birthDate ? String(data.birthDate).slice(0, 10) : "",
          gender: data?.gender ?? "OTHER",
          address: data?.address ?? "",
        });
        setForgotForm((prev) => ({ ...prev, email: data?.email ?? "" }));
      } catch (e: any) {
        setError(e?.response?.data?.message || "Không tải được thông tin tài khoản.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const onProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await authApi.updateProfile({
        name: profile.fullName,
        phone: profile.phone,
        birthDate: profile.birthDate || undefined,
        gender: profile.gender as "MALE" | "FEMALE" | "OTHER",
        address: profile.address,
      });
      setMessage("Đã lưu thông tin cá nhân thành công.");
    } catch (e: any) {
      setError(e?.response?.data?.message || "Cập nhật thông tin thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const onVerifyCurrentPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!passwordForm.currentPassword.trim()) {
      setError("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await authApi.checkPassword(passwordForm.currentPassword);
      setPasswordStep("setNew");
      setMessage(res?.message || "Mật khẩu hiện tại chính xác. Vui lòng nhập mật khẩu mới.");
    } catch (e: any) {
      setError(e?.response?.data?.message || "Mật khẩu hiện tại không chính xác.");
    } finally {
      setLoading(false);
    }
  };

  const onChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("Mật khẩu xác nhận chưa khớp.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setMessage(res?.message || "Đổi mật khẩu thành công.");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordStep("verifyCurrent");
    } catch (e: any) {
      setError(e?.response?.data?.message || "Đổi mật khẩu thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const onSendForgotOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!forgotForm.email.trim()) {
      setError("Vui lòng nhập email tài khoản.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await authApi.sendForgotPasswordOtp({ email: forgotForm.email.trim() });
      setForgotStep("otp");
      setMessage(res?.message || "OTP đã được gửi tới email.");
    } catch (e: any) {
      const serverMessage = e?.response?.data?.message;
      setError(serverMessage === "Email không đúng" ? "Email không đúng" : serverMessage || "Không gửi được OTP.");
    } finally {
      setLoading(false);
    }
  };

  const onVerifyForgotOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!forgotForm.otp.trim()) {
      setError("Vui lòng nhập OTP.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await authApi.verifyForgotPasswordOtp({
        email: forgotForm.email.trim(),
        otp: forgotForm.otp.trim(),
      });
      setForgotStep("newPassword");
      setMessage(res?.message || "OTP hợp lệ. Vui lòng nhập mật khẩu mới.");
    } catch (e: any) {
      setError(e?.response?.data?.message || "OTP không hợp lệ hoặc đã hết hạn.");
    } finally {
      setLoading(false);
    }
  };

  const onForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (forgotForm.newPassword !== forgotForm.confirmPassword) {
      setError("Mật khẩu xác nhận chưa khớp.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await authApi.forgotPassword({
        email: forgotForm.email.trim(),
        otp: forgotForm.otp.trim(),
        newPassword: forgotForm.newPassword,
      });
      setMessage(res?.message || "Đặt lại mật khẩu thành công.");
      setForgotForm((prev) => ({ ...prev, otp: "", newPassword: "", confirmPassword: "" }));
      setForgotStep("email");
    } catch (e: any) {
      setError(e?.response?.data?.message || "Không thể đặt lại mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Quản lý tài khoản</h1>
      </header>

      {message && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}
      {loading && <div className="text-sm text-slate-500">Đang xử lý...</div>}

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Chỉnh sửa thông tin cá nhân</h2>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onProfileSubmit}>
          <input className="rounded-xl border border-slate-300 px-3 py-2" placeholder="Họ và tên" value={profile.fullName} onChange={(e) => setProfile((prev) => ({ ...prev, fullName: e.target.value }))} />
          <input className="rounded-xl border border-slate-300 px-3 py-2" placeholder="Số điện thoại" value={profile.phone} onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))} />
          <input className="rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-slate-600" type="text" placeholder="Email" value={profile.email} readOnly />
          <input className="rounded-xl border border-slate-300 px-3 py-2" type="date" value={profile.birthDate} onChange={(e) => setProfile((prev) => ({ ...prev, birthDate: e.target.value }))} />
          <select className="rounded-xl border border-slate-300 px-3 py-2" value={profile.gender} onChange={(e) => setProfile((prev) => ({ ...prev, gender: e.target.value }))}>
            <option value="MALE">Nam</option>
            <option value="FEMALE">Nữ</option>
            <option value="OTHER">Khác</option>
          </select>
          <input className="rounded-xl border border-slate-300 px-3 py-2 md:col-span-2" placeholder="Địa chỉ" value={profile.address} onChange={(e) => setProfile((prev) => ({ ...prev, address: e.target.value }))} />
          <div className="md:col-span-2">
            <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700">Lưu thông tin</button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Đổi mật khẩu</h2>

        {passwordStep === "verifyCurrent" ? (
          <form className="grid gap-4 md:grid-cols-2" onSubmit={onVerifyCurrentPassword}>
            <input className="rounded-xl border border-slate-300 px-3 py-2 md:col-span-2" type="password" placeholder="Mật khẩu hiện tại" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))} />
            <div className="md:col-span-2">
              <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-700">Kiểm tra mật khẩu hiện tại</button>
            </div>
          </form>
        ) : (
          <form className="grid gap-4 md:grid-cols-2" onSubmit={onChangePassword}>
            <input className="rounded-xl border border-slate-300 px-3 py-2" type="password" placeholder="Mật khẩu mới" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))} />
            <input className="rounded-xl border border-slate-300 px-3 py-2" type="password" placeholder="Xác nhận mật khẩu mới" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))} />
            <div className="md:col-span-2 flex gap-2">
              <button type="button" className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50" onClick={() => setPasswordStep("verifyCurrent")}>Quay lại</button>
              <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-700">Cập nhật mật khẩu</button>
            </div>
          </form>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Quên mật khẩu</h2>

        {forgotStep === "email" && (
          <form className="flex flex-col gap-4 md:flex-row" onSubmit={onSendForgotOtp}>
            <input className="flex-1 rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-slate-600" type="text" placeholder="Email tài khoản" value={forgotForm.email} readOnly />
            <button type="submit" className="rounded-xl border border-indigo-300 px-4 py-2 font-semibold text-indigo-700 hover:bg-indigo-50">Gửi OTP</button>
          </form>
        )}

        {forgotStep === "otp" && (
          <form className="flex flex-col gap-4 md:flex-row" onSubmit={onVerifyForgotOtp}>
            <input className="flex-1 rounded-xl border border-slate-300 px-3 py-2" type="text" placeholder="Nhập OTP" value={forgotForm.otp} onChange={(e) => setForgotForm((prev) => ({ ...prev, otp: e.target.value }))} />
            <button type="submit" className="rounded-xl border border-indigo-300 px-4 py-2 font-semibold text-indigo-700 hover:bg-indigo-50">Xác nhận OTP</button>
          </form>
        )}

        {forgotStep === "newPassword" && (
          <form className="grid gap-4 md:grid-cols-2" onSubmit={onForgotPassword}>
            <input className="rounded-xl border border-slate-300 px-3 py-2" type="password" placeholder="Mật khẩu mới" value={forgotForm.newPassword} onChange={(e) => setForgotForm((prev) => ({ ...prev, newPassword: e.target.value }))} />
            <input className="rounded-xl border border-slate-300 px-3 py-2" type="password" placeholder="Nhập lại mật khẩu mới" value={forgotForm.confirmPassword} onChange={(e) => setForgotForm((prev) => ({ ...prev, confirmPassword: e.target.value }))} />
            <div className="md:col-span-2 flex gap-2">
              <button type="button" className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50" onClick={() => setForgotStep("otp")}>Quay lại</button>
              <button type="submit" className="rounded-xl border border-indigo-300 px-4 py-2 font-semibold text-indigo-700 hover:bg-indigo-50">Đổi mật khẩu</button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
