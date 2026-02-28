import React from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../app/auth.store";
import { ToastProvider } from "./Toast";

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink to={to} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
      {label}
    </NavLink>
  );
}

export function Layout() {
  const { token, logout } = useAuth();
  const nav = useNavigate();

  return (
    <ToastProvider>
      <div className="app-shell">
        <aside className="side-nav">
          <Link to="/" className="brand" aria-label="Home">
            <span className="dot" aria-hidden="true" />
            <div>
              <span className="g-text">AYANAVITA Admin</span>
              <div className="muted" style={{ fontSize: 12, fontWeight: 800, marginTop: 2 }}>
                Modern control center
              </div>
            </div>
          </Link>

          <div className="nav-list">
            <NavItem to="/" label="Trang chủ" />
            <NavItem to="/cms/pages" label="CMS Pages" />
            <NavItem to="/leads" label="Leads" />
            <NavItem to="/catalog/products" label="Products" />
            <NavItem to="/catalog/crud" label="Catalog CRUD" />
            <NavItem to="/orders" label="Orders" />
          </div>

          <div className="side-footer">
            <span className="pill" title="JWT token (short)">
              {token ? `${token.slice(0, 12)}…` : "no-token"}
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
        </aside>

        <main className="main-content">
          <div className="container">
            <Outlet />
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
