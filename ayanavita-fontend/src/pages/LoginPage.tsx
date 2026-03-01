// src/pages/LoginPage.tsx
import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ApiError } from "../api/http";
import { useAuth } from "../state/auth.store";

type LocationState = { from?: string };

function GoogleIcon() {
  return (
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path
            fill="#FFC107"
            d="M43.611 20.083H42V20H24v8h11.303C33.68 32.657 29.21 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.047 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z"
        />
        <path
            fill="#FF3D00"
            d="M6.306 14.691l6.571 4.819C14.655 16.108 19.01 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.047 6.053 29.268 4 24 4c-7.682 0-14.33 4.336-17.694 10.691z"
        />
        <path
            fill="#4CAF50"
            d="M24 44c5.166 0 9.86-1.977 13.409-5.197l-6.191-5.238C29.148 35.091 26.715 36 24 36c-5.189 0-9.646-3.318-11.279-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
        />
        <path
            fill="#1976D2"
            d="M43.611 20.083H42V20H24v8h11.303a11.98 11.98 0 0 1-4.085 5.565l.003-.002 6.191 5.238C36.97 39.205 44 34 44 24c0-1.341-.138-2.651-.389-3.917z"
        />
      </svg>
  );
}

function FacebookIcon() {
  return (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path
            fill="#1877F2"
            d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.414c0-3.027 1.792-4.7 4.533-4.7 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.49 0-1.953.93-1.953 1.887v2.266h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"
        />
      </svg>
  );
}

export default function LoginPage() {
  const nav = useNavigate();
  const loc = useLocation();
  const state = (loc.state as LocationState | null) ?? null;

  // ✅ API thật: dùng y hệt bản cũ
  const { login, status } = useAuth();
  const from = useMemo(() => state?.from || "/courses", [state]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const [dark, setDark] = useState(false);
  const busy = status === "loading";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    try {
      await login(email.trim(), password);
      nav(from, { replace: true });
    } catch (e: unknown) {
      if (e instanceof ApiError) setErr(`(${e.status}) ${e.message}`);
      else if (e && typeof e === "object" && "message" in e) {
        setErr(String((e as { message?: unknown }).message ?? "Login failed"));
      } else setErr("Login failed");
    }
  }

  const bg = dark ? "#0b1220" : "#ECE9FF";
  const cardBg = dark ? "rgba(15,23,42,.78)" : "rgba(255,255,255,1)";
  const text = dark ? "rgba(255,255,255,.92)" : "#0f172a";
  const subText = dark ? "rgba(226,232,240,.70)" : "rgba(100,116,139,1)";
  const fieldBg = dark ? "rgba(2,6,23,.38)" : "rgba(241,245,249,1)";
  const fieldBorder = dark ? "rgba(148,163,184,.18)" : "rgba(226,232,240,1)";

  return (
      <div
          style={{
            minHeight: "100vh",
            background: bg,
            display: "grid",
            placeItems: "center",
            padding: 22,
          }}
      >
        {/* soft blobs */}
        <div
            aria-hidden="true"
            style={{
              position: "fixed",
              inset: 0,
              pointerEvents: "none",
              background:
                  "radial-gradient(420px 260px at 18% 18%, rgba(124,58,237,.22), transparent 60%)," +
                  "radial-gradient(520px 320px at 80% 30%, rgba(79,70,229,.18), transparent 62%)," +
                  "radial-gradient(520px 340px at 70% 85%, rgba(245,158,11,.10), transparent 65%)",
            }}
        />

        <div
            style={{
              width: "min(1100px, 100%)",
              borderRadius: 26,
              overflow: "hidden",
              position: "relative",
              boxShadow: dark
                  ? "0 30px 80px rgba(0,0,0,.55)"
                  : "0 30px 80px rgba(17,24,39,.18)",
              border: dark ? "1px solid rgba(148,163,184,.18)" : "1px solid rgba(226,232,240,1)",
              background: cardBg,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
            }}
        >
          {/* LEFT: Form */}
          <div style={{ padding: "44px 46px", color: text }}>
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <div style={{ fontWeight: 900, letterSpacing: 1.2, fontSize: 22 }}>LOGIN</div>
              <div style={{ marginTop: 6, fontSize: 13, color: subText }}>
                Đăng nhập để truy cập khoá học và bài học.
              </div>
            </div>

            <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
              <label style={{ display: "grid", gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: subText }}>Email</div>
                <div style={{ position: "relative" }}>
                  <div
                      style={{
                        position: "absolute",
                        left: 14,
                        top: "50%",
                        transform: "translateY(-50%)",
                        opacity: 0.75,
                        fontSize: 14,
                      }}
                  >
                    👤
                  </div>
                  <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@domain.com"
                      autoComplete="email"
                      style={{
                        height: 46,
                        width: "100%",
                        borderRadius: 14,
                        border: `1px solid ${fieldBorder}`,
                        background: fieldBg,
                        color: text,
                        padding: "0 14px 0 42px",
                        outline: "none",
                      }}
                  />
                </div>
              </label>

              <label style={{ display: "grid", gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: subText }}>Mật khẩu</div>
                <div style={{ position: "relative" }}>
                  <div
                      style={{
                        position: "absolute",
                        left: 14,
                        top: "50%",
                        transform: "translateY(-50%)",
                        opacity: 0.75,
                        fontSize: 14,
                      }}
                  >
                    🔒
                  </div>
                  <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••"
                      autoComplete="current-password"
                      style={{
                        height: 46,
                        width: "100%",
                        borderRadius: 14,
                        border: `1px solid ${fieldBorder}`,
                        background: fieldBg,
                        color: text,
                        padding: "0 14px 0 42px",
                        outline: "none",
                      }}
                  />
                </div>
              </label>

              {err ? (
                  <div
                      style={{
                        borderRadius: 14,
                        padding: "10px 12px",
                        border: "1px solid rgba(239,68,68,.35)",
                        background: "rgba(239,68,68,.10)",
                        color: dark ? "rgba(254,226,226,.95)" : "rgba(127,29,29,1)",
                        fontSize: 13,
                      }}
                  >
                    <b style={{ display: "block", marginBottom: 4 }}>Đăng nhập thất bại</b>
                    {err}
                  </div>
              ) : null}

              <button
                  type="submit"
                  disabled={busy}
                  style={{
                    height: 46,
                    borderRadius: 14,
                    border: 0,
                    cursor: busy ? "not-allowed" : "pointer",
                    opacity: busy ? 0.82 : 1,
                    fontWeight: 900,
                    color: "#fff",
                    background: "linear-gradient(135deg, #6D5EF6, #8B5CF6)",
                    boxShadow: "0 16px 30px rgba(109,94,246,.30)",
                    marginTop: 6,
                  }}
              >
                {busy ? "Đang đăng nhập..." : "Login Now"}
              </button>

              <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                <button
                    type="button"
                    onClick={() => {
                      setEmail("");
                      setPassword("");
                      setErr(null);
                    }}
                    style={{
                      height: 40,
                      padding: "0 14px",
                      borderRadius: 12,
                      border: `1px solid ${fieldBorder}`,
                      background: dark ? "rgba(2,6,23,.20)" : "rgba(255,255,255,.8)",
                      color: text,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                >
                  Xoá form
                </button>

                <button
                    type="button"
                    onClick={() => nav(from, { replace: true })}
                    style={{
                      height: 40,
                      padding: "0 14px",
                      borderRadius: 12,
                      border: `1px solid ${fieldBorder}`,
                      background: dark ? "rgba(2,6,23,.20)" : "rgba(255,255,255,.8)",
                      color: text,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                    title="Đi tới trang mục tiêu (nếu đã đăng nhập)"
                >
                  Tiếp tục
                </button>
              </div>

              <div style={{ textAlign: "center", marginTop: 6 }}>
                <div style={{ fontWeight: 900, fontSize: 13, color: text }}>Login</div>
                <div style={{ fontSize: 12, color: subText }}>with Others</div>
              </div>

              <button
                  type="button"
                  onClick={() => alert("Prototype: Google OAuth")}
                  style={{
                    height: 46,
                    borderRadius: 14,
                    border: `1px solid ${fieldBorder}`,
                    background: dark ? "rgba(2,6,23,.24)" : "#fff",
                    color: text,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    cursor: "pointer",
                  }}
              >
                <GoogleIcon />
                Login with google
              </button>

              <button
                  type="button"
                  onClick={() => alert("Prototype: Facebook OAuth")}
                  style={{
                    height: 46,
                    borderRadius: 14,
                    border: `1px solid ${fieldBorder}`,
                    background: dark ? "rgba(2,6,23,.24)" : "#fff",
                    color: text,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    cursor: "pointer",
                  }}
              >
                <FacebookIcon />
                Login with Facebook
              </button>

              <div style={{ marginTop: 6, textAlign: "center", fontSize: 12, color: subText }}>
                Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
                <div style={{ marginTop: 6 }}>
                  Redirect sau login: <b style={{ color: text }}>{from}</b>
                </div>
                <div style={{ marginTop: 6 }}>
                  Token lưu tại <b style={{ color: text }}>localStorage.accessToken</b>
                </div>
              </div>
            </form>
          </div>

          {/* RIGHT: Purple Visual */}
          <div
              style={{
                position: "relative",
                background: "linear-gradient(135deg, #6D5EF6 0%, #8B5CF6 55%, #5B4CF0 100%)",
                overflow: "hidden",
              }}
          >
            <svg
                aria-hidden="true"
                viewBox="0 0 800 800"
                style={{ position: "absolute", inset: 0, opacity: 0.22 }}
            >
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
                  <stop offset="1" stopColor="#ffffff" stopOpacity="0.15" />
                </linearGradient>
              </defs>
              <path d="M0,120 C120,80 220,220 360,180 C520,130 560,40 800,110 L800,0 L0,0 Z" fill="url(#g)" />
              <path
                  d="M0,260 C140,220 240,360 380,320 C520,280 600,170 800,250 L800,170 C620,120 560,210 420,240 C250,275 180,170 0,210 Z"
                  fill="url(#g)"
              />
              <path
                  d="M0,470 C170,430 260,560 420,520 C580,480 640,390 800,470 L800,390 C650,340 590,430 450,455 C280,485 200,380 0,420 Z"
                  fill="url(#g)"
              />
              <path d="M0,680 C190,640 300,760 460,720 C620,680 700,580 800,650 L800,800 L0,800 Z" fill="url(#g)" />
            </svg>

            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: 30 }}>
              <div
                  style={{
                    width: "min(420px, 86%)",
                    aspectRatio: "4 / 5",
                    borderRadius: 22,
                    background: "rgba(255,255,255,.12)",
                    border: "1px solid rgba(255,255,255,.25)",
                    boxShadow: "0 30px 80px rgba(0,0,0,.25)",
                    display: "grid",
                    placeItems: "center",
                    position: "relative",
                    overflow: "hidden",
                  }}
              >
                <div
                    style={{
                      position: "absolute",
                      inset: 18,
                      borderRadius: 18,
                      border: "1px solid rgba(255,255,255,.22)",
                      background: "rgba(255,255,255,.10)",
                    }}
                />
                <img
                    alt="visual"
                    src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80"
                    style={{
                      width: "78%",
                      height: "78%",
                      objectFit: "cover",
                      borderRadius: 18,
                      zIndex: 2,
                      boxShadow: "0 20px 50px rgba(0,0,0,.22)",
                    }}
                />
              </div>
            </div>

            <button
                type="button"
                onClick={() => setDark((v) => !v)}
                title="Toggle theme"
                style={{
                  position: "absolute",
                  left: -20,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 46,
                  height: 46,
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,.35)",
                  background: "rgba(255,255,255,.92)",
                  boxShadow: "0 16px 34px rgba(0,0,0,.22)",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                }}
            >
              <span style={{ fontSize: 18 }}>{dark ? "☀️" : "✨"}</span>
            </button>

            <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: -22,
                  top: 34,
                  width: 54,
                  height: 54,
                  borderRadius: 999,
                  background: "rgba(255,255,255,.20)",
                }}
            />
            <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  right: -30,
                  bottom: 44,
                  width: 70,
                  height: 70,
                  borderRadius: 999,
                  background: "rgba(255,255,255,.20)",
                }}
            />
          </div>
        </div>

        {/* mobile: hide right panel */}
        <style>{`
        @media (max-width: 900px){
          .__login_grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
        <script
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html: `
            // no-op
          `,
            }}
        />
      </div>
  );
}