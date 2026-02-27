// src/services/useToast.ts
import { useCallback, useState } from "react";

export type ToastItem = {
  id: string;
  title: string;
  desc?: string;
  status: "success" | "error" | "info";
};

export function useToast() {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((title: string, desc = "", status: ToastItem["status"] = "success") => {
    const id = Math.random().toString(16).slice(2);
    setItems([{ id, title, desc, status }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((x) => x.id !== id));
    }, 4200);
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  return { items, push, remove };
}
