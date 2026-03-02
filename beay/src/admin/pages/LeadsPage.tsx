import React, { useEffect, useState } from "react";
import { adminListLeads, type LeadRow, type LeadType } from "../api/leads.api";
import { useAuth } from "../app/auth.store";
import { useToast } from "../components/Toast";
import { AppAlert } from "../components/AppAlert";

export function LeadsPage() {
  const { token } = useAuth();
  const toast = useToast();

  const [type, setType] = useState<LeadType>("book");
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load(t: LeadType) {
    setLoading(true);
    try {
      const data = await adminListLeads(token, t);
      setRows(data);
    } catch (e: any) {
      toast.push({ kind: "err", title: "Load leads failed", detail: e?.message || String(e) });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(type);
  }, [type]);

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card hero-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div className="h1">Leads</div>
            <div className="muted" style={{ marginTop: 6 }}>Book / Talk submissions với điều hướng rõ ràng.</div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className={`btn ${type === "book" ? "btn-primary" : ""}`} onClick={() => setType("book")}>BOOK</button>
            <button className={`btn ${type === "talk" ? "btn-primary" : ""}`} onClick={() => setType("talk")}>TALK</button>
            <button className="btn" onClick={() => load(type)} disabled={loading}>{loading ? "Loading…" : "Refresh"}</button>
          </div>
        </div>
      </div>

      <AppAlert
        kind="success"
        title="Mẹo thao tác"
        message="Bạn có thể chuyển đổi BOOK/TALK để phân loại lead nhanh hơn trước khi xuất dữ liệu."
      />

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Created</th>
              <th>Lang</th>
              <th>Contact</th>
              <th>Info</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td><code>{r.id}</code></td>
                <td className="muted">{r.createdAt || ""}</td>
                <td className="muted">{r.lang || "-"}</td>
                <td>
                  <div style={{ fontWeight: 800 }}>
                    {type === "book" ? (r.name || "-") : (r.contact || "-")}
                  </div>
                  <div className="muted">
                    {type === "book" ? (r.phone || "-") : (r.topic || "-")}
                  </div>
                </td>
                <td className="muted" style={{ whiteSpace: "pre-wrap" }}>
                  {type === "book"
                    ? `date=${r.date || "-"} time=${r.time || "-"}\nnote=${r.note || ""}`
                    : `${r.message || ""}`}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted">No leads.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
