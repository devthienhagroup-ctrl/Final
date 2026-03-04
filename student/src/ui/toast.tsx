import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastItem = { id: string; title: string; desc?: string };

type ToastCtx = {
  toast: (title: string, desc?: string) => void;
};

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((title: string, desc?: string) => {
    const id = Math.random().toString(16).slice(2);
    const item: ToastItem = { id, title, desc };
    setItems((prev) => [item, ...prev]);

    window.setTimeout(() => {
      setItems((prev) => prev.filter((x) => x.id !== id));
    }, 4200);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="fixed right-[18px] bottom-[18px] z-[100] flex flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className="min-w-[280px] max-w-[360px] rounded-[18px] border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(2,6,23,0.06)] p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-extrabold">{t.title}</div>
                {t.desc ? <div className="mt-1 text-[13px] text-slate-500">{t.desc}</div> : null}
              </div>
              <button
                className="h-9 w-9 rounded-2xl border border-slate-200/70 bg-white hover:bg-slate-50"
                onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}