import React, { useMemo } from "react";

export type ChecklistItem = { key: string; label: string };

export function ChecklistCard(props: {
  items: ChecklistItem[];
  value: Record<string, boolean>;
  onChange: (v: Record<string, boolean>) => void;
  onSave: () => void;
}) {
  const done = useMemo(() => props.items.filter((i) => !!props.value[i.key]).length, [props.items, props.value]);

  return (
    <div className="card p-6" id="settings">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-slate-500">Thiết lập nhanh</div>
          <div className="text-lg font-extrabold">Checklist go-live</div>
          <div className="mt-1 text-sm text-slate-600">Lưu trạng thái checklist (local).</div>
        </div>
        <span className="chip">
          <i className="fa-solid fa-rocket text-amber-600 mr-1" /> {done}/{props.items.length}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {props.items.map((i) => (
          <label key={i.key} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 ring-1 ring-slate-200">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={!!props.value[i.key]}
              onChange={(e) => props.onChange({ ...props.value, [i.key]: e.target.checked })}
            />
            <span className="text-sm font-extrabold">{i.label}</span>
          </label>
        ))}
      </div>

      <button className="mt-2 w-full btn btn-primary" onClick={props.onSave}>
        Lưu cấu hình
      </button>

      <div className="mt-3 text-xs text-slate-500">
        Khi tách React/Nest: map sang Settings module + RBAC.
      </div>
    </div>
  );
}