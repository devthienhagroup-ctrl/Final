import React from "react";

type AlertKind = "info" | "success" | "warning" | "error";

export function AppAlert({
  kind = "info",
  title,
  message,
}: {
  kind?: AlertKind;
  title: string;
  message: string;
}) {
  const iconMap: Record<AlertKind, string> = {
    info: "ℹ️",
    success: "✅",
    warning: "⚠️",
    error: "⛔",
  };

  return (
    <div className={`app-alert app-alert-${kind}`} role="alert">
      <div className="app-alert-icon" aria-hidden="true">{iconMap[kind]}</div>
      <div className="app-alert-content">
        <div className="app-alert-title">{title}</div>
        <div className="app-alert-message">{message}</div>
      </div>
    </div>
  );
}
