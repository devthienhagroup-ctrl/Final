import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { login } from "../../app/api";
import { useAuth } from "../../app/auth";

type LocationState = { from?: string };

const DEFAULT_ACCESS_TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AYXlhbmF2aXRhLnZuIiwicm9sZSI6IkFETUlOIiwic2NvcGVUeXBlIjoiR0xPQkFMIiwicGVybWlzc2lvbnMiOlsiZGFzaGJvYXJkLmFkbWluIiwib3JkZXJzLnJlYWQiLCJyb2xlLnJlYWQiLCJzcGFfc2VydmljZXMucmVhZCIsImNvdXJzZXMucmVhZCIsImNvdXJzZXMud3JpdGUiLCJyZXZpZXdzLnJlYWQiLCJibG9ncy5yZWFkIiwicHJvZHVjdHMucmVhZCIsImNtcy5yZWFkIiwiY21zLndyaXRlIiwibXlfY291cnNlcy5yZWFkIl19.c2lnbmF0dXJl";
const DEFAULT_REFRESH_TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOjEsInR5cGUiOiJSRUZSRVNIIiwicm9sZSI6IkFETUlOIiwic2NvcGVUeXBlIjoiR0xPQkFMIn0.c2lnbmF0dXJl";

const DEFAULT_PERMISSIONS = [
  "dashboard.admin",
  "orders.read",
  "role.read",
  "spa_services.read",
  "courses.read",
  "courses.write",
  "reviews.read",
  "blogs.read",
  "products.read",
  "cms.read",
  "cms.write",
  "my_courses.read",
];

const PERMISSION_ROUTE_MAP: Array<{ permission: string; path: string }> = [
  { permission: "orders.read", path: "/admin/orders" },
  { permission: "role.read", path: "/admin/rbac" },
  { permission: "spa_services.read", path: "/admin/services" },
  { permission: "courses.read", path: "/admin/courses" },
  { permission: "reviews.read", path: "/admin/reviews" },
  { permission: "blogs.read", path: "/admin/blog" },
  { permission: "products.read", path: "/admin/product" },
  { permission: "cms.read", path: "/admin/cms" },
  { permission: "cms.write", path: "/admin/cms" },
];

function resolveDefaultRoute(permissions: string[]) {
  if (permissions.includes("dashboard.admin")) return "/admin/dashboard";
  for (const route of PERMISSION_ROUTE_MAP) {
    if (permissions.includes(route.permission)) return route.path;
  }
  if (permissions.includes("courses.write")) return "http://localhost:5181/instructor";
  if (permissions.includes("my_courses.read")) return "http://localhost:50800/student";
  return "/login";
}

export function LoginPage() {
  const { setTokenPair, token } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const state = (loc.state as LocationState | null) ?? null;

  const [email, setEmail] = useState("admin@ayanavita.vn");
  const [password, setPassword] = useState("123456");
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useState(false);

  const from = useMemo(() => state?.from || "", [state]);

  useEffect(() => {
    const savedEmail = localStorage.getItem("aya_admin_email");
    if (savedEmail) setEmail(savedEmail);
  }, []);

  useEffect(() => {
    if (token) return;

    setTokenPair(DEFAULT_ACCESS_TOKEN, DEFAULT_REFRESH_TOKEN, DEFAULT_PERMISSIONS);
    const targetPath = from || resolveDefaultRoute(DEFAULT_PERMISSIONS);

    if (targetPath.startsWith("http")) {
      window.location.href = targetPath;
      return;
    }

    nav(targetPath, { replace: true });
  }, [from, nav, setTokenPair, token]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const cleanEmail = email.trim();
      const result = await login(cleanEmail, password);
      const permissions = result.user?.permissions ?? result.permissions ?? [];
      setTokenPair(result.accessToken, result.refreshToken, permissions);

      if (remember) localStorage.setItem("aya_admin_email", cleanEmail);
      else localStorage.removeItem("aya_admin_email");

      const targetPath = from || resolveDefaultRoute(permissions);
      if (targetPath.startsWith("http")) {
        window.location.href = targetPath;
        return;
      }

      nav(targetPath, { replace: true });
    } catch (error: unknown) {
      if (error && typeof error === "object" && "message" in error) {
        setErr(String((error as { message?: unknown }).message ?? "Đăng nhập thất bại"));
      } else {
        setErr("Đăng nhập thất bại");
      }
    } finally {
      setLoading(false);
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
        className="__login_grid"
        style={{
          width: "min(1100px, 100%)",
          borderRadius: 26,
          overflow: "hidden",
          position: "relative",
          boxShadow: dark ? "0 30px 80px rgba(0,0,0,.55)" : "0 30px 80px rgba(17,24,39,.18)",
          border: dark ? "1px solid rgba(148,163,184,.18)" : "1px solid rgba(226,232,240,1)",
          background: cardBg,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
        }}
      >
        <div style={{ padding: "44px 46px", color: text }}>
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <div style={{ fontWeight: 900, letterSpacing: 1.2, fontSize: 22 }}>LOGIN</div>
            <div style={{ marginTop: 6, fontSize: 13, color: subText }}>Đăng nhập để truy cập trang quản trị.</div>
          </div>

          <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
            <label style={{ display: "grid", gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: subText }}>Email</div>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", opacity: 0.75, fontSize: 14 }}>👤</div>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@domain.com"
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
                <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", opacity: 0.75, fontSize: 14 }}>🔒</div>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
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

            <label style={{ display: "flex", alignItems: "center", gap: 8, color: subText, fontSize: 13 }}>
              <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
              Nhớ email đăng nhập
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
              disabled={loading}
              style={{
                height: 46,
                borderRadius: 14,
                border: 0,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.82 : 1,
                fontWeight: 900,
                color: "#fff",
                background: "linear-gradient(135deg, #6D5EF6, #8B5CF6)",
                boxShadow: "0 16px 30px rgba(109,94,246,.30)",
                marginTop: 6,
              }}
            >
              {loading ? "Đang đăng nhập..." : "Login Now"}
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

          </form>
        </div>

        <div
          style={{
            position: "relative",
            background: "linear-gradient(135deg, #6D5EF6 0%, #8B5CF6 55%, #5B4CF0 100%)",
            overflow: "hidden",
          }}
        >
          <svg aria-hidden="true" viewBox="0 0 800 800" style={{ position: "absolute", inset: 0, opacity: 0.22 }}>
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
                <stop offset="1" stopColor="#ffffff" stopOpacity="0.15" />
              </linearGradient>
            </defs>
            <path d="M0,120 C120,80 220,220 360,180 C520,130 560,40 800,110 L800,0 L0,0 Z" fill="url(#g)" />
            <path d="M0,260 C140,220 240,360 380,320 C520,280 600,170 800,250 L800,170 C620,120 560,210 420,240 C250,275 180,170 0,210 Z" fill="url(#g)" />
            <path d="M0,470 C170,430 260,560 420,520 C580,480 640,390 800,470 L800,390 C650,340 590,430 450,455 C280,485 200,380 0,420 Z" fill="url(#g)" />
            <path d="M0,680 C190,640 300,760 460,720 C620,680 700,580 800,650 L800,800 L0,800 Z" fill="url(#g)" />
          </svg>

          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: 30 }}>
            <div
              style={{
                width: "min(420px, 86%)",
                aspectRatio: "4 / 4",
                borderRadius: 22,
                background: "rgba(255,255,255,.12)",
                border: "1px solid rgba(255,255,255,.25)",
                boxShadow: "0 30px 80px rgba(0,0,0,.25)",
                display: "grid",
                placeItems: "center",
                overflow: "hidden"
              }}
            >
                <img
                    alt="visual"
                    src="https://s3.cloudfly.vn/ayanavita-dev/login.jpg"
                    style={{
                        width: "85%",
                        height: "78%",
                        objectFit: "cover", // 👈 cắt bên phải nhiều hơn
                        borderRadius: 18,
                        boxShadow: "0 20px 50px rgba(0,0,0,.22)",
                    }}
                />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDark((value) => !value)}
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

          <div aria-hidden="true" style={{ position: "absolute", left: -22, top: 34, width: 54, height: 54, borderRadius: 999, background: "rgba(255,255,255,.20)" }} />
          <div aria-hidden="true" style={{ position: "absolute", right: -30, bottom: 44, width: 70, height: 70, borderRadius: 999, background: "rgba(255,255,255,.20)" }} />
        </div>
      </div>

      <style>{`
        @media (max-width: 900px){
          .__login_grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
