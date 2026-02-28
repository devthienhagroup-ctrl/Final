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
      <style>{`
        .aya-login{ position:relative; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:28px; overflow:hidden; background:#070a12; color:#e6e9f2; }
        .aya-bg{ position:absolute; inset:0; background:
          radial-gradient(1200px 600px at 15% 25%, rgba(99,102,241,.35), transparent 55%),
          radial-gradient(900px 520px at 80% 30%, rgba(124,58,237,.28), transparent 55%),
          radial-gradient(1200px 700px at 50% 100%, rgba(245,158,11,.18), transparent 60%),
          linear-gradient(180deg, #070a12, #070a12);
        }
        .aya-grain{ position:absolute; inset:-2px; opacity:.12; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E"); mix-blend-mode:overlay; pointer-events:none;}
        .aya-blobs .blob{ position:absolute; width:540px; height:540px; border-radius:999px; filter: blur(40px); opacity:.35; transform: translate3d(0,0,0); }
        .aya-blobs .b1{ left:-180px; top:-160px; background: radial-gradient(circle at 30% 30%, rgba(99,102,241,.95), rgba(99,102,241,0)); }
        .aya-blobs .b2{ right:-220px; top:-120px; background: radial-gradient(circle at 30% 30%, rgba(124,58,237,.95), rgba(124,58,237,0)); }
        .aya-blobs .b3{ left:20%; bottom:-260px; background: radial-gradient(circle at 30% 30%, rgba(245,158,11,.75), rgba(245,158,11,0)); }

        .aya-wrap{ position:relative; width:100%; max-width:520px; z-index:2; }
        .aya-card{
          position:relative;
          background: linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.05));
          border: 1px solid rgba(148,163,184,.22);
          box-shadow: 0 30px 70px rgba(0,0,0,.45);
          border-radius: 22px;
          overflow:hidden;
          padding: 18px;
          backdrop-filter: blur(14px);
        }
        .aya-brand{
          display:flex; align-items:center; gap:10px;
          padding: 10px 12px;
          border-radius: 16px;
          background: rgba(2,6,23,.32);
          border: 1px solid rgba(148,163,184,.14);
        }
        .aya-brand .dot{ width:10px; height:10px; border-radius:999px; background: rgba(34,211,238,.95); box-shadow: 0 0 0 6px rgba(34,211,238,.12); }
        .aya-brand .name{ font-weight: 950; letter-spacing:.2px; }
        .aya-brand .g{
          background: linear-gradient(90deg, rgba(99,102,241,.95), rgba(124,58,237,.95));
          -webkit-background-clip:text; background-clip:text; color:transparent;
        }
        .aya-brand .sub{ margin-top:2px; font-size:12px; opacity:.7; }

        .aya-head{ padding: 14px 12px 4px; }
        .aya-head h1{ margin:0; font-size: 28px; letter-spacing:.2px; }
        .aya-head p{ margin:8px 0 0; opacity:.75; line-height:1.35; }

        .aya-form{ padding: 12px; display:grid; gap:12px; }
        .field{ display:grid; gap:6px; }
        .label{ font-size:12px; font-weight:900; opacity:.78; text-transform:uppercase; letter-spacing:.08em; }
        .control{ position:relative; display:flex; align-items:center; gap:10px; }
        .input{
          width:100%;
          padding: 12px 12px;
          border-radius: 14px;
          border: 1px solid rgba(148,163,184,.22);
          background: rgba(2,6,23,.35);
          color: #e6e9f2;
          outline:none;
        }
        .input:focus{
          border-color: rgba(99,102,241,.55);
          box-shadow: 0 0 0 4px rgba(99,102,241,.18);
        }
        .ghost{
          position:absolute;
          right:10px;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid rgba(148,163,184,.18);
          background: rgba(255,255,255,.06);
          color: rgba(226,232,240,.92);
          cursor:pointer;
          font-weight:800;
          font-size:12px;
        }
        .ghost:hover{ background: rgba(255,255,255,.09); }

        .row{ display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
        .check{ display:flex; align-items:center; gap:8px; font-weight:700; opacity:.85; }
        .check input{ width:16px; height:16px; }
        .hint{ font-size:12px; opacity:.7; }
        code{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size:12px; }

        .aya-alert{
          border-radius: 16px;
          padding: 12px 12px;
          background: rgba(239,68,68,.12);
          border: 1px solid rgba(239,68,68,.28);
        }
        .aya-alert .title{ font-weight:950; color: rgba(255,123,123,.95); }
        .aya-alert .msg{ margin-top:6px; opacity:.9; white-space: pre-wrap; }

        .btn-primary{
          width:100%;
          padding: 12px 14px;
          border-radius: 14px;
          border: 1px solid rgba(99,102,241,.35);
          background: linear-gradient(180deg, rgba(99,102,241,.95), rgba(88,80,236,.95));
          color: #0b1020;
          font-weight: 950;
          cursor: pointer;
          box-shadow: 0 16px 30px rgba(99,102,241,.22);
        }
        .btn-primary:disabled{ opacity:.7; cursor:not-allowed; }

        .foot{ margin-top:4px; font-size:12px; opacity:.75; text-align:center; }

        .muted{ opacity:.75; }
        .overlay{
          position:absolute; inset:0;
          background: rgba(2,6,23,.35);
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap:10px;
          backdrop-filter: blur(6px);
        }
        .spinner{
          width:22px; height:22px;
          border-radius:999px;
          border: 3px solid rgba(226,232,240,.25);
          border-top-color: rgba(99,102,241,.95);
          animation: spin .8s linear infinite;
        }
        .overlay .txt{ font-weight:900; opacity:.85; }
        @keyframes spin { to { transform: rotate(360deg);} }

        @media (max-width: 480px){
          .aya-head h1{ font-size:24px; }
        }
      `}</style>
    </div>
  );
}
