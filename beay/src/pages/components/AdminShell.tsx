import React, { useEffect, useMemo, useState } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";
import { NotificationsDrawer } from "./NotificationsDrawer";

type Props = {
  children: React.ReactNode;

  theme: "light" | "dark";
  onToggleTheme: () => void;

  rangeDays: number;
  onRangeChange: (v: number) => void;

  search: string;
  onSearchChange: (v: string) => void;

  onHotkey: (k: "revenue" | "orders") => void;

  onConnectPay: () => void;
  onCreateCourse: () => void;
  onExportMiniOrders: () => void;
};

export function AdminShell(props: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("theme-dark", props.theme === "dark");
  }, [props.theme]);

  // hotkeys
  useEffect(() => {
    let gPressed = false;

    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || "").toUpperCase();
      const typing = tag === "INPUT" || tag === "TEXTAREA";

      if (e.key === "/" && !typing) {
        e.preventDefault();
        const el = document.getElementById("adminSearchInput") as HTMLInputElement | null;
        el?.focus();
        return;
      }

      if (e.key.toLowerCase() === "r") props.onHotkey("revenue");
      if (e.key.toLowerCase() === "o") props.onHotkey("orders");
      if (e.key.toLowerCase() === "n") setNotifOpen(true);

      if (e.key.toLowerCase() === "g") {
        gPressed = true;
        window.setTimeout(() => (gPressed = false), 800);
      }
      if (gPressed && e.key.toLowerCase() === "o") {
        // TODO: navigate /admin/orders
      }

      if (e.key === "Escape") {
        setSidebarOpen(false);
        setNotifOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [props]);

  const rootClass = useMemo(() => {
    return [
      "min-h-screen flex",
      "soft",
      "text-slate-900",
    ].join(" ");
  }, []);

  return (
    <div className={rootClass}>
      {/* overlay mobile sidebar */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 ${sidebarOpen ? "" : "hidden"}`}
        onClick={() => setSidebarOpen(false)}
      />

      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onConnectPay={props.onConnectPay}
      />

      <main className="flex-1 w-full">
        <AdminTopbar
          onOpenSidebar={() => setSidebarOpen(true)}
          theme={props.theme}
          onToggleTheme={props.onToggleTheme}
          rangeDays={props.rangeDays}
          onRangeChange={props.onRangeChange}
          search={props.search}
          onSearchChange={props.onSearchChange}
          onOpenNotif={() => setNotifOpen(true)}
          onCreateCourse={props.onCreateCourse}
        />

        <div className="px-4 md:px-8 py-6 space-y-6" id="overview">
          {props.children}
        </div>
      </main>

      <NotificationsDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  );
}