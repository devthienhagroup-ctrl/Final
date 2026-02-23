import React, { createContext, useContext, useMemo, useState } from "react";

type ToastItem = { id: string; kind: "ok" | "err"; title: string; detail?: string };
type ToastApi = { push: (t: Omit<ToastItem, "id">) => void };

const ToastCtx = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const api = useMemo<ToastApi>(() => ({
    push(t) {
      const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
      const item: ToastItem = { id, ...t };
      setItems((prev) => [item, ...prev].slice(0, 5));
      setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== id)), 4500);
    },
  }), []);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="toast" aria-live="polite" aria-relevant="additions">
        {items.map((t) => (
          <div key={t.id} className={`toast-item ${t.kind}`}>
            <div style={{ fontWeight: 950 }}>{t.title}</div>
            {t.detail ? <div className="muted" style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{t.detail}</div> : null}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
