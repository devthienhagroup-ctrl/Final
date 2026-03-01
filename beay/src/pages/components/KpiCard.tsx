import React from "react";

type Tone = "emerald" | "amber" | "cyan" | "indigo";

export function KpiCard(props: {
  title: string;
  value: string;
  hint: string;
  icon: string;
  tone: Tone;
}) {
  const bg =
    props.tone === "emerald" ? "bg-emerald-100 text-emerald-700"
    : props.tone === "amber" ? "bg-amber-100 text-amber-700"
    : props.tone === "cyan" ? "bg-cyan-100 text-cyan-700"
    : "bg-indigo-100 text-indigo-700";

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold text-slate-500">{props.title}</div>
          <div className="mt-2 text-3xl font-extrabold">{props.value}</div>
          <div className="mt-2 text-sm text-slate-600 font-semibold">
            {props.hint}
          </div>
        </div>
        <div className={`h-11 w-11 rounded-2xl flex items-center justify-center ${bg}`}>
          <i className={`fa-solid fa-${props.icon}`} />
        </div>
      </div>
    </div>
  );
}