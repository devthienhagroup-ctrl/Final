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
  const [forgotForm, setForgotForm] = useState({ email: "" });
  const [forgotNewPassword, setForgotNewPassword] = useState("");
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
        setForgotForm({ email: data?.email ?? "" });
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

  const onChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("Mật khẩu xác nhận chưa khớp.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setMessage(res?.message || "Đổi mật khẩu thành công.");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e: any) {
      setError(e?.response?.data?.message || "Đổi mật khẩu thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const onForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!forgotNewPassword.trim()) {
      setError("Vui lòng nhập mật khẩu mới để đặt lại mật khẩu.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await authApi.forgotPassword({ email: forgotForm.email, newPassword: forgotNewPassword });
      setMessage(res?.message || "Đặt lại mật khẩu thành công.");
      setForgotNewPassword("");
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
        <p className="mt-1 text-sm text-slate-600">
          Giao diện tối giản để tập trung phát triển backend.
        </p>
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
          <input className="rounded-xl border border-slate-300 px-3 py-2" type="email" placeholder="Email" value={profile.email} onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))} />
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
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onChangePassword}>
          <input className="rounded-xl border border-slate-300 px-3 py-2" type="password" placeholder="Mật khẩu hiện tại" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))} />
          <input className="rounded-xl border border-slate-300 px-3 py-2" type="password" placeholder="Mật khẩu mới" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))} />
          <input className="rounded-xl border border-slate-300 px-3 py-2 md:col-span-2" type="password" placeholder="Xác nhận mật khẩu mới" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))} />
          <div className="md:col-span-2">
            <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-700">Cập nhật mật khẩu</button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Quên mật khẩu</h2>
        <form className="flex flex-col gap-4 md:flex-row" onSubmit={onForgotPassword}>
          <input className="flex-1 rounded-xl border border-slate-300 px-3 py-2" type="email" placeholder="Nhập email tài khoản" value={forgotForm.email} onChange={(e) => setForgotForm({ email: e.target.value })} />
          <input className="flex-1 rounded-xl border border-slate-300 px-3 py-2" type="password" placeholder="Mật khẩu mới" value={forgotNewPassword} onChange={(e) => setForgotNewPassword(e.target.value)} />
          <button type="submit" className="rounded-xl border border-indigo-300 px-4 py-2 font-semibold text-indigo-700 hover:bg-indigo-50">Gửi yêu cầu</button>
        </form>
      </section>
    </div>
  );
}
