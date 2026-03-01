import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { login } from "../../app/api";
import { useAuth } from "../../app/auth";

export function LoginPage() {
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };

  const [email, setEmail] = useState("admin@ayanavita.vn");
  const [password, setPassword] = useState("123456");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedEmail = localStorage.getItem("aya_admin_email");
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const redirectTo = useMemo(() => location.state?.from || "/admin/dashboard", [location.state?.from]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const cleanEmail = email.trim();
      const result = await login(cleanEmail, password);
      setToken(result.accessToken);

      if (remember) {
        localStorage.setItem("aya_admin_email", cleanEmail);
      } else {
        localStorage.removeItem("aya_admin_email");
      }

      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="aya-login">
      <div className="aya-bg" aria-hidden="true" />
      <div className="aya-grain" aria-hidden="true" />
      <div className="aya-blobs" aria-hidden="true">
        <span className="blob b1" />
        <span className="blob b2" />
        <span className="blob b3" />
      </div>

      <div className="aya-wrap">
        <div className="aya-card">
          <div className="aya-brand">
            <span className="dot" aria-hidden="true" />
            <div className="t">
              <div className="name">
                <span className="g">AYANAVITA</span> <span className="muted">Admin</span>
              </div>
              <div className="sub">CMS • Leads • Publish</div>
            </div>
          </div>

          <div className="aya-head">
            <h1>Đăng nhập Admin</h1>
            <p>
              Dùng tài khoản role <b>ADMIN</b> của backend.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="aya-form">
            <label className="field">
              <span className="label">Email</span>
              <div className="control">
                <input
                  className="input"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  inputMode="email"
                  placeholder="admin@ayanavita.vn"
                />
              </div>
            </label>

            <label className="field">
              <span className="label">Password</span>
              <div className="control">
                <input
                  className="input"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••"
                />
                <button
                  type="button"
                  className="ghost"
                  onClick={() => setShowPass((value) => !value)}
                >
                  {showPass ? "Ẩn" : "Hiện"}
                </button>
              </div>
            </label>

            <div className="row">
              <label className="check">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                />
                <span>Nhớ email</span>
              </label>
              <div className="hint">
                Nếu backend khác port, set <code>VITE_API_BASE</code> trong <code>.env</code>
              </div>
            </div>

            {error ? (
              <div className="aya-alert" role="alert">
                <div className="title">Lỗi</div>
                <div className="msg">{error}</div>
              </div>
            ) : null}

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "Đang đăng nhập…" : "Login"}
            </button>

            <div className="foot">
              <span className="muted">Redirect sau login:</span> <code>{redirectTo}</code>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
