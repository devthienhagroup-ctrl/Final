import React from "react";
import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <div className="card">
        <div className="h1">404</div>
        <div className="muted" style={{ marginTop: 6 }}>Không có route này.</div>
        <div className="sep" />
        <Link to="/" className="btn btn-primary">Về trang chính</Link>
      </div>
    </div>
  );
}
