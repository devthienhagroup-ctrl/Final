import React, { useMemo } from "react";
import { safeJsonParse } from "../app/utils";

export function JsonEditor({
  value,
  onChange,
  error,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
}) {
  const lines = useMemo(() => value.split("\n").length, [value]);

  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div className="h2">JSON Editor</div>
        <div className="pill">{lines} lines</div>
      </div>

      <div className="sep" />

      <textarea
        className="textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || `{\n  "title": "..." \n}`}
        spellCheck={false}
      />

      {error ? (
        <div style={{ marginTop: 10 }} className="card">
          <div style={{ fontWeight: 950, color: "rgba(239,68,68,.95)" }}>JSON lỗi</div>
          <div className="muted" style={{ marginTop: 6 }}>{error}</div>
        </div>
      ) : null}
    </div>
  );
}

export function validateJson(text: string) {
  if (!text.trim()) return { ok: true as const, value: {} };
  return safeJsonParse<any>(text);
}
