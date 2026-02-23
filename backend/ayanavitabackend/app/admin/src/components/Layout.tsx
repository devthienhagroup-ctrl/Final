import React from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../app/auth.store";
import { ToastProvider } from "./Toast";

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `btn ${isActive ? "btn-primary" : ""}`}
    >
      {label}
    </NavLink>
  );
}

export function Layout() {
  const { token, logout } = useAuth();
  const nav = useNavigate();

  return (
    <ToastProvider>
      <div className="topbar">
        <div className="row">
          <Link to="/" className="brand" aria-label="Home">
            <span className="dot" aria-hidden="true" />
            <div>
              <span className="g-text">AYANAVITA Admin</span>
              <div className="muted" style={{ fontSize: 12, fontWeight: 900, marginTop: 2 }}>
                CMS • Leads • Publish
              </div>
            </div>
          </Link>

          <div className="nav">
            <NavItem to="/cms/pages" label="CMS Pages" />
            <NavItem to="/leads" label="Leads" />

            <span className="pill" title="JWT token (short)">
              {token ? `${token.slice(0, 10)}…` : "no-token"}
            </span>

            <button
              className="btn btn-danger"
              type="button"
              onClick={() => {
                logout();
                nav("/login", { replace: true });
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        <Outlet />
      </div>
    </ToastProvider>
  );
}
