import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthModal } from "../components/home/AuthModal";

function sanitizeNext(raw: string | null) {
  if (!raw) return "/";
  if (!raw.startsWith("/")) return "/";
  if (raw.startsWith("//")) return "/";
  return raw;
}

export default function LoginPage() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const [authTab, setAuthTab] = useState<"login" | "register">("login");

  const nextPath = useMemo(() => sanitizeNext(searchParams.get("next")), [searchParams]);

  const goNext = () => nav(nextPath, { replace: true });

  return (
    <div className="min-h-[60vh]">
      <AuthModal
        open
        tab={authTab}
        onSwitchTab={setAuthTab}
        onClose={() => nav(-1)}
        onLoginSuccess={goNext}
        onRegisterSuccess={goNext}
      />
    </div>
  );
}
