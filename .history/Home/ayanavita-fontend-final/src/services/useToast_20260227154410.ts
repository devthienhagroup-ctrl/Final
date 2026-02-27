// src/services/useToast.ts
import { useCallback, useState } from "react";

export type ToastItem = {
  id: string;
  title: string;
  desc?: string;
};

export function useToast() {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((title: string, desc = "") => {
    const id = Math.random().toString(16).slice(2);
    setItems([{ id, title, desc }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((x) => x.id !== id));
    }, 4200);
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  return { items, push, remove };
}
