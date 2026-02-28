import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { login } from "../api/auth.api";
import { useAuth } from "../app/auth.store";

export function LoginPage() {
  const { setToken } = useAuth();

  const nav = useNavigate();
  const loc = useLocation() as any;

  const [email, setEmail] = useState("admin@ayanavita.vn");
  const [password, setPassword] = useState("123456");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Optional: nhớ email (UX tốt cho admin)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("aya_admin_email");
      if (saved) setEmail(saved);
    } catch {}
  }, []);

  const redirectTo = useMemo(() => loc?.state?.from || "/", [loc]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const cleanEmail = email.trim();
      const res = await login(cleanEmail, password);

      // DEBUG: xác nhận token có thật
      console.log("[LOGIN] got accessToken len=", res.accessToken?.length);
      console.log("[LOGIN] accessToken head=", (res.accessToken || "").slice(0, 18) + "...");

      setToken(res.accessToken);

      // DEBUG: confirm đã gọi setToken
      console.log("[LOGIN] setToken called");

      if (remember) {
        try {
          localStorage.setItem("aya_admin_email", cleanEmail);
        } catch {}
      } else {
        try {
          localStorage.removeItem("aya_admin_email");
        } catch {}
      }

      nav(redirectTo, { replace: true });
    } catch (e: any) {
      setErr(e?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="aya-login">
      {/* Background layers */}
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

          <form onSubmit={onSubmit} className="aya-form">
            <label className="field">
              <span className="label">Email</span>
              <div className="control">
                <input
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••"
                />
                <button
                  type="button"
                  className="ghost"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                  title={showPass ? "Hide" : "Show"}
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
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span>Nhớ email</span>
              </label>

              <div className="hint">
                Nếu backend port khác, set <code>VITE_API_BASE</code> trong <code>.env</code>
              </div>
            </div>

            {err ? (
              <div className="aya-alert" role="alert">
                <div className="title">Lỗi</div>
                <div className="msg">{err}</div>
              </div>
            ) : null}

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "Đang đăng nhập…" : "Login"}
            </button>

            <div className="foot">
              <span className="muted">Redirect sau login:</span> <code>{redirectTo}</code>
            </div>
          </form>

          {loading ? (
            <div className="overlay" aria-hidden="true">
              <div className="spinner" />
              <div className="txt">Đang xác thực…</div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Local CSS (self-contained) */}
      <style>{`.aya-login{
  position:relative;
  min-height:100vh;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:28px;
  overflow:hidden;
  background:#f6f7ff;
  color:#0f172a;
}
.aya-bg{
  position:absolute;
  inset:0;
  background:
    radial-gradient(1200px 650px at 12% 18%, rgba(99,102,241,.22), transparent 60%),
    radial-gradient(900px 520px at 82% 28%, rgba(34,211,238,.18), transparent 58%),
    radial-gradient(1100px 650px at 45% 105%, rgba(245,158,11,.14), transparent 62%),
    linear-gradient(180deg, #f8fafc, #f4f7ff);
}
.aya-grain{
  position:absolute;
  inset:-2px;
  opacity:.07;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E");
  mix-blend-mode:multiply;
  pointer-events:none;
}

.aya-blobs .blob{
  position:absolute;
  width:560px;
  height:560px;
  border-radius:999px;
  filter: blur(60px);
  opacity:.22;
  transform: translate3d(0,0,0);
  animation: float 10s ease-in-out infinite;
}
.aya-blobs .b1{
  left:-210px;
  top:-180px;
  background: radial-gradient(circle at 30% 30%, rgba(99,102,241,.95), rgba(99,102,241,0));
  animation-delay: -1.2s;
}
.aya-blobs .b2{
  right:-250px;
  top:-160px;
  background: radial-gradient(circle at 30% 30%, rgba(34,211,238,.9), rgba(34,211,238,0));
  animation-delay: -3.6s;
}
.aya-blobs .b3{
  left:18%;
  bottom:-300px;
  background: radial-gradient(circle at 30% 30%, rgba(245,158,11,.8), rgba(245,158,11,0));
  animation-delay: -2.4s;
}

.aya-wrap{ position:relative; width:100%; max-width:520px; z-index:2; }
.aya-card{
  position:relative;
  background: linear-gradient(180deg, rgba(255,255,255,.92), rgba(255,255,255,.78));
  border: 1px solid rgba(15,23,42,.08);
  box-shadow: 0 30px 70px rgba(15,23,42,.14);
  border-radius: 22px;
  overflow:hidden;
  padding: 18px;
  backdrop-filter: blur(16px);
  animation: pop .35s ease-out both;
}

.aya-brand{
  display:flex; align-items:center; gap:10px;
  padding: 10px 12px;
  border-radius: 16px;
  background: rgba(255,255,255,.72);
  border: 1px solid rgba(15,23,42,.06);
}
.aya-brand .dot{
  width:10px; height:10px; border-radius:999px;
  background: linear-gradient(180deg, rgba(34,211,238,.95), rgba(99,102,241,.95));
  box-shadow: 0 0 0 6px rgba(99,102,241,.10);
}
.aya-brand .name{ font-weight: 950; letter-spacing:.2px; }
.aya-brand .g{
  background: linear-gradient(90deg, rgba(99,102,241,.95), rgba(124,58,237,.95));
  -webkit-background-clip:text; background-clip:text; color:transparent;
}
.aya-brand .sub{ margin-top:2px; font-size:12px; color: rgba(15,23,42,.62); }

.aya-head{ padding: 14px 12px 4px; }
.aya-head h1{ margin:0; font-size: 28px; letter-spacing:.2px; }
.aya-head p{ margin:8px 0 0; color: rgba(15,23,42,.70); line-height:1.35; }

.aya-form{ padding: 12px; display:grid; gap:12px; }
.field{ display:grid; gap:6px; }
.label{
  font-size:12px;
  font-weight:900;
  color: rgba(15,23,42,.70);
  text-transform:uppercase;
  letter-spacing:.08em;
}
.control{ position:relative; display:flex; align-items:center; gap:10px; }
.input{
  width:100%;
  padding: 12px 12px;
  border-radius: 14px;
  border: 1px solid rgba(15,23,42,.12);
  background: rgba(255,255,255,.92);
  color: #0f172a;
  outline:none;
  transition: box-shadow .15s ease, border-color .15s ease, transform .15s ease;
}
.input::placeholder{ color: rgba(100,116,139,.8); }
.input:focus{
  border-color: rgba(99,102,241,.55);
  box-shadow: 0 0 0 4px rgba(99,102,241,.18);
}
.input:active{ transform: translateY(0.5px); }

.ghost{
  position:absolute;
  right:10px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(15,23,42,.12);
  background: rgba(255,255,255,.85);
  color: rgba(15,23,42,.78);
  cursor:pointer;
  font-weight:900;
  font-size:12px;
  transition: transform .12s ease, background .12s ease;
}
.ghost:hover{ background: rgba(255,255,255,.98); }
.ghost:active{ transform: scale(.98); }

.row{ display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
.check{ display:flex; align-items:center; gap:8px; font-weight:800; color: rgba(15,23,42,.72); }
.check input{ width:16px; height:16px; accent-color: rgba(99,102,241,.95); }

.hint{ font-size:12px; color: rgba(15,23,42,.62); }
code{
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size:12px;
  padding: 2px 6px;
  border-radius: 8px;
  background: rgba(15,23,42,.04);
  border: 1px solid rgba(15,23,42,.06);
}

.aya-alert{
  border-radius: 16px;
  padding: 12px 12px;
  background: rgba(239,68,68,.10);
  border: 1px solid rgba(239,68,68,.22);
}
.aya-alert .title{ font-weight:950; color: rgba(185,28,28,.95); }
.aya-alert .msg{ margin-top:6px; color: rgba(15,23,42,.80); white-space: pre-wrap; }

.btn-primary{
  width:100%;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(99,102,241,.35);
  background: linear-gradient(180deg, rgba(99,102,241,.98), rgba(124,58,237,.98));
  color: #ffffff;
  font-weight: 950;
  cursor: pointer;
  box-shadow: 0 16px 30px rgba(99,102,241,.22);
  transition: transform .12s ease, box-shadow .12s ease, filter .12s ease;
}
.btn-primary:hover{ filter: brightness(1.02); box-shadow: 0 18px 36px rgba(99,102,241,.26); }
.btn-primary:active{ transform: translateY(1px); }
.btn-primary:disabled{ opacity:.70; cursor:not-allowed; }

.foot{ margin-top:4px; font-size:12px; color: rgba(15,23,42,.60); text-align:center; }

.muted{ color: rgba(15,23,42,.62); }

.overlay{
  position:absolute; inset:0;
  background: rgba(255,255,255,.62);
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap:10px;
  backdrop-filter: blur(6px);
}
.spinner{
  width:22px; height:22px;
  border-radius:999px;
  border: 3px solid rgba(15,23,42,.12);
  border-top-color: rgba(99,102,241,.95);
  animation: spin .8s linear infinite;
}
.overlay .txt{ font-weight:900; color: rgba(15,23,42,.70); }
@keyframes spin { to { transform: rotate(360deg);} }
@keyframes pop { from { transform: translateY(6px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes float {
  0%,100% { transform: translate3d(0,0,0) scale(1); }
  50% { transform: translate3d(0,-14px,0) scale(1.02); }
}

@media (max-width: 480px){
  .aya-login{ padding:18px; }
  .aya-head h1{ font-size:24px; }
}`}</style>
    </div>
  );
}