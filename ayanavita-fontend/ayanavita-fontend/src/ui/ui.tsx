// src/ui/ui.tsx
import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";

export const theme = {
  colors: {
    bg: "#0b1020",
    surface: "#0f172a",
    card: "#0b1220",
    border: "rgba(148,163,184,.22)",
    text: "rgba(255,255,255,.92)",
    muted: "rgba(255,255,255,.70)",
    faint: "rgba(255,255,255,.55)",
    brand: "#7c3aed",
    brand2: "#4f46e5",
    good: "#22c55e",
    warn: "#f59e0b",
    bad: "#ef4444",
    info: "#38bdf8",
  },
  radius: {
    xl: 18,
    lg: 14,
    md: 12,
    sm: 10,
  },
  shadow: {
    card: "0 20px 60px rgba(0,0,0,.35)",
    soft: "0 12px 40px rgba(0,0,0,.25)",
  },
};

const baseFont: React.CSSProperties = {
  fontFamily:
    'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
};

export function AppShell({
  children,
  title,
  actions,
}: {
  children: React.ReactNode;
  title?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div
      style={{
        ...baseFont,
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 600px at 20% 0%, rgba(124,58,237,.22), transparent 60%), radial-gradient(900px 500px at 80% 10%, rgba(79,70,229,.18), transparent 55%), linear-gradient(180deg, #050816, #070a12 60%, #050816)",
        color: theme.colors.text,
      }}
    >
      <Container>
        {(title || actions) && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
              padding: "22px 0 6px",
              flexWrap: "wrap",
            }}
          >
            <div>{title}</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{actions}</div>
          </div>
        )}
        {children}
        <div style={{ height: 24 }} />
      </Container>
    </div>
  );
}

export function Container({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        ...baseFont,
        width: "min(1100px, calc(100% - 32px))",
        margin: "0 auto",
      }}
    >
      {children}
    </div>
  );
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        ...baseFont,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.xl,
        background: "rgba(15,23,42,.55)",
        backdropFilter: "blur(10px)",
        boxShadow: theme.shadow.soft,
        padding: 16,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Title({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ ...baseFont, fontSize: 22, fontWeight: 900, letterSpacing: 0.2 }}>
      {children}
    </div>
  );
}

export function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ ...baseFont, marginTop: 6, color: theme.colors.muted, lineHeight: 1.5 }}>
      {children}
    </div>
  );
}

export function Muted({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ ...baseFont, color: theme.colors.faint, fontSize: 13 }}>{children}</span>
  );
}

export function Hr() {
  return <div style={{ height: 1, background: theme.colors.border, margin: "12px 0" }} />;
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  children: React.ReactNode;
}) {
  const border =
    tone === "success"
      ? theme.colors.good
      : tone === "warning"
      ? theme.colors.warn
      : tone === "danger"
      ? theme.colors.bad
      : tone === "info"
      ? theme.colors.info
      : "rgba(148,163,184,.35)";

  const bg =
    tone === "success"
      ? "rgba(34,197,94,.10)"
      : tone === "warning"
      ? "rgba(245,158,11,.10)"
      : tone === "danger"
      ? "rgba(239,68,68,.10)"
      : tone === "info"
      ? "rgba(56,189,248,.10)"
      : "rgba(148,163,184,.08)";

  return (
    <span
      style={{
        ...baseFont,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "5px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        border: `1px solid ${border}`,
        background: bg,
        color: theme.colors.text,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

type ButtonTone = "primary" | "neutral" | "success" | "danger" | "warning" | "info";
type ButtonVariant = "solid" | "ghost";

type ButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> & {
  tone?: ButtonTone;
  variant?: ButtonVariant;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
};

function toneToColor(tone: ButtonTone) {
  if (tone === "primary") return theme.colors.brand;
  if (tone === "success") return theme.colors.good;
  if (tone === "danger") return theme.colors.bad;
  if (tone === "warning") return theme.colors.warn;
  if (tone === "info") return theme.colors.info;
  return theme.colors.text;
}

export function Button({
  children,
  onClick,
  disabled,
  variant = "solid",
  tone = "primary",
  leftIcon,
  rightIcon,
  style,
  title,
  type = "button",
  ...rest
}: ButtonProps) {
  const toneColor = toneToColor(tone);

  const base: React.CSSProperties = {
    ...baseFont,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 40,
    padding: "0 14px",
    borderRadius: 12,
    fontWeight: 850,
    fontSize: 13,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    transition: "transform .08s ease, filter .15s ease, background .15s ease, border-color .15s ease",
    userSelect: "none",
    whiteSpace: "nowrap",
    border: `1px solid ${theme.colors.border}`,
  };

  const solid: React.CSSProperties =
    tone === "neutral"
      ? {
          background: "rgba(148,163,184,.12)",
          color: theme.colors.text,
          borderColor: theme.colors.border,
        }
      : {
          background: `linear-gradient(135deg, ${toneColor}, ${theme.colors.brand2})`,
          color: "white",
          borderColor: "rgba(255,255,255,.18)",
        };

  const ghost: React.CSSProperties =
    tone === "neutral"
      ? {
          background: "rgba(15,23,42,.35)",
          color: theme.colors.text,
          borderColor: theme.colors.border,
        }
      : {
          background: "transparent",
          color: toneColor,
          borderColor: `rgba(255,255,255,.18)`,
        };

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    if (disabled) return;
    const r = onClick?.(e);
    // tránh unhandled promise rejection
    if (r && typeof (r as any).then === "function") {
      (r as Promise<void>).catch((err) => console.error(err));
    }
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      title={title}
      style={{
        ...base,
        ...(variant === "solid" ? solid : ghost),
        ...style,
      }}
      onMouseDown={(e) => {
        if (disabled) return;
        e.currentTarget.style.transform = "scale(.98)";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
      {...rest}
    >
      {leftIcon ? (
        <span style={{ display: "inline-grid", placeItems: "center" }}>{leftIcon}</span>
      ) : null}
      <span style={{ lineHeight: 1 }}>{children}</span>
      {rightIcon ? (
        <span style={{ display: "inline-grid", placeItems: "center" }}>{rightIcon}</span>
      ) : null}
    </button>
  );
}


/**
 * Tooltip - CHỐT LỖI TRẮNG TRANG:
 * - Không đụng children.props nếu children không phải ReactElement
 * - Luôn wrap bằng <span> để đảm bảo event handlers + layout
 * - Dùng portal => không bị overflow hidden
 */
export function Tooltip({
  content,
  children,
  disabled,
  placement = "top",
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
  placement?: "top" | "bottom" | "left" | "right";
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLSpanElement | null>(null);

  // Tính vị trí tooltip theo anchor
  const pos = useMemo(() => {
    const r = anchorRef.current?.getBoundingClientRect();
    if (!r) return null;
    const gap = 10;
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;

    if (placement === "top") return { left: cx, top: r.top - gap, t: "top" as const };
    if (placement === "bottom") return { left: cx, top: r.bottom + gap, t: "bottom" as const };
    if (placement === "left") return { left: r.left - gap, top: cy, t: "left" as const };
    return { left: r.right + gap, top: cy, t: "right" as const };
  }, [open, placement]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reposition khi scroll/resize
  useEffect(() => {
    if (!open) return;
    const on = () => setOpen((v) => v); // trigger re-render
    window.addEventListener("scroll", on, true);
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on, true);
      window.removeEventListener("resize", on);
    };
  }, [open]);

  const tooltipEl =
    open && !disabled && pos
      ? ReactDOM.createPortal(
          <div
            role="tooltip"
            id={id}
            style={{
              ...baseFont,
              position: "fixed",
              left: pos.left,
              top: pos.top,
              transform:
                pos.t === "top"
                  ? "translate(-50%, -100%)"
                  : pos.t === "bottom"
                  ? "translate(-50%, 0)"
                  : pos.t === "left"
                  ? "translate(-100%, -50%)"
                  : "translate(0, -50%)",
              padding: "8px 10px",
              borderRadius: 12,
              border: `1px solid ${theme.colors.border}`,
              background: "rgba(2,6,23,.92)",
              color: theme.colors.text,
              fontSize: 12,
              maxWidth: 260,
              lineHeight: 1.45,
              boxShadow: theme.shadow.card,
              zIndex: 9999,
              pointerEvents: "none",
            }}
          >
            {content}
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <span
        ref={anchorRef}
        aria-describedby={open && !disabled ? id : undefined}
        style={{ display: "inline-flex", alignItems: "center" }}
        onMouseEnter={() => {
          if (disabled) return;
          setOpen(true);
        }}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => {
          if (disabled) return;
          setOpen(true);
        }}
        onBlur={() => setOpen(false)}
      >
        {children}
      </span>
      {tooltipEl}
    </>
  );
}
