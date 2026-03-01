import { FormEvent, useState } from "react";

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
  const [message, setMessage] = useState<string>("");

  const onProfileSubmit = (e: FormEvent) => {
    e.preventDefault();
    setMessage("Đã lưu thông tin cá nhân (giao diện demo, sẽ nối API BE sau).");
  };

  const onChangePassword = (e: FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage("Mật khẩu xác nhận chưa khớp.");
      return;
    }
    setMessage("Đổi mật khẩu thành công (giao diện demo, sẽ nối API BE sau).");
  };

  const onForgotPassword = (e: FormEvent) => {
    e.preventDefault();
    setMessage("Đã gửi hướng dẫn quên mật khẩu (giao diện demo, sẽ nối API BE sau).");
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
          <button type="submit" className="rounded-xl border border-indigo-300 px-4 py-2 font-semibold text-indigo-700 hover:bg-indigo-50">Gửi yêu cầu</button>
        </form>
      </section>
    </div>
  );
}
