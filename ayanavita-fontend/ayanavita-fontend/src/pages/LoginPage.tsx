// src/pages/LoginPage.tsx
import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ApiError } from "../api/http";
import { useAuth } from "../state/auth.store";
import { AppShell, Button, Card, Hr, Muted, SubTitle, Title } from "../ui/ui";

export default function LoginPage() {
  const nav = useNavigate();
  const loc = useLocation() as any;

  const { login, status } = useAuth();
  const from = useMemo(() => loc?.state?.from || "/courses", [loc]);

  const [email, setEmail] = useState("admin@ayanavita.com");
  const [password, setPassword] = useState("123456");
  const [err, setErr] = useState<string | null>(null);

  const busy = status === "loading";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await login(email.trim(), password);
      nav(from, { replace: true });
    } catch (e: any) {
      if (e instanceof ApiError) setErr(`(${e.status}) ${e.message}`);
      else setErr(String(e?.message || "Login failed"));
    }
  }

  return (
    <AppShell
      title={
        <>
          <Title>Đăng nhập AYANAVITA</Title>
          <SubTitle>Vui lòng đăng nhập để truy cập khoá học và bài học.</SubTitle>
        </>
      }
      actions={
        <Button
          tone="neutral"
          variant="ghost"
          onClick={() => {
            setEmail("");
            setPassword("");
            setErr(null);
          }}
        >
          Xoá form
        </Button>
      }
    >
      <div style={{ padding: "18px 0" }}>
        <Card style={{ maxWidth: 520 }}>
          <form onSubmit={onSubmit}>
            <div style={{ display: "grid", gap: 12 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <Muted>Email</Muted>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@domain.com"
                  autoComplete="email"
                  style={{
                    height: 42,
                    borderRadius: 12,
                    border: "1px solid rgba(148,163,184,.22)",
                    background: "rgba(2,6,23,.35)",
                    color: "rgba(255,255,255,.92)",
                    padding: "0 12px",
                    outline: "none",
                  }}
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <Muted>Mật khẩu</Muted>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  autoComplete="current-password"
                  style={{
                    height: 42,
                    borderRadius: 12,
                    border: "1px solid rgba(148,163,184,.22)",
                    background: "rgba(2,6,23,.35)",
                    color: "rgba(255,255,255,.92)",
                    padding: "0 12px",
                    outline: "none",
                  }}
                />
              </label>

              {err ? (
                <div
                  style={{
                    border: "1px solid rgba(239,68,68,.35)",
                    background: "rgba(239,68,68,.08)",
                    padding: "10px 12px",
                    borderRadius: 12,
                    fontSize: 13,
                  }}
                >
                  {err}
                </div>
              ) : null}

              <Hr />

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Button type="submit" disabled={busy}>
                  {busy ? "Đang đăng nhập…" : "Đăng nhập"}
                </Button>

                <Button
                  type="button"
                  tone="neutral"
                  variant="ghost"
                  onClick={() => nav(from, { replace: true })}
                  title="Đi tới trang mục tiêu (nếu đã đăng nhập)"
                >
                  Tiếp tục
                </Button>
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <Muted>
                  Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
                </Muted>
                <Muted>
                  Token lưu tại <b>localStorage.accessToken</b>
                </Muted>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
