import React from "react";
import { useNavigate } from "react-router-dom";

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <div className="card">
        <div className="h1">404</div>
        <div className="muted" style={{ marginTop: 6 }}>Không có route này.</div>
        <div className="sep" />
        <button type="button" className="btn btn-primary" onClick={() => navigate(-1)}>Quay lại</button>
      </div>
    </div>
  );
}
